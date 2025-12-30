import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dependencies: null,
  backendAvailable: true,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setDependencies: (state, action) => {
      state.dependencies = action.payload;
    },
    setBackendAvailable: (state, action) => {
      state.backendAvailable = action.payload;
    },
  },
});

export const { setDependencies, setBackendAvailable } = systemSlice.actions;

// Selectors
export const selectDependencies = (state) => state.system.dependencies;
export const selectBackendAvailable = (state) => state.system.backendAvailable;

export default systemSlice.reducer;

