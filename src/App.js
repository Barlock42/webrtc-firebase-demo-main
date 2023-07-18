import "./App.css";
import React, { useRef, useState } from "react";
import Button from "./components/button";
import Video from "./components/video";

const App = () => {
  const [stream, setStream] = useState(null);
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [isCamVisible, setIsCamVisible] = useState(false);
  const videoRef = useRef(null);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const stopWebcam = () => {
    if (stream) {
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
              color={!isCamVisible ? "green" : "red"}
              text={!isCamVisible ? "Включить камеру" : "Выключить камеру"}
              clickHandler={!isCamVisible ? startWebcam : stopWebcam}
              toggleVisibility={toggleCamVisibility}
            ></Button>
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
