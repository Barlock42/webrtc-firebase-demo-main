import "./App.css";
import React, { useRef, useState } from "react";
import Button from "./components/button";
import Video from "./components/video";

const App = () => {
  const [stream, setStream] = useState(null);
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const videoRef = useRef(null);

  const startWebcam = async () => {
    toggleVisibility();
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
    console.log("click")
    setIsComponentVisible((prevVisibility) => !prevVisibility);
  };

  return (
    <div className="App">
      <header className="App-header">
        {isComponentVisible && <Video videoRef={videoRef}></Video>}
        {isComponentVisible && (
          <Button
            color={"red"}
            text={"Положить трубку"}
            clickHandler={stopWebcam}
            toggleVisibility={toggleVisibility}
          ></Button>
        )}
        {!isComponentVisible && (
          <button className="App-button" onClick={startWebcam}>
            Начать звонок
          </button>
        )}
      </header>
    </div>
  );
};

export default App;
