import "./App.css";
import React, { useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";

const WebcamVideo = () => {
  const [stream, setStream] = useState(null);
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

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
          color: "white",
        }}
      />
      <button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#25D366",
          color: "#FFFFFF",
          borderRadius: "50%",
          width: "80px",
          height: "80px",
          margin: "10px",
          border: "none",
          outline: "none",
          cursor: "pointer",
        }}
        onClick={startWebcam}
      >
        Камера
      </button>
    </>
  );
};

const App = () => {
  const handleClick = () => {
    const newWindow = window.open("", "", "height=600,width=800");
    newWindow.document.body.innerHTML = `<div class="callModal" style="
      background-color: #282c34;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: calc(10px + 2vmin);
      color: white;"></div>`;
    newWindow.document.documentElement.style.margin = "0";
    newWindow.document.body.style.margin = "0";

    newWindow.document.querySelector(".callModal").innerHTML = `
     ${ReactDOMServer.renderToString(<WebcamVideo />)}
      <button
        style="
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #E45649;
          color: #FFFFFF;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          margin: 10px;
          border: none;
          outline: none;
          cursor: pointer;
        "
        onclick="window.close()"
      >
        Положить трубку
      </button>
    `;
  };

  return (
    <div className="App">
      <header className="App-header">
        <button className="App-button" onClick={handleClick}>
          Start call
        </button>
      </header>
    </div>
  );
};

export default App;
