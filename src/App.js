import "./App.css";
import React, { useRef, useState } from "react";
import Button from "./components/button";
import Video from "./components/video";
import Audio from "./components/audio";

const App = () => {
  const [stream, setStream] = useState(null);
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [isCamVisible, setIsCamVisible] = useState(false);
  const [isMikeOn, setIsMikeOn] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

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
        audio: true,
      });
      setStream(mediaStream);
      console.log(videoRef.current);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Ошибка доступа к камере:", error);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startMike = async () => {
    try {
      setIsMikeOn(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      setStream(mediaStream);
      console.log(audioRef.current);
      if (audioRef.current) {
        audioRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Ошибка доступа к микрофону:", error);
    }
  };

  const stopMike = () => {
    if (stream) {
      setIsMikeOn(false);
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
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
        {isCamVisible && <Video videoRef={videoRef}></Video>}
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
            {/* {isMikeOn  && <Audio audioRef={audioRef}></Audio>} */}
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
