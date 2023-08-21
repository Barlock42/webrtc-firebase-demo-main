import React from "react";
import "./MainScreen.css"
import MeetingFooter from "../MeetingFooter/MeetingFooter.js";

export const MainScreen = () => {
    return (<div className="wrapper">
        <div className="mainScreen">mainScreen</div>
        <div className="footer">
            <MeetingFooter />
        </div>
    </div>)
}