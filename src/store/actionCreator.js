import {
    ADD_PARTICIPANT,
    SET_USER,
    REMOVE_PARTICIPANT
} from "./actionTypes";

export const setUser = (user) => {
    return {
        type: SET_USER,
        payload: {
            currentUser: user
        }
    }
}

export const addParticipant = (participant) => {
    return {
        type: ADD_PARTICIPANT,
        payload: {   
            participant
        }
    }
}

export const removeParticipant = (participantKey) => {
    return {
        type: REMOVE_PARTICIPANT,
        payload: {
            participantKey
        }
    }
}