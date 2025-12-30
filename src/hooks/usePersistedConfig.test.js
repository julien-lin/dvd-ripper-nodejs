import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedConfig } from './usePersistedConfig';

describe('usePersistedConfig', () => {
  const STORAGE_KEY = 'test-config';
  const DEFAULT_CONFIG = {
    dvdPath: '/test/path',
    outputDir: '/test/output',
    videoPreset: 'medium',
    videoCrf: '18',
    audioBitrate: '192k',
  };

  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('devrait initialiser avec la config par défaut', () => {
    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, DEFAULT_CONFIG)
    );

    const [config] = result.current;
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('devrait charger la config depuis localStorage si elle existe', () => {
    const savedConfig = {
      videoPreset: 'fast',
      videoCrf: '20',
      audioBitrate: '256k',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfig));

    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, DEFAULT_CONFIG)
    );

    const [config] = result.current;
    // Devrait fusionner avec les defaults
    expect(config.videoPreset).toBe('fast');
    expect(config.videoCrf).toBe('20');
    expect(config.audioBitrate).toBe('256k');
  });

  it('devrait sauvegarder automatiquement les changements dans localStorage', () => {
    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, DEFAULT_CONFIG)
    );

    const [, setConfig] = result.current;

    act(() => {
      setConfig({ ...DEFAULT_CONFIG, videoPreset: 'slow' });
    });

    // Attendre que l'effet se déclenche
    const saved = localStorage.getItem(STORAGE_KEY);
    expect(saved).toBeTruthy();
    
    const parsed = JSON.parse(saved);
    expect(parsed.videoPreset).toBe('slow');
  });

  it('devrait sauvegarder uniquement les paramètres de conversion', () => {
    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, DEFAULT_CONFIG)
    );

    const [, setConfig] = result.current;

    act(() => {
      setConfig({ 
        ...DEFAULT_CONFIG, 
        dvdPath: '/new/path',
        videoPreset: 'ultrafast'
      });
    });

    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(saved);
    
    // Ne devrait pas sauvegarder dvdPath
    expect(parsed.dvdPath).toBeUndefined();
    // Devrait sauvegarder videoPreset
    expect(parsed.videoPreset).toBe('ultrafast');
  });

  it('devrait réinitialiser aux valeurs par défaut', async () => {
    // Sauvegarder une config personnalisée
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      videoPreset: 'fast',
      videoCrf: '20',
      audioBitrate: '256k',
    }));

    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, DEFAULT_CONFIG)
    );

    // Vérifier que la config personnalisée est chargée
    expect(result.current[0].videoPreset).toBe('fast');

    act(() => {
      const [, , resetToDefaults] = result.current;
      const newConfig = resetToDefaults();
      expect(newConfig).toEqual(DEFAULT_CONFIG);
    });

    // Vérifier que la config est réinitialisée
    expect(result.current[0]).toEqual(DEFAULT_CONFIG);
  });

  it('devrait gérer les erreurs de parsing localStorage', () => {
    // Sauvegarder un JSON invalide
    localStorage.setItem(STORAGE_KEY, 'invalid-json{');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, DEFAULT_CONFIG)
    );

    const [config] = result.current;
    
    // Devrait fallback sur les defaults
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Erreur lors du chargement de la configuration:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('devrait gérer les erreurs de sauvegarde localStorage', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Simuler une erreur de quota dépassé
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, DEFAULT_CONFIG)
    );

    const [, setConfig] = result.current;

    act(() => {
      setConfig({ ...DEFAULT_CONFIG, videoPreset: 'slow' });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Erreur lors de la sauvegarde de la configuration:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('devrait fusionner les nouvelles clés de config avec les anciennes', () => {
    // Sauvegarder une ancienne version de config (sans nouveau paramètre)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      videoPreset: 'fast',
      videoCrf: '20',
    }));

    const newDefaultConfig = {
      ...DEFAULT_CONFIG,
      newParameter: 'newValue', // Nouveau paramètre ajouté
    };

    const { result } = renderHook(() => 
      usePersistedConfig(STORAGE_KEY, newDefaultConfig)
    );

    const [config] = result.current;
    
    // Devrait avoir les anciennes valeurs sauvegardées
    expect(config.videoPreset).toBe('fast');
    expect(config.videoCrf).toBe('20');
    // Et le nouveau paramètre par défaut
    expect(config.newParameter).toBe('newValue');
  });
});

