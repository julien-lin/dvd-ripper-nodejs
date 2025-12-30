import { describe, it, expect } from 'vitest';
import systemReducer, {
  setDependencies,
  setBackendAvailable,
  selectDependencies,
  selectBackendAvailable,
} from './systemSlice';

describe('systemSlice', () => {
  const initialState = {
    dependencies: null,
    backendAvailable: true,
  };

  it('devrait retourner l\'état initial', () => {
    expect(systemReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setDependencies', () => {
    it('devrait définir les dépendances', () => {
      const deps = {
        ffmpeg: true,
        ffprobe: true,
        bc: true,
        allInstalled: true,
        embedded: true,
      };
      const actual = systemReducer(initialState, setDependencies(deps));
      expect(actual.dependencies).toEqual(deps);
    });
  });

  describe('setBackendAvailable', () => {
    it('devrait définir la disponibilité du backend à true', () => {
      const actual = systemReducer(initialState, setBackendAvailable(true));
      expect(actual.backendAvailable).toBe(true);
    });

    it('devrait définir la disponibilité du backend à false', () => {
      const actual = systemReducer(initialState, setBackendAvailable(false));
      expect(actual.backendAvailable).toBe(false);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      system: {
        dependencies: {
          ffmpeg: true,
          ffprobe: true,
          bc: false,
          allInstalled: false,
        },
        backendAvailable: false,
      },
    };

    it('selectDependencies devrait retourner les dépendances', () => {
      expect(selectDependencies(mockState)).toEqual({
        ffmpeg: true,
        ffprobe: true,
        bc: false,
        allInstalled: false,
      });
    });

    it('selectBackendAvailable devrait retourner la disponibilité du backend', () => {
      expect(selectBackendAvailable(mockState)).toBe(false);
    });
  });
});

