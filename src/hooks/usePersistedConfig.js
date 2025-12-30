import { useState, useEffect } from 'react';

/**
 * Hook pour gérer la persistance des paramètres de conversion dans localStorage
 * 
 * @param {string} key - Clé localStorage pour sauvegarder les paramètres
 * @param {object} defaultConfig - Configuration par défaut
 * @returns {[config, setConfig, resetToDefaults]} - [État actuel, Setter, Fonction reset]
 */
export const usePersistedConfig = (key = 'dvd-ripper-config', defaultConfig = {}) => {
  // Fonction pour charger la config depuis localStorage
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Fusionner avec les defaults pour ajouter de nouvelles clés si nécessaire
        return { ...defaultConfig, ...parsed };
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de la configuration:', error);
    }
    return defaultConfig;
  };

  const [config, setConfig] = useState(loadConfig);

  // Sauvegarder automatiquement à chaque changement
  useEffect(() => {
    try {
      // Ne sauvegarder que les paramètres de conversion (pas les chemins)
      const toSave = {
        videoPreset: config.videoPreset,
        videoCrf: config.videoCrf,
        audioBitrate: config.audioBitrate,
      };
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde de la configuration:', error);
    }
  }, [config.videoPreset, config.videoCrf, config.audioBitrate, key]);

  // Fonction pour réinitialiser aux valeurs par défaut
  const resetToDefaults = () => {
    setConfig(defaultConfig);
    // L'effet se chargera de sauvegarder les valeurs par défaut
    return defaultConfig;
  };

  return [config, setConfig, resetToDefaults];
};

