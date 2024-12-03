import { DataState, DataActionTypes, FETCH_DATA_REQUEST, FETCH_DATA_SUCCESS, FETCH_DATA_FAILURE } from '../types/dataTypes';

const initialState: DataState = {
  loading: false,
  data: null,
  error: null,
};

const dataReducer = (state = initialState, action: DataActionTypes): DataState => {
  switch (action.type) {
    case FETCH_DATA_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_DATA_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case FETCH_DATA_FAILURE:
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

export default dataReducer;
