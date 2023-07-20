import React from "react";

function Audio({ audioRef }) {

    return <audio
          ref={audioRef}
          autoPlay
          playsInline
        ></audio>
}

export default Audio;
