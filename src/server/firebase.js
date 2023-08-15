import firebaseConfig from "../firebaseConfig";
import firebase from "firebase/app";
import 'firebase/database';

firebase.initializeApp(firebaseConfig);
let dbRef = firebase.database().ref();
export const connectorRef = firebase.database().ref(".info/connected");

export const userName = "test"; // Get it from outer application
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");

if (roomId) { 
    dbRef = dbRef.child(roomId)
} else { 
    dbRef = dbRef.push();
    window.history.replaceState(null, "Meet", "?id=" + dbRef.key);
}

export default dbRef;