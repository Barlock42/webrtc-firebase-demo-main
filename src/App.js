import dbRef, { userName, connectorRef } from "./server/firebase";
import "./App.css";
import { useEffect } from "react";
import { connect } from "react-redux"
import { setUser, addParticipant, removeParticipant } from "./store/actionCreator";
import { MainScreen } from "./components/MainScreen/MainScreen.js";

const App = (props) => {
    const participantRef = dbRef.child("participants");

    // 1.) Component mounts -› effect runs -> creates listener
    // 2.) Component unmounts -> clean up -> remove listener
    // 3.) Component mounts -> effect runs -> creates listener 
    useEffect(() => {
        const handleValueChange = (snap) => {
            if (snap.val()) {
                const defaultPreferences = {
                    audio: true,
                    video: false,
                    screen: false,
                };
                // console.log("pushing")
                const userRef = participantRef.push({ userName, preferences: defaultPreferences });
                props.setUser({
                    [userRef.key]: { userName, ...defaultPreferences }
                });
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

    useEffect(() => {
        if (props.user) {
            participantRef.on("child_added", handleChildAdded)
            participantRef.on("child_removed", handleChildRemoved);
        }

        const handleChildAdded = (snap) => {
            const { userName, preferences } = snap.val();
            props.addParticipant({ [snap.key]: { userName, ...preferences } });
        };

        const handleChildRemoved = (snap) => {
            props.removeParticipant([snap.key]);
        };
    }, [props.user]);

    return (
        <div className="App">
            <header className="App-header"></header>
            <div>
                <MainScreen/ >
            </div>
        </div>);
}

const mapStateToProps = (state) => {
    return {
        user: state.currentUser,
        participants: state.participants
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        setUser: (user) => dispatch(setUser(user)),
        addParticipant: (participant) => dispatch(addParticipant(participant)),
        removeParticipant: (participantKey) => dispatch(setUser(participantKey))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);