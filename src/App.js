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
    getDoc,
    getDocs,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    limit
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
                    const callId = lastCallId;
                    const callCollectionRef = collection(firestore, "calls");
                    const callDoc = doc(callCollectionRef, callId);
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