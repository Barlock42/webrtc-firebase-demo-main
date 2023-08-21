import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faMicrophone, faVideo } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import "./MeetingFooter.css";

const MeetingFooter = () => {
    return (<div className="meetingFooter">meetingFooter
        <div className="meetingIcon">
            <FontAwesomeIcon icon={faMicrophone} />
        </div>
        <div className="meetingIcon">
            <FontAwesomeIcon icon={faVideo} />
        </div>
        <div className="meetingIcon">
            <FontAwesomeIcon icon={faDesktop} />
        </div>
    </div>)
}

export default MeetingFooter;