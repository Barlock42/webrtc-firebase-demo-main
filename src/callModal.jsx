const callModal = () => {
  const videosStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
    <videos>
      <div className="videos" style={videosStyle}>
        <span>
          <h3>Local Stream</h3>
          <video id="webcamVideo" autoPlay playsInline></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video id="remoteVideo" autoPlay playsInline></video>
        </span>
      </div>
    </videos>
    <button id="webcamButton">Start webcam</button>
    <h2>2. Create a new Call</h2>
    <button id="callButton" disabled>Create Call (offer)</button>

    <h2>3. Join a Call</h2>
    <p>Answer the call from a different browser window or device</p>
    
    <input id="callInput" />
    <button id="answerButton" disabled>Answer</button>

    <h2>4. Hangup</h2>

    <button id="hangupButton" disabled>Hangup</button>
    </>
  );
};

export default callModal;
