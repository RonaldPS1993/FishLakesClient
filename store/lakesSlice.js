import { createSlice } from "@reduxjs/toolkit";

const lakesSlice = createSlice({
  name: "lakes",
  initialState: { favoriteHylakId: null },
  reducers: {
    setFavoriteHylakId: (state, action) => { state.favoriteHylakId = action.payload; },
    clearFavorite: (state) => { state.favoriteHylakId = null; },
  },
});

export const { setFavoriteHylakId, clearFavorite } = lakesSlice.actions;
export default lakesSlice.reducer;
