import {
    ADD_PARTICIPANT,
    SET_USER,
    REMOVE_PARTICIPANT
} from "./actiontypes";

let initialState = {
    currentuser: null,
    participants: {}
}

export const reducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_USER: {
            let { payload } = action;
            state = { ...state, currentuser: { ...payload.currentUser } }
            return state;
        }
        case ADD_PARTICIPANT: {
            let { payload } = action;
            const currentUserId = Object.keys(state.currentuser)[0];
            const participantId = Object.keys(payload.participant)[0];
            if (currentUserId === participantId)    
            {
                payload.participantp[participantId].currentUser = true;
            }
            state = { ...state, currentuser: { ...payload.currentUser } }
            return state;
        }
        case REMOVE_PARTICIPANT: {
            let { payload } = action;
            state = { ...state, currentuser: { ...payload.currentUser } }
            return state;
        }
        default: {
            return state;
        }
    }
}

