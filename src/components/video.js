import React from "react";

function Video({ videoRef }) {
    const style = {
        display: "flex",
        justifyContent: "center",
        marginBottom: "20px",
        color: "white"
      };


    return <video
          ref={videoRef}
          autoPlay
          playsInline
          style = {style}
        ></video>
}

export default Video;
