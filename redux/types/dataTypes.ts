// Data state types
export interface DataState {
    loading: boolean;
    data: any | null;
    error: string | null;
  }
  
  // Action types
  export const FETCH_DATA_REQUEST = 'FETCH_DATA_REQUEST';
  export const FETCH_DATA_SUCCESS = 'FETCH_DATA_SUCCESS';
  export const FETCH_DATA_FAILURE = 'FETCH_DATA_FAILURE';
  
  // Action type interfaces
  interface FetchDataRequestAction {
    type: typeof FETCH_DATA_REQUEST;
  }
  
  interface FetchDataSuccessAction {
    type: typeof FETCH_DATA_SUCCESS;
    payload: any;
  }
  
  interface FetchDataFailureAction {
    type: typeof FETCH_DATA_FAILURE;
    error: string;
  }
  
  // Export all action types as a union
  export type DataActionTypes = FetchDataRequestAction | FetchDataSuccessAction | FetchDataFailureAction;
  