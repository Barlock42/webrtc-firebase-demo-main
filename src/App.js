import "./App.css";
import React, { useRef, useState } from "react";
import Button from "./components/button";
import Video from "./components/video";

import firebaseConfig from "./firebaseConfig.js";
import { initializeApp } from "firebase/app";
import {
  doc,
  collection,
  getFirestore,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const App = () => {
  const [localStream, setStream] = useState(null);
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [isCamVisible, setIsCamVisible] = useState(false);
  const [isMikeOn, setIsMikeOn] = useState(false);
  const [callId, setCallId] = useState(null);
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

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const videoTrack = mediaStream.getVideoTracks()[0];

      if (localStream !== null && localStream.getAudioTracks().length > 0) {
        localStream.addTrack(videoTrack);
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
    if (localStream) {
      if (localStream.getAudioTracks().length > 0) {
        localStream.getVideoTracks()[0].stop();
        localStream.removeTrack(localStream.getVideoTracks()[0]);
      } else {
        localStream.getTracks().forEach((track) => track.stop());
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

      if (localStream !== null && localStream.getVideoTracks().length > 0) {
        localStream.addTrack(audioTrack);
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
    if (localStream) {
      setIsMikeOn(false);
      if (localStream.getVideoTracks().length > 0) {
        localStream.removeTrack(localStream.getAudioTracks()[0]);
      } else {
        localStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  };

  const toggleVisibility = async () => {
    setIsComponentVisible((prevVisibility) => !prevVisibility);

    // Reference Firestore collections for signaling
    const callCollection = collection(firestore, "calls");
    const callDoc = doc(callCollection); // Automatically generates a new document ID
    // Set callId
    setCallId(callDoc.id);
    const offerCandidates = collection(firestore, "offerCandidates");
    const answerCandidates = collection(firestore, "answerCandidates");
    // Get candidates for caller, save to db
    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create an offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type
    };
    const timestamp = serverTimestamp();

    // Use serverTimestamp here
    await setDoc(callDoc, { offer, timestamp });

    // Subscribe to changes using onSnapshot and Listen for remote answer
    onSnapshot(callDoc, (docSnapshot) => {
      // Handle document snapshot changes here
      const data = docSnapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    onSnapshot(answerCandidates, (docSnapshot) => {
      docSnapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  const acceptCall = async () => {
    setIsCamVisible((prevVisibility) => !prevVisibility);
    // Answer the call with the unique ID
    const callsCollection = collection(firestore, "calls");
    // Create a query to get the latest offer document based on the 'timestamp' field
    const latestOfferQuery = query(
      callsCollection,
      orderBy("timestamp", "desc"),
      limit(1)
    );

    let lastCallId = null;
    // Execute the query to get the latest document
    getDocs(latestOfferQuery)
      .then(async (querySnapshot) => {
        if (!querySnapshot.empty) {
          // Get the ID of the last offer document
          lastCallId = querySnapshot.docs[0].id;
          console.log("ID of the last offer document:", lastCallId);
          // TODO: Completely change this temp Solution
          const callCollection = collection(firestore, `calls/${lastCallId}/offer` );
          const callDoc = doc(callCollection); // Automatically generates a new document ID\
          const offerCandidates = collection(firestore, "offerCandidates");
          const answerCandidates = collection(firestore, "answerCandidates");

          pc.onicecandidate = (event) => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
          };

          // Use serverTimestamp here
          // await getDoc(callDoc, { offer, timestamp });

          const callData = (await callDoc.get()).data();

          const offerDescription = callData.offer;
          await pc.setRemoteDescription(
            new RTCSessionDescription(offerDescription)
          );

          const answerDescription = await pc.createAnswer();
          await pc.setLocalDescription(answerDescription);
        } else {
          console.log("No offer documents found.");
        }
      })
      .catch((error) => {
        console.log("Error getting offer documents:", error);
      });

    // const answer = {
    //   type: answerDescription.type,
    //   sdp: answerDescription.sdp,
    // };

    // await callDoc.update({ answer });

    // offerCandidates.onSnapshot((snapshot) => {
    //   snapshot.docChanges().forEach((change) => {
    //     console.log(change);
    //     if (change.type === 'added') {
    //       let data = change.doc.data();
    //       pc.addIceCandidate(new RTCIceCandidate(data));
    //     }
    //   });
    // });
  };

  // TODO Refactor
  const toggleCamVisibility = () => {
    setIsCamVisible((prevVisibility) => !prevVisibility);
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
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="App-button" onClick={toggleVisibility}>
              Начать звонок
            </button>
            <button className="App-button" onClick={acceptCall}>
              Принять звонок
            </button>
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
