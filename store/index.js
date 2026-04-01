import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import lakesReducer from "./lakesSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    lakes: lakesReducer,
  },
});
