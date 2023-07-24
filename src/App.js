import "./App.css";
import React, { useRef, useState } from "react";
import Button from "./components/button";
import Video from "./components/video";

import firebaseConfig from "./firebaseConfig.js";
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const App = () => {
  const [stream, setStream] = useState(null);
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [isCamVisible, setIsCamVisible] = useState(false);
  const [isMikeOn, setIsMikeOn] = useState(false);
  const mediaRef = useRef(null);

  
// Initialize Firebase with the provided firebaseConfig
  initializeApp(firebaseConfig);
  const firestore = getFirestore();
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // Global State
  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const videoTrack = mediaStream.getVideoTracks()[0];

      if (stream !== null && stream.getAudioTracks().length > 0) {
        stream.addTrack(videoTrack);
      } else {
        setStream(mediaStream);
      }

      if (mediaRef.current) {
        mediaRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Ошибка доступа к камере:", error);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      if (stream.getAudioTracks().length > 0) {
        stream.getVideoTracks()[0].stop();
        stream.removeTrack(stream.getVideoTracks()[0]);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  };

  const startMike = async () => {
    try {
      setIsMikeOn(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const audioTrack = mediaStream.getAudioTracks()[0];

      if (stream !== null && stream.getVideoTracks().length > 0) {
        stream.addTrack(audioTrack);
      } else {
        setStream(mediaStream);
      }
      if (mediaRef.current) {
        mediaRef.current.srcObject = mediaStream;
        mediaRef.current.play();
      }
    } catch (error) {
      console.error("Ошибка доступа к микрофону:", error);
    }
  };

  const stopMike = () => {
    if (stream) {
      setIsMikeOn(false);
      if (stream.getVideoTracks().length > 0) {
        stream.removeTrack(stream.getAudioTracks()[0]);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  };

  const toggleVisibility = () => {
    setIsComponentVisible((prevVisibility) => !prevVisibility);
  };

  // TODO Refactor
  const toggleCamVisibility = async () => {
    setIsCamVisible((prevVisibility) => !prevVisibility);

    // Reference Firestore collections for signaling
    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");
    // Get candidates for caller, save to db
    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    // Listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        {isCamVisible && <Video videoRef={mediaRef}></Video>}
        {isComponentVisible && (
          <div style={{ display: "flex" }}>
            <Button
              color={!isCamVisible ? "#25D366" : "red"}
              text={!isCamVisible ? "Включить камеру" : "Выключить камеру"}
              clickHandler={!isCamVisible ? startWebcam : stopWebcam}
              toggleVisibility={toggleCamVisibility}
            ></Button>
            <Button
              color={!isMikeOn ? "#25D366" : "red"}
              text={!isMikeOn ? "Включить микрофон" : "Выключить микрофон"}
              clickHandler={!isMikeOn ? startMike : stopMike}
              toggleVisibility={() => {}}
            ></Button>
            {isMikeOn && <audio ref={mediaRef} autoPlay />}
            <Button
              color={"red"}
              text={"Положить трубку"}
              clickHandler={stopWebcam}
              toggleVisibility={toggleVisibility}
            ></Button>
          </div>
        )}
        {!isComponentVisible && (
          <button className="App-button" onClick={toggleVisibility}>
            Начать звонок
          </button>
        )}
      </header>
    </div>
  );
};

export default App;
