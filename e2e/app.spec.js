import { test, expect } from '@playwright/test';

test.describe('DVD Ripper E2E Tests', () => {
  test('devrait charger la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le titre
    await expect(page.locator('h1')).toContainText('Extracteur DVD vers MP4');
  });

  test('devrait afficher l\'état des dépendances', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que l'état des dépendances soit affiché
    await page.waitForSelector('text=État des dépendances', { timeout: 5000 });
    
    // Vérifier que ffmpeg est détecté
    const ffmpegStatus = page.locator('text=/.*ffmpeg.*/');
    await expect(ffmpegStatus).toBeVisible();
  });

  test.skip('Scénario complet: Scan DVD → Sélection → Conversion', async ({ page }) => {
    // Ce test nécessite un DVD ou une image de test
    // TODO: Implémenter avec des fixtures de test
    
    // 1. Navigation vers la page
    await page.goto('/');
    
    // 2. Sélectionner un dossier DVD
    // await page.click('text=Parcourir');
    // await page.fill('[placeholder="Chemin du DVD"]', '/path/to/test/dvd');
    
    // 3. Scanner le DVD
    // await page.click('text=Scanner');
    // await expect(page.locator('text=/.*titre.*détecté.*/i')).toBeVisible({ timeout: 10000 });
    
    // 4. Configurer la conversion
    // await page.fill('[placeholder="Dossier de sortie"]', '/tmp/output');
    // await page.selectOption('select[name="preset"]', 'fast');
    
    // 5. Démarrer la conversion
    // await page.click('text=Démarrer la conversion');
    // await expect(page.locator('text=/Conversion en cours.*/i')).toBeVisible();
    
    // 6. Vérifier la progression
    // await expect(page.locator('[role="progressbar"]')).toBeVisible();
    
    // 7. Attendre la fin (ou tester l'arrêt)
    // await page.click('text=Arrêter');
    // await expect(page.locator('text=/.*arrêté.*/i')).toBeVisible();
  });

  test.skip('devrait gérer l\'arrêt de conversion', async ({ page }) => {
    // TODO: Implémenter avec mock de conversion
  });

  test.skip('devrait gérer les erreurs backend', async ({ page }) => {
    // TODO: Implémenter en coupant le backend
  });
});

/*
 * Pour activer ces tests:
 * 
 * 1. Installer Playwright browsers:
 *    npx playwright install
 * 
 * 2. Créer des fixtures de test (DVD de test, etc.)
 * 
 * 3. Implémenter les tests skippés
 * 
 * 4. Lancer les tests:
 *    npm run test:e2e
 * 
 * 5. Voir le rapport:
 *    npx playwright show-report
 */

