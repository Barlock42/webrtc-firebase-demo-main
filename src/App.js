import dbRef, { userName, connectorRef } from "./server/firebase";
import "./App.css";
import { useEffect } from "react";

const App = () => {
    const participantRef = dbRef.child("participants");

    // 1.) Component mounts -› effect runs -> creates listener
    // 2.) Component unmounts -> clean up -> remove listener
    // 3.) Component mounts -> effect runs -> creates listener 
    useEffect(() => {
        const handleValueChange = (snap) => {
            if (snap.val()) {
                const defaultPreference = {
                    audio: true,
                    video: false,
                    screen: false,
                };
                // console.log("pushing")
                const userRef = participantRef.push({ userName, preferences: defaultPreference });
                userRef.onDisconnect().remove();
            }
        };
    
        connectorRef.on('value', handleValueChange);
    
        return () => {
            // Clean up the event listener and onDisconnect
            connectorRef.off('value', handleValueChange);
            participantRef.off('value'); // Clean up other listeners if needed
        };
    }, [participantRef]);
    

    return (
        <div className="App">
            <header className="App-header"></header>
            <div>{userName}</div>
        </div>);
}

export default App;