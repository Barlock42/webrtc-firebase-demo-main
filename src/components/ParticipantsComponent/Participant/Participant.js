import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import Card from "../../shared/Card";

export const Participant = () => {
    return (
        <div className="participan">
            <Card>
                <video className="video" autoPlay playsInline></video>
                <FontAwesomeIcon className="muted" icon={faMicrophoneSlash} />
                <div className="avatar">
                    Name
                </div>
                <div className="name">
                    Test user
                </div>
            </Card>
        </div>)
}