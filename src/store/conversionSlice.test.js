import { describe, it, expect } from 'vitest';
import conversionReducer, {
  setConversion,
  clearConversion,
  setOutputDir,
  setIsScanning,
  updateConversionStatus,
  selectConversion,
  selectOutputDir,
  selectIsScanning,
  selectIsConverting,
} from './conversionSlice';

describe('conversionSlice', () => {
  const initialState = {
    conversion: null,
    outputDir: '',
    isScanning: false,
  };

  it('devrait retourner l\'état initial', () => {
    expect(conversionReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setConversion', () => {
    it('devrait définir les données de conversion', () => {
      const conversionData = {
        status: 'running',
        progress: 50,
        files: [],
      };
      const actual = conversionReducer(initialState, setConversion(conversionData));
      expect(actual.conversion).toEqual(conversionData);
    });
  });

  describe('clearConversion', () => {
    it('devrait vider les données de conversion', () => {
      const stateWithConversion = {
        ...initialState,
        conversion: { status: 'completed' },
      };
      const actual = conversionReducer(stateWithConversion, clearConversion());
      expect(actual.conversion).toBeNull();
    });
  });

  describe('setOutputDir', () => {
    it('devrait définir le répertoire de sortie', () => {
      const outputDir = '/path/to/output';
      const actual = conversionReducer(initialState, setOutputDir(outputDir));
      expect(actual.outputDir).toBe(outputDir);
    });
  });

  describe('setIsScanning', () => {
    it('devrait définir l\'état de scan', () => {
      const actual = conversionReducer(initialState, setIsScanning(true));
      expect(actual.isScanning).toBe(true);
    });
  });

  describe('updateConversionStatus', () => {
    it('devrait mettre à jour les données de conversion', () => {
      const stateWithConversion = {
        ...initialState,
        conversion: { status: 'running', progress: 30 },
      };
      const update = { progress: 60 };
      const actual = conversionReducer(stateWithConversion, updateConversionStatus(update));
      expect(actual.conversion).toEqual({
        status: 'running',
        progress: 60,
      });
    });

    it('ne devrait rien faire si conversion est null', () => {
      const actual = conversionReducer(initialState, updateConversionStatus({ progress: 50 }));
      expect(actual.conversion).toBeNull();
    });
  });

  describe('Selectors', () => {
    const mockState = {
      conversion: {
        conversion: { status: 'running', progress: 75 },
        outputDir: '/output',
        isScanning: true,
      },
    };

    it('selectConversion devrait retourner les données de conversion', () => {
      expect(selectConversion(mockState)).toEqual({ status: 'running', progress: 75 });
    });

    it('selectOutputDir devrait retourner le répertoire de sortie', () => {
      expect(selectOutputDir(mockState)).toBe('/output');
    });

    it('selectIsScanning devrait retourner l\'état de scan', () => {
      expect(selectIsScanning(mockState)).toBe(true);
    });

    it('selectIsConverting devrait retourner true si status est running', () => {
      expect(selectIsConverting(mockState)).toBe(true);
    });

    it('selectIsConverting devrait retourner false si status n\'est pas running', () => {
      const stateWithCompleted = {
        conversion: {
          conversion: { status: 'completed' },
          outputDir: '',
          isScanning: false,
        },
      };
      expect(selectIsConverting(stateWithCompleted)).toBe(false);
    });

    it('selectIsConverting devrait retourner false si conversion est null', () => {
      const stateWithNoConversion = {
        conversion: {
          conversion: null,
          outputDir: '',
          isScanning: false,
        },
      };
      expect(selectIsConverting(stateWithNoConversion)).toBe(false);
    });
  });
});

