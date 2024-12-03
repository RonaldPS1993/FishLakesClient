import { Dispatch } from 'redux';
import { FETCH_DATA_REQUEST, FETCH_DATA_SUCCESS, FETCH_DATA_FAILURE, DataActionTypes } from '../types/dataTypes';

export const fetchData = () => {
  return async (dispatch: Dispatch<DataActionTypes>) => {
    dispatch({ type: FETCH_DATA_REQUEST });

    try {
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();

      dispatch({ type: FETCH_DATA_SUCCESS, payload: data });
    } catch (error: any) {
      dispatch({ type: FETCH_DATA_FAILURE, error: error.message });
    }
  };
};
