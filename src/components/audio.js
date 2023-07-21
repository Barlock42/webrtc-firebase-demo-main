import React from "react";

function Audio({ audioRef }) {

    return <audio
          ref={audioRef}
          autoPlay
        ></audio>
}

export default Audio;
