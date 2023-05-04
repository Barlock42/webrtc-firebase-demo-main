import "./App.css";
import ReactDOMServer from "react-dom/server";
import callModal from "./callModal";

const App = () => {
  const handleClick = () => {
    const newWindow = window.open("", "", "height=600,width=800");
    const callModalString = ReactDOMServer.renderToString(callModal());
    newWindow.document.body.innerHTML = `<div class="callModal">${callModalString}</div>`;
    // Define a function to close the new window
    function closeWindow() {
      newWindow.close();
    }

    // Add a button to the callModal that calls the closeWindow function
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close Window";
    closeButton.addEventListener("click", closeWindow);
    newWindow.document.querySelector(".callModal").appendChild(closeButton);
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
