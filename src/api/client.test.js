/**
 * Tests unitaires pour le client API
 */

/* global global */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, ApiError, dvdApi } from './client';
import { mockFetchSuccess, mockFetchError, mockFetchNetworkError } from '../test/setup';

describe('ApiError', () => {
  it('crée une erreur avec message, status et data', () => {
    const error = new ApiError('Test error', 400, { detail: 'Bad request' });
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.data).toEqual({ detail: 'Bad request' });
  });
});

describe('apiClient.get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('effectue une requête GET avec succès', async () => {
    const mockData = { success: true, data: 'test' };
    mockFetchSuccess(mockData);

    const result = await apiClient.get('/test');
    
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('ajoute les query params correctement', async () => {
    mockFetchSuccess({ success: true });

    await apiClient.get('/test', { param1: 'value1', param2: 'value2' });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('?param1=value1&param2=value2'),
      expect.any(Object)
    );
  });

  it('lance ApiError si le serveur retourne une erreur', async () => {
    mockFetchError(404, 'Not found');

    await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    
    // Réinitialiser le mock pour le second test
    vi.clearAllMocks();
    mockFetchError(404, 'Not found');
    
    await expect(apiClient.get('/test')).rejects.toThrow('Not found');
  });
});

describe('apiClient.post', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('effectue une requête POST avec succès', async () => {
    const mockData = { success: true, id: 123 };
    mockFetchSuccess(mockData);

    const postData = { name: 'test' };
    const result = await apiClient.post('/test', postData);
    
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData)
      })
    );
  });

  it('ajoute les headers Content-Type automatiquement', async () => {
    mockFetchSuccess({ success: true });

    await apiClient.post('/test', { data: 'test' });
    
    const callArgs = global.fetch.mock.calls[0];
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
  });
});

describe('Retry automatique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retry 3 fois en cas d\'erreur réseau', async () => {
    // Mock 3 erreurs réseau puis succès
    mockFetchNetworkError();
    mockFetchNetworkError();
    mockFetchNetworkError();
    mockFetchSuccess({ success: true });

    const result = await apiClient.get('/test');
    
    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(4);
  }, 15000); // Timeout plus long pour les retries

  it('échoue après 3 tentatives', async () => {
    vi.clearAllMocks(); // S'assurer que les mocks sont bien nettoyés
    
    // Mock 4 erreurs consécutives
    mockFetchNetworkError();
    mockFetchNetworkError();
    mockFetchNetworkError();
    mockFetchNetworkError();

    try {
      await apiClient.get('/test');
      // Si on arrive ici, le test doit échouer
      expect.fail('Expected to throw ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toContain('Impossible de contacter le serveur');
    }
    
    expect(global.fetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  }, 15000);

  it('ne retry pas les erreurs HTTP', async () => {
    mockFetchError(400, 'Bad request');

    await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    
    // Une seule tentative, pas de retry
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('dvdApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checkDependencies fonctionne', async () => {
    const mockDeps = { ffmpeg: true, ffprobe: true, bc: true };
    mockFetchSuccess(mockDeps);

    const result = await dvdApi.checkDependencies();
    
    expect(result).toEqual(mockDeps);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/check-dependencies'),
      expect.any(Object)
    );
  });

  it('scanDvd envoie le bon body', async () => {
    mockFetchSuccess({ vtsList: [] });

    await dvdApi.scanDvd('/path/to/dvd');
    
    const callArgs = global.fetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body).toEqual({ dvdPath: '/path/to/dvd' });
  });

  it('startConversion envoie la config complète', async () => {
    mockFetchSuccess({ conversion: { status: 'running' } });

    const config = {
      dvdPath: '/dvd',
      outputDir: '/output',
      videoPreset: 'medium',
      videoCrf: '18',
      audioBitrate: '192k',
      selectedVts: ['01', '02']
    };

    await dvdApi.startConversion(config);
    
    const callArgs = global.fetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body).toEqual(config);
  });

  it('stopConversion effectue un POST', async () => {
    mockFetchSuccess({ message: 'Stopped' });

    await dvdApi.stopConversion();
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/stop'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('Validation Content-Type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lance une erreur si Content-Type n\'est pas JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: () => 'text/html' // Pas JSON!
      },
      json: async () => ({})
    });

    try {
      await apiClient.get('/test');
      expect.fail('Expected to throw ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toContain('ne répond pas correctement');
    }
  });

  it('lance une erreur si Content-Type est absent', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: () => null
      },
      json: async () => ({})
    });

    await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
  });
});

