import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

const FolderPicker = ({ value, onChange, label, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(value || '/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pathHistory, setPathHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadDirectory(currentPath);
    }
  }, [isOpen, currentPath]);

  const loadDirectory = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/list-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      // Vérifier le Content-Type avant de parser
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Le serveur a retourné une réponse invalide. Vérifiez que le backend est démarré.');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      // Gérer les erreurs de parsing JSON
      if (err instanceof SyntaxError) {
        setError('Erreur de communication avec le serveur. Vérifiez que le backend est démarré sur le port 3001.');
      } else {
        setError(err.message);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setCurrentPath(value || '/');
    setPathHistory([]);
    setIsOpen(true);
  };

  const handleSelectFolder = (folderPath) => {
    onChange(folderPath);
    setIsOpen(false);
  };

  const handleNavigate = (newPath) => {
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
  };

  const handleGoBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setCurrentPath(previousPath);
    }
  };

  const handleGoUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    handleNavigate(parentPath);
  };


  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          📁 Parcourir
        </button>
      </div>

      {/* Modal de sélection */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Sélectionner un dossier
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Navigation */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={handleGoBack}
                  disabled={pathHistory.length === 0}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleGoUp}
                  disabled={currentPath === '/'}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  ↑ Parent
                </button>
                <input
                  type="text"
                  value={currentPath}
                  onChange={(e) => setCurrentPath(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadDirectory(currentPath);
                    }
                  }}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded"
                  placeholder="Chemin du dossier"
                />
                <button
                  onClick={() => loadDirectory(currentPath)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Aller
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Chemin actuel: <span className="font-mono">{currentPath}</span>
              </div>
            </div>

            {/* Chemins communs */}
            <div className="p-4 border-b">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Chemins rapides:
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleNavigate('/')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  / (Racine)
                </button>
                <button
                  onClick={() => handleNavigate('/media')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  /media
                </button>
                <button
                  onClick={() => handleNavigate('/mnt')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  /mnt
                </button>
                <button
                  onClick={() => handleNavigate('~')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  ~ (Home)
                </button>
              </div>
            </div>

            {/* Liste des dossiers */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="text-center py-8 text-gray-500">
                  Chargement...
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun dossier trouvé
                </div>
              )}

              {!loading && !error && items.length > 0 && (
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        if (item.isDirectory) {
                          handleNavigate(item.path);
                        } else {
                          // Si c'est un fichier, aller au dossier parent
                          const parentPath = item.path.split('/').slice(0, -1).join('/') || '/';
                          handleNavigate(parentPath);
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 flex items-center gap-2"
                    >
                      <span className="text-xl">
                        {item.isDirectory ? '📁' : '📄'}
                      </span>
                      <span className="flex-1 font-medium text-gray-800">
                        {item.name}
                      </span>
                      {item.isDirectory && (
                        <span className="text-xs text-gray-500">→</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Dossier sélectionné: <span className="font-mono font-semibold">{value || 'Aucun'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSelectFolder(currentPath)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sélectionner ce dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderPicker;

