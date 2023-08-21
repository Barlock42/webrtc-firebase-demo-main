import React from "react";
import "./MainScreen.css"
import MeetingFooter from "../MeetingFooter/MeetingFooter.js";
import { Participants } from "../ParticipantsComponent/Participants.js";

export const MainScreen = () => {
    return (<div className="wrapper">
        <div className="mainScreen">
            <Participants />
        </div>
        <div className="footer">
            <MeetingFooter />
        </div>
    </div>)
}