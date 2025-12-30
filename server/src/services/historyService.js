import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Service pour gérer l'historique des conversions
 * Stockage dans un fichier JSON dans le home directory
 */

const HISTORY_FILE = join(homedir(), '.dvd-ripper-history.json');
const MAX_HISTORY_ENTRIES = 100; // Limiter à 100 dernières conversions

/**
 * Charger l'historique depuis le fichier
 * @returns {Array} Liste des conversions
 */
export function loadHistory() {
  try {
    if (existsSync(HISTORY_FILE)) {
      const data = readFileSync(HISTORY_FILE, 'utf8');
      const history = JSON.parse(data);
      return Array.isArray(history) ? history : [];
    }
  } catch (error) {
    console.warn('Erreur lors du chargement de l\'historique:', error);
  }
  return [];
}

/**
 * Sauvegarder l'historique dans le fichier
 * @param {Array} history - Liste des conversions
 */
export function saveHistory(history) {
  try {
    // Limiter la taille de l'historique
    const limitedHistory = history.slice(-MAX_HISTORY_ENTRIES);
    writeFileSync(HISTORY_FILE, JSON.stringify(limitedHistory, null, 2), 'utf8');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'historique:', error);
  }
}

/**
 * Ajouter une conversion terminée à l'historique
 * @param {Object} conversion - Données de la conversion
 */
export function addToHistory(conversion) {
  try {
    const history = loadHistory();
    
    // Créer l'entrée d'historique
    const entry = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      dvdPath: conversion.dvdPath,
      outputDir: conversion.outputDir,
      videoPreset: conversion.videoPreset,
      videoCrf: conversion.videoCrf,
      audioBitrate: conversion.audioBitrate,
      vtsCount: conversion.progress?.length || 0,
      completedVts: conversion.progress?.filter(p => p.status === 'success').length || 0,
      failedVts: conversion.progress?.filter(p => p.status === 'error').length || 0,
      totalDuration: conversion.progress?.reduce((sum, p) => sum + (p.duration || 0), 0) || 0,
      totalSize: conversion.progress?.reduce((sum, p) => sum + (p.outputSize || 0), 0) || 0,
      status: conversion.status, // 'success', 'partial', 'error', 'cancelled'
      startTime: conversion.startTime,
      endTime: conversion.endTime,
      elapsedTime: conversion.elapsedTime,
    };

    history.push(entry);
    saveHistory(history);
    
    return entry;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à l\'historique:', error);
    return null;
  }
}

/**
 * Obtenir les statistiques globales de l'historique
 * @returns {Object} Statistiques
 */
export function getHistoryStats() {
  try {
    const history = loadHistory();
    
    const totalConversions = history.length;
    const successfulConversions = history.filter(h => h.status === 'success').length;
    const failedConversions = history.filter(h => h.status === 'error').length;
    const cancelledConversions = history.filter(h => h.status === 'cancelled').length;
    const partialConversions = history.filter(h => h.status === 'partial').length;
    
    const totalVtsConverted = history.reduce((sum, h) => sum + (h.completedVts || 0), 0);
    const totalSize = history.reduce((sum, h) => sum + (h.totalSize || 0), 0);
    const totalTime = history.reduce((sum, h) => sum + (h.elapsedTime || 0), 0);
    
    return {
      totalConversions,
      successfulConversions,
      failedConversions,
      cancelledConversions,
      partialConversions,
      totalVtsConverted,
      totalSizeBytes: totalSize,
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      totalTimeSeconds: totalTime,
      totalTimeFormatted: formatDuration(totalTime),
      successRate: totalConversions > 0 ? ((successfulConversions / totalConversions) * 100).toFixed(1) : 0,
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return null;
  }
}

/**
 * Formater une durée en secondes en HH:MM:SS
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée
 */
function formatDuration(seconds) {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Supprimer l'historique complet
 */
export function clearHistory() {
  try {
    saveHistory([]);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique:', error);
    return false;
  }
}

