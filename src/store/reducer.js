import { SET_USER, ADD_PARTICIPANT, REMOVE_PARTICIPANT } from './actionTypes';

const initialState = {
  currentuser: {},
  participants: {}
};

const generateColor = () =>
  "#" + Math.floor(Math.random() * 16777215).toString(16);

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER: {
      const { payload } = action;
      return {
        ...state,
        currentuser: { ...payload.currentUser }
      };
    }
    case ADD_PARTICIPANT: {
      const { payload } = action;
      const currentUserId = Object.keys(state.currentuser)[0];
      const participantId = Object.keys(payload.participant)[0];
      const updatedParticipant = {
        ...payload.participant[participantId]
      };

      if (currentUserId === participantId) {
        updatedParticipant.currentUser = true;
        payload.newUser[participantId].avatarColor = generateColor();
      }

      return {
        ...state,
        participants: {
          ...state.participants,
          ...payload.participant
        }
      };
    }
    case REMOVE_PARTICIPANT: {
      const { payload } = action;
      const updatedParticipants = { ...state.participants };
      delete updatedParticipants[payload.participantKey];

      return {
        ...state,
        participants: updatedParticipants
      };
    }
    default: {
      return state;
    }
  }
};
