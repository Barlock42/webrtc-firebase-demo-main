import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import Card from "../../shared/Card";

export const Participant = ({ participant }) => {
    return (
        <div className="participan">
            <Card>
                <video className="video" autoPlay playsInline></video>
                <FontAwesomeIcon className="muted" icon={faMicrophoneSlash} />
                <div style={{ background: participant.avatarColor }} className="avatar">
                    {participant.userName[0]}
                </div>
                <div className="name">
                    {participant.userName}
                    {participant.currentUser ? "(Вы)" : ""}
                </div>
            </Card>
        </div>)
}