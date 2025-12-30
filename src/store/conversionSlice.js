import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversion: null,
  outputDir: '',
  isScanning: false,
};

const conversionSlice = createSlice({
  name: 'conversion',
  initialState,
  reducers: {
    setConversion: (state, action) => {
      state.conversion = action.payload;
    },
    clearConversion: (state) => {
      state.conversion = null;
    },
    setOutputDir: (state, action) => {
      state.outputDir = action.payload;
    },
    setIsScanning: (state, action) => {
      state.isScanning = action.payload;
    },
    updateConversionStatus: (state, action) => {
      if (state.conversion) {
        state.conversion = { ...state.conversion, ...action.payload };
      }
    },
  },
});

export const {
  setConversion,
  clearConversion,
  setOutputDir,
  setIsScanning,
  updateConversionStatus,
} = conversionSlice.actions;

// Selectors
export const selectConversion = (state) => state.conversion.conversion;
export const selectOutputDir = (state) => state.conversion.outputDir;
export const selectIsScanning = (state) => state.conversion.isScanning;
export const selectIsConverting = (state) =>
  state.conversion.conversion?.status === 'running';

export default conversionSlice.reducer;

