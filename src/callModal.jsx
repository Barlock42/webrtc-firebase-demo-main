import React from 'react';

const CallModal = () => {
  const callModalStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    backgroundColor: '#282c34'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  };

  const actionButtonStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25D366',
    color: '#FFFFFF',
    borderRadius: '50%',
    width: '80px',
    height: '80px',
    margin: '10px',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={callModalStyle}>
      <div style={rowStyle}>
          <video id="webcamVideo" autoPlay playsInline></video>
          <video id="remoteVideo" autoPlay playsInline></video>
      </div>
      <div style={rowStyle}>
      <button style={actionButtonStyle} id="chatButton">
          <i className="material-icons">динамик</i>
        </button>
        <button style={actionButtonStyle} id="videoButton">
          <i className="material-icons">камера</i>
        </button>
        <button style={actionButtonStyle} id="muteButton">
          <i className="material-icons">микрофон</i>
        </button>
        <button style={actionButtonStyle} id="hangupButton">
          <i className="material-icons">завершить звонок</i>
        </button>
      </div>
    </div>
  );
};

export default CallModal;
