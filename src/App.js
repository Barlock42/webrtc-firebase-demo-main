import dbRef, { userName, connctorRef } from "./server/firebase";
import "./App.css";
import { useEffect } from "react";

const App = () => { 
    useEffect()
    return (
        <div className="App">
            <header className="App-header"></header>
            <div style={{ display: "flex" }}>
                {userName}
            </div>
        </div>);
}

export default App;