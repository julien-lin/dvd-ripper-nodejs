import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// NOTE: Pour que ces tests fonctionnent, il faut :
// 1. Exporter 'app' depuis index.js : export { app };
// 2. Séparer la logique d'écoute du serveur dans un fichier start.js
// 3. Importer app : import { app } from '../index.js';

describe('API Integration Tests', () => {
  // TODO: Importer app depuis index.js une fois exporté
  // const app = ...;

  describe('GET /api/check-dependencies', () => {
    it.skip('devrait retourner le statut des dépendances', async () => {
      // const response = await request(app).get('/api/check-dependencies');
      // expect(response.status).toBe(200);
      // expect(response.body).toHaveProperty('ffmpeg');
      // expect(response.body).toHaveProperty('ffprobe');
      // expect(response.body).toHaveProperty('bc');
    });
  });

  describe('GET /api/status', () => {
    it.skip('devrait retourner idle si aucune conversion', async () => {
      // const response = await request(app).get('/api/status');
      // expect(response.status).toBe(200);
      // expect(response.body.status).toBe('idle');
    });
  });

  describe('POST /api/list-directory', () => {
    it.skip('devrait rejeter les chemins non autorisés (Path Traversal)', async () => {
      // const response = await request(app)
      //   .post('/api/list-directory')
      //   .send({ path: '../../etc/passwd' });
      // expect(response.status).toBe(403);
    });

    it.skip('devrait accepter les chemins autorisés', async () => {
      // const response = await request(app)
      //   .post('/api/list-directory')
      //   .send({ path: '/home' });
      // expect(response.status).toBe(200);
    });
  });

  describe('POST /api/scan-dvd', () => {
    it.skip('devrait valider le chemin DVD', async () => {
      // const response = await request(app)
      //   .post('/api/scan-dvd')
      //   .send({ dvdPath: '' });
      // expect(response.status).toBe(400);
    });
  });

  describe('POST /api/convert', () => {
    it.skip('devrait rejeter si une conversion est en cours', async () => {
      // Test nécessite de mocker l'état de conversion
    });

    it.skip('devrait valider les paramètres de conversion', async () => {
      // const response = await request(app)
      //   .post('/api/convert')
      //   .send({ dvdPath: '', outputDir: '' });
      // expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it.skip('devrait limiter les requêtes après dépassement', async () => {
      // Test nécessite d'envoyer plusieurs requêtes rapidement
    });
  });
});

// Tests à implémenter selon TODO.md:
// - POST /api/convert (validation, limites)
// - POST /api/scan-dvd
// - GET /api/status
// - POST /api/stop
// - POST /api/list-directory (sécurité Path Traversal)

/*
 * Pour activer ces tests:
 * 
 * 1. Refactoriser server/index.js:
 *    - Exporter app : export { app };
 *    - Créer server/start.js pour app.listen()
 * 
 * 2. Importer app dans ce fichier:
 *    import { app } from '../index.js';
 * 
 * 3. Retirer .skip() des tests et implémenter la logique
 * 
 * 4. Lancer les tests:
 *    npm test
 */

