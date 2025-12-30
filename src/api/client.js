/**
 * Client API centralisé
 * Gère toutes les requêtes HTTP vers le backend
 * Inclut: gestion d'erreurs, retry automatique, validation Content-Type
 */

import { API_BASE_URL, debugLog } from '../config';

/**
 * Classe d'erreur personnalisée pour les erreurs API
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Configuration du client API
 */
const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes
  retryAttempts: 3,
  retryDelay: 1000, // 1 seconde
};

/**
 * Délai avec Promise (pour retry)
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gère la réponse HTTP et valide le Content-Type
 */
async function handleResponse(response) {
  // Vérifier le Content-Type
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new ApiError(
      'Le backend ne répond pas correctement. Vérifiez qu\'il est démarré.',
      response.status,
      null
    );
  }
  
  // Parser le JSON
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      'Erreur de parsing JSON. Le backend a retourné une réponse invalide.',
      response.status,
      null
    );
  }
  
  // Si la réponse n'est pas OK (2xx)
  if (!response.ok) {
    const errorMessage = data.error || data.message || 'Une erreur est survenue';
    throw new ApiError(errorMessage, response.status, data);
  }
  
  return data;
}

/**
 * Effectue une requête HTTP avec retry automatique
 */
async function request(url, options = {}, retryCount = 0) {
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseURL}${url}`;
  
  debugLog('API Request:', options.method || 'GET', fullUrl);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await handleResponse(response);
    debugLog('API Response:', data);
    
    return data;
  } catch (error) {
    // Si c'est une ApiError (erreur HTTP), on ne retry pas
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Si c'est une erreur réseau et qu'il reste des tentatives
    if (retryCount < API_CONFIG.retryAttempts) {
      debugLog(`Retry ${retryCount + 1}/${API_CONFIG.retryAttempts} après erreur:`, error.message);
      await delay(API_CONFIG.retryDelay * (retryCount + 1));
      return request(url, options, retryCount + 1);
    }
    
    // Erreur réseau finale
    throw new ApiError(
      'Impossible de contacter le serveur. Vérifiez votre connexion.',
      0,
      null
    );
  }
}

/**
 * Client API avec méthodes GET, POST, PUT, DELETE
 */
export const apiClient = {
  /**
   * Requête GET
   */
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return request(fullUrl, {
      method: 'GET',
    });
  },
  
  /**
   * Requête POST
   */
  async post(url, data = {}) {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Requête PUT
   */
  async put(url, data = {}) {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Requête DELETE
   */
  async delete(url) {
    return request(url, {
      method: 'DELETE',
    });
  },
};

/**
 * API spécifique au DVD Ripper
 * Encapsule les appels aux endpoints backend
 */
export const dvdApi = {
  /**
   * Vérifier les dépendances système
   */
  async checkDependencies() {
    return apiClient.get('/check-dependencies');
  },
  
  /**
   * Obtenir le statut de la conversion en cours
   */
  async getStatus() {
    return apiClient.get('/status');
  },
  
  /**
   * Scanner un DVD
   */
  async scanDvd(dvdPath) {
    return apiClient.post('/scan-dvd', { dvdPath });
  },
  
  /**
   * Lister le contenu d'un répertoire
   */
  async listDirectory(path) {
    return apiClient.post('/list-directory', { path });
  },
  
  /**
   * Démarrer une conversion
   */
  async startConversion(config) {
    return apiClient.post('/convert', config);
  },
  
  /**
   * Arrêter la conversion en cours
   */
  async stopConversion() {
    return apiClient.post('/stop');
  },
  
  /**
   * Analyser les résultats
   */
  async analyzeResults(outputDir) {
    return apiClient.get('/analyze', { outputDir });
  },
  
  /**
   * Obtenir l'état de reprise sauvegardé
   */
  async getResumeState() {
    return apiClient.get('/resume-state');
  },
  
  /**
   * Effacer l'état de reprise sauvegardé
   */
  async clearResumeState() {
    return apiClient.post('/clear-resume-state');
  },
};

// Export par défaut
export default dvdApi;

