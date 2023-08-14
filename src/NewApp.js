import "./App.css";
import React, { useRef, useState } from "react";
import Button from "./components/button";
import Video from "./components/video";

import firebaseConfig from "./firebaseConfig.js";
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    collection,
    addDoc,
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
            urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
                "stun:stun.services.mozilla.com",
            ],
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
    const [isLocalCamVisible, setIsLocalCamVisible] = useState(false);
    const [isRemoteCamVisible, setIsRemoteCamVisible] = useState(false);
    const webcamVideoRef = useRef(new MediaStream());
    const remoteVideoRef = useRef(new MediaStream());
    const pcRef = useRef(new RTCPeerConnection(servers));
    const callId = useRef(null);

    // Initialize Firebase with the provided firebaseConfig
    initializeApp(firebaseConfig);
    const firestore = getFirestore();

    const setupWebRTC = async () => {
        try {
            // Push tracks from local stream to peer connection
            localStreamRef.current.getTracks().forEach((track) => {
                console.log(track);
                pcRef.current.addTrack(track, localStreamRef.current);
            });

            // Pull tracks from remote stream, add to video stream
            pcRef.current.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track) => {
                    console.log(track);
                    remoteStreamRef.current.addTrack(track);
                });
            };

            webcamVideoRef.current.srcObject = localStreamRef.current;
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        } catch (error) {
            console.error('Error setting up WebRTC:', error);
        }
    }

    const startWebcam = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            const videoTrack = mediaStream.getVideoTracks()[0];

            // Set local stream
            if (localStreamRef.current !== null && localStreamRef.current.getAudioTracks().length > 0) {
                localStreamRef.current.addTrack(videoTrack);
                // Push tracks from local stream to peer connection
                if (pcRef.current) {
                    const audioTrack = localStreamRef.current.getAudioTracks()[0];
                    pcRef.current.addTrack(videoTrack, localStreamRef.current);
                    pcRef.current.addTrack(audioTrack, localStreamRef.current);
                    console.log(pcRef.current);
                }
            } else {
                localStreamRef.current = mediaStream;
                if (pcRef.current) {
                    console.log(videoTrack);
                    console.log(localStreamRef.current);
                    pcRef.current.addTrack(videoTrack, localStreamRef.current);
                    console.log(pcRef.current);
                }
            }

            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = localStreamRef.current;
            }

            // Set remote stream
            // Pull tracks from remote stream, add to video stream
            pcRef.current.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track) => {
                    console.log(track);
                    remoteStreamRef.current.addTrack(track);
                });
            };

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current
            }
        } catch (error) {
            console.error("Ошибка доступа к камере:", error);
        }
    }

    const stopWebcam = () => {
        if (localStreamRef.current) {
            if (pcRef.current) {
                //console.log(pcRef.current);
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                const videoSender = pcRef.current
                    .getSenders()
                    .find((sender) => sender.track === videoTrack);

                if (videoSender) {
                    pcRef.current.removeTrack(videoSender);
                }
                //console.log(pcRef.current);
            }

            if (localStreamRef.current.getAudioTracks().length > 0) {
                localStreamRef.current.getVideoTracks()[0].stop();
                localStreamRef.current.removeTrack(localStreamRef.getVideoTracks()[0]);
            } else {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
        }
    };

    const startCall = async () => {
        //console.log("Started call.")
        toggleStartingCallVisibility();
        setupWebRTC();

        // Reference Firestore collections for signaling
        const callCollection = collection(firestore, "calls");
        const callDoc = doc(callCollection); // Automatically generates a new document ID
        // Set callId
        callId.current = callDoc.id;
        const offerCandidatesRef = collection(firestore, "offerCandidates");
        const answerCandidatesRef = collection(firestore, "answerCandidates");

        // Get candidates for caller, save to db
        pcRef.current.onicecandidate = async (event) => {
            console.log(" Getting candidates for caller...")
            event.candidate && await addDoc(offerCandidatesRef, event.candidate.toJSON());
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

    const toggleCamVisibility = async () => {
        setIsLocalCamVisible((prevVisibility) => !prevVisibility);
        setIsRemoteCamVisible((prevVisibility) => !prevVisibility);
    }

    const toggleStartingCallVisibility = async () => {
        setIsStartingCall((prevVisibility) => !prevVisibility);
    }

    const toggleAcceptingCallVisibility = async () => {
        setIsAcceptingCall((prevVisibility) => !prevVisibility);
    }

    return (
        <div className="App">
            <header className="App-header">
                <div style={{ display: "flex" }}>
                    {isLocalCamVisible && <Video videoRef={webcamVideoRef}></Video>}
                    {isRemoteCamVisible && <Video videoRef={remoteVideoRef}></Video>}
                </div>
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
                        color={!isLocalCamVisible ? "#25D366" : "red"}
                        text={
                            !isLocalCamVisible ? "Включить камеру" : "Выключить камеру"
                        }
                        clickHandler={!isLocalCamVisible ? startWebcam : stopWebcam}
                        toggleVisibility={toggleCamVisibility}
                    ></Button>
                    <Button
                        color={"red"}
                        text={"Положить трубку"}
                        clickHandler={stopWebcam}
                        toggleVisibility={toggleStartingCallVisibility}
                    ></Button>
                </div>}
                {isAcceptingCall && <div style={{ display: "flex" }}>
                    <Button
                        color={!isLocalCamVisible ? "#25D366" : "red"}
                        text={
                            !isLocalCamVisible ? "Включить камеру" : "Выключить камеру"
                        }
                        clickHandler={!isLocalCamVisible ? startWebcam : stopWebcam}
                        toggleVisibility={toggleCamVisibility}
                    ></Button>
                    <Button
                        color={"red"}
                        text={"Положить трубку"}
                        clickHandler={stopWebcam}
                        toggleVisibility={toggleAcceptingCallVisibility}
                    ></Button>
                </div>}
            </header>
        </div>
    );
}

export default App;