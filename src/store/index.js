import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage par défaut
import { combineReducers } from '@reduxjs/toolkit';

import conversionReducer from './conversionSlice';
import systemReducer from './systemSlice';

// Configuration de la persistance
const persistConfig = {
  key: 'dvd-ripper-root',
  version: 1,
  storage,
  whitelist: ['system'], // Persister uniquement system (dependencies)
  // conversion n'est pas persisté car l'état de conversion peut changer côté serveur
};

const rootReducer = combineReducers({
  conversion: conversionReducer,
  system: systemReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer ces actions pour redux-persist
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production', // Redux DevTools
});

export const persistor = persistStore(store);

export default store;

