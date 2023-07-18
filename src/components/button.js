import React from "react";

function Button({ color, text, clickHandler, toggleVisibility }) {
  const styles = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color,
    color: "#FFFFFF",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    margin: "10px",
    border: "none",
    outline: "none",
    cursor: "pointer",
  };

  const handleClick = () => {
    clickHandler(); // Call the original click handler
    toggleVisibility(); // Toggle the visibility state
  };

  return (
    <button style={styles} onClick={handleClick}>
      {text}
    </button>
  );
}
export default Button;
