import "./App.css";
import React, { useRef, useState, useEffect } from "react";
import Button from "./components/button";
import Video from "./components/video";

import firebaseConfig from "./firebaseConfig.js";
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    collection,
    setDoc,
    onSnapshot,
    serverTimestamp,
} from "firebase/firestore";

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

const App = () => {
    // Global State
    const [isStartingCall, setIsStartingCall] = useState(false);
    const [isAcceptingCall, setIsAcceptingCall] = useState(false);
    const localStreamRef = useRef(new MediaStream());
    const remoteStreamRef = useRef(new MediaStream());
    const [isLocalCamVisibility, setIsLocalCamVisibility] = useState(false);
    const [isRemoteCamVisibility, setIsRemoteCamVisibility] = useState(false);
    const webcamVideoRef = useRef(new MediaStream());
    const remoteVideoRef = useRef(new MediaStream());
    const pcRef = useRef(new RTCPeerConnection(servers));
    const callId = useRef(null);

    // Initialize Firebase with the provided firebaseConfig
    initializeApp(firebaseConfig);
    const firestore = getFirestore();

    const setupWebRTC = async () => {
        try {
            localStreamRef.current.getTracks().forEach((track) => {
                pcRef.current.addTrack(track, localStreamRef.current);
            });

            pcRef.current.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track) => {
                    remoteStreamRef.current.addTrack(track);
                });
            };

            webcamVideoRef.current.srcObject = localStreamRef.current;
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        } catch (error) {
            console.error('Error setting up WebRTC:', error);
        }
    }

    const startCall = async () => {
        setIsStartingCall((prevVisibility) => !prevVisibility);
        setupWebRTC();

        // Reference Firestore collections for signaling
        const callCollection = collection(firestore, "calls");
        const callDoc = doc(callCollection); // Automatically generates a new document ID
        // Set callId
        callId.current = callDoc.id;
        const offerCandidatesRef = collection(firestore, "offerCandidates");
        const answerCandidatesRef = collection(firestore, "answerCandidates");

        // Get candidates for caller, save to db
        pcRef.current.onicecandidate = (event) => {
            event.candidate && offerCandidatesRef.add(event.candidate.toJSON());
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
    }

    const acceptCall = async () => {
        setIsAcceptingCall((prevVisibility) => !prevVisibility);
        setupWebRTC();

        const callId = callInput.value;
        const callDoc = firestore.collection('calls').doc(callId);
        const answerCandidates = callDoc.collection('answerCandidates');
        const offerCandidates = callDoc.collection('offerCandidates');

        pc.onicecandidate = (event) => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
        };

        const callData = (await callDoc.get()).data();

        const offerDescription = callData.offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await callDoc.update({ answer });

        offerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                console.log(change);
                if (change.type === 'added') {
                    let data = change.doc.data();
                    pc.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
    }

    const startWebcam = async () => {
    }

    const stopWebcam = async () => {
    }

    const toggleCamVisibility = async () => {
        
    }

    return (
        <div className="App">
            <header className="App-header">
                {!isStartingCall && !isAcceptingCall && <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button className="App-button" onClick={startCall}>
                        Начать звонок
                    </button>
                    <button className="App-button" onClick={acceptCall}>
                        Принять звонок
                    </button>
                </div>}
                {isStartingCall && <div style={{ display: "flex" }}>
                    <Button
                        color={!isLocalCamVisibility ? "#25D366" : "red"}
                        text={
                            !isLocalCamVisibility ? "Включить камеру" : "Выключить камеру"
                        }
                        clickHandler={!isLocalCamVisibility ? startWebcam : stopWebcam}
                        toggleVisibility={toggleCamVisibility}
                    ></Button>
                    <Button
                        color={"red"}
                        text={"Положить трубку"}
                        clickHandler={stopWebcam}
                        toggleVisibility={() => { }}
                    ></Button>
                </div>}
            </header>
        </div>
    );
}

export default App;