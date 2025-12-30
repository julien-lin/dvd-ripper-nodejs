import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const STATE_FILE = join(process.cwd(), '.conversion-state.json');

/**
 * Sauvegarder l'état de conversion
 * @param {object} conversion - État de conversion complet
 */
export function saveConversionState(conversion) {
  try {
    const state = {
      ...conversion,
      savedAt: new Date().toISOString(),
      version: '1.0',
    };
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    console.log('✓ État de conversion sauvegardé');
  } catch (error) {
    console.error('✗ Erreur sauvegarde état:', error.message);
  }
}

/**
 * Charger l'état de conversion sauvegardé
 * @returns {object|null} - État de conversion ou null
 */
export function loadConversionState() {
  try {
    if (!existsSync(STATE_FILE)) {
      return null;
    }
    
    const data = readFileSync(STATE_FILE, 'utf8');
    const state = JSON.parse(data);
    
    // Vérifier que l'état n'est pas trop ancien (> 7 jours)
    const savedAt = new Date(state.savedAt);
    const now = new Date();
    const daysDiff = (now - savedAt) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      console.log('⚠ État de conversion trop ancien (>7 jours), suppression');
      clearConversionState();
      return null;
    }
    
    // Vérifier que la conversion n'était pas déjà terminée
    if (state.status === 'completed' || state.status === 'stopped') {
      console.log('✓ Conversion déjà terminée dans l\'état sauvegardé');
      clearConversionState();
      return null;
    }
    
    console.log('✓ État de conversion chargé');
    return state;
  } catch (error) {
    console.error('✗ Erreur chargement état:', error.message);
    return null;
  }
}

/**
 * Supprimer l'état de conversion sauvegardé
 */
export function clearConversionState() {
  try {
    if (existsSync(STATE_FILE)) {
      unlinkSync(STATE_FILE);
      console.log('✓ État de conversion supprimé');
    }
  } catch (error) {
    console.error('✗ Erreur suppression état:', error.message);
  }
}

/**
 * Vérifier quels VTS sont déjà convertis
 * @param {string} outputDir - Répertoire de sortie
 * @param {array} vtsList - Liste des VTS à vérifier
 * @returns {array} - Liste des VTS déjà convertis
 */
export function detectCompletedVTS(outputDir, vtsList) {
  const completed = [];
  
  try {
    if (!existsSync(outputDir)) {
      return completed;
    }
    
    vtsList.forEach(vtsNum => {
      const outputFile = join(outputDir, `video_${vtsNum}.mp4`);
      if (existsSync(outputFile)) {
        const stats = require('fs').statSync(outputFile);
        // Vérifier que le fichier n'est pas vide (> 1MB)
        if (stats.size > 1024 * 1024) {
          completed.push(vtsNum);
        }
      }
    });
    
    if (completed.length > 0) {
      console.log(`✓ ${completed.length} VTS déjà convertis détectés`);
    }
    
    return completed;
  } catch (error) {
    console.error('✗ Erreur détection VTS complétés:', error.message);
    return completed;
  }
}

/**
 * Préparer l'état pour la reprise
 * @param {object} savedState - État sauvegardé
 * @param {string} outputDir - Répertoire de sortie
 * @returns {object} - État préparé pour la reprise
 */
export function prepareResumeState(savedState, outputDir) {
  const { progress } = savedState;
  
  // Détecter les VTS déjà convertis
  const vtsList = progress.map(p => p.vts);
  const completedVTS = detectCompletedVTS(outputDir || savedState.outputDir, vtsList);
  
  // Mettre à jour le statut des VTS complétés
  const updatedProgress = progress.map(item => {
    if (completedVTS.includes(item.vts)) {
      return {
        ...item,
        status: 'success',
        progress: 100,
        message: `VTS_${item.vts} déjà converti (reprise)`,
      };
    }
    
    // Réinitialiser les VTS en cours ou en erreur
    if (item.status === 'processing' || item.status === 'error') {
      return {
        ...item,
        status: 'pending',
        progress: 0,
        message: `VTS_${item.vts} en attente (reprise)`,
      };
    }
    
    return item;
  });
  
  return {
    ...savedState,
    progress: updatedProgress,
    status: 'running',
    resumedAt: new Date().toISOString(),
    resumedFrom: savedState.status,
  };
}

export default {
  saveConversionState,
  loadConversionState,
  clearConversionState,
  detectCompletedVTS,
  prepareResumeState,
};

