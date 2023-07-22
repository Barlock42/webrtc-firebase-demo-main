import "./App.css";
import React, { useRef, useState } from "react";
import Button from "./components/button";
import Video from "./components/video";

const App = () => {
  const [stream, setStream] = useState(null);
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [isCamVisible, setIsCamVisible] = useState(false);
  const [isMikeOn, setIsMikeOn] = useState(false);
  const mediaRef = useRef(null);

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
  // const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const videoTrack = mediaStream.getVideoTracks()[0];

      if (stream !== null && stream.getAudioTracks().length > 0) {
        console.log(mediaRef.current);
        stream.addTrack(videoTrack);
      } else {
        setStream(mediaStream);
        console.log(mediaRef.current);
        if (mediaRef.current) {
          mediaRef.current.srcObject = mediaStream;
        }
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
        console.log(mediaRef.current);
        stream.addTrack(audioTrack);
      } else {
        setStream(mediaStream);
        console.log(mediaRef.current);
        if (mediaRef.current) {
          mediaRef.current.srcObject = mediaStream;
          mediaRef.current.play();
        }
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
            {isMikeOn && <audio ref={mediaRef} autoPlay/>}
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
