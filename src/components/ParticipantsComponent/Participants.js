import React from "react";
import "./Participants.css"
import { Participant } from "./Participant/Participant";
import { useSelector } from "react-redux";

export const Participants = () => {
    const participants = useSelector((state) => state.participants);
    let participantKey = Object.keys(participants);

    let gridCol =
        participantKey.length === 1 ? 1 : participantKey.length <= 4 ? 2 : 4;
    const gridColSize = participantKey.length <= 4 ? 1 : 2;
    let gridRowSize =
        participantKey.length <= 4
            ? participantKey.length
            : Math.ceil(participantKey.length / 2);

    return (
        <div style={{
            "--grid-size": gridCol,
            "--grid-col-size": gridColSize,
            "--grid-row-size": gridRowSize,
        }}
            className="participants">
            {participantKey.map(participantKey => {
                const currentParticipant = participants[participantKey];
                return <Participant participant={currentParticipant} key={participantKey} />
            })}
        </div>)
}