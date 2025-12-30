/**
 * Configuration globale pour les tests Vitest
 * Chargé avant chaque test
 */

/* global global */

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock de fetch pour les tests
global.fetch = vi.fn();

// Helper pour mock fetch avec succès
export function mockFetchSuccess(data) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    headers: {
      get: (name) => name === 'content-type' ? 'application/json' : null
    },
    json: async () => data
  });
}

// Helper pour mock fetch avec erreur
export function mockFetchError(status, message) {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    headers: {
      get: (name) => name === 'content-type' ? 'application/json' : null
    },
    json: async () => ({ error: message })
  });
}

// Helper pour mock fetch avec erreur réseau
export function mockFetchNetworkError() {
  global.fetch.mockRejectedValueOnce(new Error('Network error'));
}

