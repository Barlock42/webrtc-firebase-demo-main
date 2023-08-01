import "./App.css";
import React, { useRef, useState, useEffect } from "react";
import Button from "./components/button";
import Video from "./components/video";

import firebaseConfig from "./firebaseConfig.js";
import { initializeApp } from "firebase/app";
import {
  doc,
  collection,
  getFirestore,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const App = () => {
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [isLocaleCamVisible, setIsLocaleCamVisible] = useState(false);
  const [isRemoteCamVisible, setIsRemoteCamVisible] = useState(false);
  const [isMikeOn, setIsMikeOn] = useState(false);
  const [isAcceptingCall, setIsAcceptingCall] = useState(false);
  const localMediaRef = useRef(null);
  const remoteMediaRef = useRef(null);
  const callId = useRef(null);

  // Global State
  const pcRef = useRef(null); // Create a ref to store the RTCPeerConnection object.
  // Initialize RTCPeerConnection only once when the component mounts.
  useEffect(() => {
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

    pcRef.current = new RTCPeerConnection(servers);
  }, []);

  localStream.current = new MediaStream();
  remoteStream.current = new MediaStream();

  // Initialize Firebase with the provided firebaseConfig
  initializeApp(firebaseConfig);
  const firestore = getFirestore();

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const videoTrack = mediaStream.getVideoTracks()[0];

      // Set local stream
      if (localStream.current !== null && localStream.current.getAudioTracks().length > 0) {
        localStream.current.addTrack(videoTrack);
        // Push tracks from local stream to peer connection
        if (pcRef.current) {
          const audioTrack = localStream.current.getAudioTracks()[0];
          pcRef.current.addTrack(videoTrack, mediaStream);
          pcRef.current.addTrack(audioTrack, mediaStream);
          console.log(pcRef.current);
        }
      } else {
        localStream.current = mediaStream;
        if (pcRef.current) {
          pcRef.current.addTrack(videoTrack, mediaStream);
          console.log(pcRef.current);
        }
      }

      if (localMediaRef.current) {
        localMediaRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Ошибка доступа к камере:", error);
    }
  };

  const stopWebcam = () => {
    if (localStream.current) {
      if (pcRef.current) {
        console.log(pcRef.current);
        const videoTrack = localStream.current.getVideoTracks()[0];
        const videoSender = pcRef.current
          .getSenders()
          .find((sender) => sender.track === videoTrack);

        if (videoSender) {
          pcRef.current.removeTrack(videoSender);
        }
        // console.log(pcRef.current);
      }

      if (localStream.current.getAudioTracks().length > 0) {
        localStream.current.getVideoTracks()[0].stop();
        localStream.current.removeTrack(localStream.getVideoTracks()[0]);
      } else {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
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

      if (localStream.current !== null && localStream.current.getVideoTracks().length > 0) {
        localStream.current.addTrack(audioTrack);
        if (pcRef.current) {
          const videoTrack = localStream.current.getVideoTracks()[0];
          pcRef.current.addTrack(videoTrack, mediaStream);
          pcRef.current.addTrack(audioTrack, mediaStream);
          console.log(pcRef.current);
        }
      } else {
        localStream.current = mediaStream;
        if (pcRef.current) {
          pcRef.current.addTrack(audioTrack, mediaStream);
          console.log(pcRef.current);
        }
      }
      if (localMediaRef.current) {
        localMediaRef.current.srcObject = mediaStream;
        localMediaRef.current.play();
      }
    } catch (error) {
      console.error("Ошибка доступа к микрофону:", error);
    }
  };

  const stopMike = () => {
    if (localStream.current) {
      setIsMikeOn(false);
      if (localStream.current.getVideoTracks().length > 0) {
        localStream.current.removeTrack(localStream.current.getAudioTracks()[0]);
      } else {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }

      if (pcRef.current) {
        console.log(pcRef.current);
        const audioTrack = localStream.current.getAudioTracks()[0];
        const audioSender = pcRef.current
          .getSenders()
          .find((sender) => sender.track === audioTrack);

        if (audioSender) {
          pcRef.current.removeTrack(audioSender);
        }
        // console.log(pcRef.current);
      }
    }
  };

  const toggleVisibility = async () => {
    setIsComponentVisible((prevVisibility) => !prevVisibility);

    // Push tracks from local stream to peer connection
    localStream.current.getTracks().forEach((track) => {
      pcRef.current.addTrack(track, localStream.current);
    });

    // Pull tracks from remote stream, add to video stream
    pcRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
    };

    // Reference Firestore collections for signaling
    const callCollection = collection(firestore, "calls");
    const callDoc = doc(callCollection); // Automatically generates a new document ID
    // Set callId
    callId.current = callDoc.id;
    const offerCandidatesRef = collection(firestore, "offerCandidates");
    const answerCandidatesRef = collection(firestore, "answerCandidates");
    // Get candidates for caller, save to db
    pcRef.current.onicecandidate = async (event) => {
      console.log("Entered onicecandidate");
      if (event.candidate) {
        // Convert candidate to JSON representation
        const candidateJson = event.candidate.toJSON();

        try {
          // Save the candidate data to the 'offerCandidates' collection in Firestore
          const docRef = await addDoc(offerCandidatesRef, candidateJson);
          console.log("Candidate saved with ID: ", docRef.id);
        } catch (error) {
          console.error("Error adding candidate: ", error);
        }
      }
    };

    // Create an offer
    const offerDescription = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
    const timestamp = serverTimestamp();

    // Use serverTimestamp here
    await setDoc(callDoc, { offer, timestamp });

    // Subscribe to changes using onSnapshot and Listen for remote answer
    onSnapshot(callDoc, (docSnapshot) => {
      // Handle document snapshot changes here
      const data = docSnapshot.data();
      if (!pcRef.current.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pcRef.current.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    onSnapshot(answerCandidatesRef, (docSnapshot) => {
      docSnapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pcRef.current.addIceCandidate(candidate);
        }
      });
    });
  };

  const toggleAcceptingCall = async () => {
    setIsComponentVisible((prevVisibility) => !prevVisibility);
  };

  const acceptCall = async () => {
    setIsComponentVisible((prevVisibility) => !prevVisibility);
    setIsAcceptingCall((prevVisibility) => !prevVisibility);
    setIsRemoteCamVisible((prevVisibility) => !prevVisibility);

    remoteStream.current = new MediaStream();
    console.log(remoteStream.current);
    // Pull tracks from remote stream, add to video stream
    console.log(pcRef.current);
    pcRef.current.ontrack = (event) => {
      console.log(event);
      event.streams[0].getTracks().forEach((track) => {
        console.log(track);
        remoteStream.current.addTrack(track);
        console.log(remoteMediaRef.current);
        if (remoteMediaRef.current) {
          remoteMediaRef.current.srcObject = remoteStream.current;
          remoteMediaRef.current.play();
        }
      });
    };

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
          // console.log("ID of the last offer document:", lastCallId);
          // TODO: Completely change this temp Solution
          const callCollectionRef = collection(firestore, "calls");
          const callDoc = doc(callCollectionRef, lastCallId);
          const offerCandidates = collection(firestore, "offerCandidates");
          const answerCandidates = collection(firestore, "answerCandidates");

          pcRef.current.onicecandidate = (event) => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
          };

          const callDataSnapshot = await getDoc(callDoc);
          const callData = callDataSnapshot.data();

          const offerDescription = callData.offer;
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(offerDescription)
          );

          const answerDescription = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answerDescription);

          const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
          };

          await updateDoc(callDoc, answer);

          onSnapshot(offerCandidates, (docSnapshot) => {
            docSnapshot.docChanges().forEach((change) => {
              console.log(change);
              if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                pcRef.current.addIceCandidate(candidate);
              }
            });
          });
        } else {
          console.log("No offer documents found.");
        }
      })
      .catch((error) => {
        console.log("Error getting offer documents:", error);
      });
  };

  // TODO Refactor
  const toggleCamVisibility = () => {
    setIsLocaleCamVisible((prevVisibility) => !prevVisibility);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: "flex" }}>
          {isLocaleCamVisible && <Video videoRef={localMediaRef}></Video>}
          {isRemoteCamVisible && <Video videoRef={remoteMediaRef}></Video>}
        </div>
        {isComponentVisible && (
          <div style={{ display: "flex" }}>
            <Button
              color={!isLocaleCamVisible ? "#25D366" : "red"}
              text={
                !isLocaleCamVisible ? "Включить камеру" : "Выключить камеру"
              }
              clickHandler={!isLocaleCamVisible ? startWebcam : stopWebcam}
              toggleVisibility={toggleCamVisibility}
            ></Button>
            <Button
              color={!isMikeOn ? "#25D366" : "red"}
              text={!isMikeOn ? "Включить микрофон" : "Выключить микрофон"}
              clickHandler={!isMikeOn ? startMike : stopMike}
              toggleVisibility={() => { }}
            ></Button>
            {isMikeOn && <audio ref={localMediaRef} autoPlay />}
            {isAcceptingCall ? (
              <Button
                color={"red"}
                text={"Положить трубку"}
                clickHandler={stopWebcam}
                toggleVisibility={toggleAcceptingCall}
              ></Button>
            ) : (
              <Button
                color={"red"}
                text={"Положить трубку"}
                clickHandler={stopWebcam}
                toggleVisibility={toggleVisibility}
              ></Button>
            )}
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
