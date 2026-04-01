import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: { username: "" },
  reducers: {
    setUsername: (state, action) => { state.username = action.payload; },
    clearUser: (state) => { state.username = ""; },
  },
});

export const { setUsername, clearUser } = userSlice.actions;
export default userSlice.reducer;
