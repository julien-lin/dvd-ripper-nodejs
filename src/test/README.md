# 🧪 Tests - DVD Ripper

Guide pour écrire et exécuter les tests.

## 🚀 Exécution des Tests

### Tests en mode watch (développement)
```bash
npm test
```

### Tests avec coverage
```bash
npm run test:coverage
```

### Tests en mode CI (une fois)
```bash
npm run test:run
```

### Tests avec UI interactive
```bash
npm run test:ui
```

## 📁 Structure des Tests

```
src/
├── utils/
│   ├── formatters.js
│   └── formatters.test.js          # Tests des utilitaires
├── api/
│   ├── client.js
│   └── client.test.js              # Tests du client API
├── components/
│   └── common/
│       ├── Toast.jsx
│       └── Toast.test.jsx          # Tests des composants
└── test/
    ├── setup.js                     # Configuration globale
    └── README.md                    # Ce fichier
```

## ✍️ Écrire un Test

### Test d'une fonction utilitaire

```javascript
import { describe, it, expect } from 'vitest';
import { formatDuration } from './formatters';

describe('formatDuration', () => {
  it('formate correctement les secondes', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('gère les valeurs nulles', () => {
    expect(formatDuration(null)).toBe('00:00:00');
  });
});
```

### Test d'un appel API

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from './client';
import { mockFetchSuccess } from '../test/setup';

describe('apiClient.get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('effectue une requête GET', async () => {
    mockFetchSuccess({ data: 'test' });

    const result = await apiClient.get('/test');
    
    expect(result).toEqual({ data: 'test' });
  });
});
```

### Test d'un composant React

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('affiche le texte correctement', () => {
    render(<MyComponent text="Hello" />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('appelle le callback au clic', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<MyComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🎯 Helpers de Test

### Mock fetch avec succès
```javascript
import { mockFetchSuccess } from '../test/setup';

mockFetchSuccess({ success: true, data: 'test' });
```

### Mock fetch avec erreur
```javascript
import { mockFetchError } from '../test/setup';

mockFetchError(404, 'Not found');
```

### Mock fetch avec erreur réseau
```javascript
import { mockFetchNetworkError } from '../test/setup';

mockFetchNetworkError();
```

## 📊 Coverage

Les seuils de coverage sont configurés à **60%** minimum :

- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

**Objectif:** Atteindre 80%+ pour les fichiers critiques (utils, api)

## 🔧 Configuration

La configuration est dans `vitest.config.js` :

- **Environment:** jsdom (pour React)
- **Globals:** activés (pas besoin d'importer describe/it/expect)
- **Setup:** `src/test/setup.js` chargé avant chaque test
- **Coverage:** v8 provider avec rapports text/json/html

## 📝 Conventions

### Nommage des fichiers
- Tests unitaires: `*.test.js` ou `*.test.jsx`
- Tests d'intégration: `*.integration.test.js`
- Specs: `*.spec.js` (accepté mais moins utilisé)

### Structure d'un test
```javascript
describe('Nom du module/composant', () => {
  beforeEach(() => {
    // Setup avant chaque test
  });

  afterEach(() => {
    // Cleanup après chaque test (automatique pour React)
  });

  it('décrit ce que le test vérifie', () => {
    // Arrange (préparer)
    const input = 'test';
    
    // Act (agir)
    const result = myFunction(input);
    
    // Assert (vérifier)
    expect(result).toBe('expected');
  });
});
```

## 🚫 À Éviter

❌ **Tests trop larges**
```javascript
it('teste tout', () => {
  // Teste 10 choses différentes
});
```

✅ **Tests ciblés**
```javascript
it('teste la validation des emails', () => {
  // Teste uniquement ça
});
```

❌ **Tests dépendants**
```javascript
let globalState;

it('test 1', () => {
  globalState = 'value';
});

it('test 2', () => {
  expect(globalState).toBe('value'); // ⚠️ Dépend du test 1
});
```

✅ **Tests indépendants**
```javascript
it('test 1', () => {
  const state = 'value';
  expect(state).toBe('value');
});

it('test 2', () => {
  const state = 'value';
  expect(state).toBe('value');
});
```

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## 🎯 TODO

- [ ] Ajouter tests pour ConfigForm
- [ ] Ajouter tests pour ProgressPanel
- [ ] Ajouter tests pour ResultsPanel
- [ ] Ajouter tests pour FolderPicker
- [ ] Tests E2E avec Playwright
- [ ] CI/CD avec GitHub Actions

---

**Dernière mise à jour:** 30 Décembre 2025

