import { useState, useEffect } from 'react';
import ConfigForm from './components/ConfigForm';
import ProgressPanel from './components/ProgressPanel';
import ResultsPanel from './components/ResultsPanel';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [dependencies, setDependencies] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [outputDir, setOutputDir] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Vérifier les dépendances au chargement
  useEffect(() => {
    checkDependencies();
    checkStatus();
  }, []);

  // Polling pour les conversions en cours
  useEffect(() => {
    if (conversion?.status === 'running') {
      const interval = setInterval(() => {
        checkStatus();
      }, 1000); // Vérifier toutes les secondes pour les logs en temps réel

      return () => clearInterval(interval);
    }
  }, [conversion?.status]);

  const checkDependencies = async () => {
    try {
      const response = await fetch(`${API_BASE}/check-dependencies`);
      
      // Vérifier le Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setBackendAvailable(false);
        console.error('Le backend ne répond pas correctement. Vérifiez qu\'il est démarré sur le port 3001.');
        return;
      }
      
      const data = await response.json();
      setDependencies(data);
      setBackendAvailable(true);
    } catch (error) {
      setBackendAvailable(false);
      if (error instanceof SyntaxError) {
        console.error('Erreur: Le backend ne répond pas. Démarrez le serveur avec: cd server && npm start');
      } else {
        console.error('Erreur lors de la vérification des dépendances:', error);
      }
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      
      // Vérifier le Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return; // Backend non disponible, ignorer silencieusement
      }
      
      const data = await response.json();
      if (data.status !== 'idle') {
        setConversion(data);
        if (data.outputDir) {
          setOutputDir(data.outputDir);
        }
      } else {
        setConversion(null);
      }
    } catch (error) {
      // Ignorer les erreurs de connexion silencieusement pour le polling
      if (!(error instanceof SyntaxError)) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    }
  };

  const handleScan = async (dvdPath, setVtsList) => {
    setIsScanning(true);
    try {
      const response = await fetch(`${API_BASE}/scan-dvd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dvdPath })
      });
      
      // Vérifier le Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Le backend ne répond pas. Vérifiez qu\'il est démarré sur le port 3001.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du scan');
      }
      
      const data = await response.json();
      setVtsList(data.vtsList);
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('Erreur: Le backend ne répond pas correctement. Démarrez le serveur avec: cd server && npm start');
      } else {
        alert(`Erreur: ${error.message}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleStart = async (config) => {
    try {
      const response = await fetch(`${API_BASE}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      // Vérifier le Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Le backend ne répond pas. Vérifiez qu\'il est démarré sur le port 3001.');
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors du démarrage');
      }
      
      const data = await response.json();
      setConversion(data.conversion);
      setOutputDir(config.outputDir);
      
      // Démarrer le polling
      const interval = setInterval(async () => {
        await checkStatus();
        try {
          const statusResponse = await fetch(`${API_BASE}/status`);
          const contentType = statusResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const current = await statusResponse.json();
            if (current.status === 'completed' || current.status === 'stopped') {
              clearInterval(interval);
            }
          }
        } catch (err) {
          // Ignorer les erreurs de polling
        }
      }, 2000);
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('Erreur: Le backend ne répond pas correctement. Démarrez le serveur avec: cd server && npm start');
      } else {
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${API_BASE}/stop`, { method: 'POST' });
      await checkStatus();
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">
            🎬 Extracteur DVD vers MP4
          </h1>
          <p className="text-gray-600 mt-1">
            Interface conviviale pour convertir vos DVD en fichiers MP4
          </p>
        </div>
      </header>

      {/* Avertissement backend non disponible */}
      {!backendAvailable && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-red-800 mb-2">⚠️ Backend non disponible</div>
                <div className="text-sm text-red-700">
                  Le serveur backend n'est pas démarré ou n'est pas accessible sur le port 3001.
                </div>
                <div className="text-sm text-red-600 mt-2">
                  Pour démarrer le backend, exécutez dans un terminal :
                </div>
                <code className="block mt-2 bg-red-100 px-3 py-2 rounded text-sm">
                  cd server && npm start
                </code>
              </div>
              <button
                onClick={checkDependencies}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status des dépendances */}
      {dependencies && backendAvailable && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className={`p-4 rounded-lg ${
            dependencies.allInstalled 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800 mb-2">État des dépendances</div>
                <div className="text-sm space-y-1">
                  <div className={dependencies.ffmpeg ? 'text-green-600' : 'text-red-600'}>
                    {dependencies.ffmpeg ? '✓' : '✗'} ffmpeg {dependencies.embedded && dependencies.ffmpeg && '(embarqué)'}
                  </div>
                  <div className={dependencies.ffprobe ? 'text-green-600' : 'text-red-600'}>
                    {dependencies.ffprobe ? '✓' : '✗'} ffprobe {dependencies.embedded && dependencies.ffprobe && '(embarqué)'}
                  </div>
                  <div className={dependencies.bc ? 'text-green-600' : 'text-red-600'}>
                    {dependencies.bc ? '✓' : '✗'} bc
                  </div>
                </div>
              </div>
              {!dependencies.allInstalled && (
                <div className="text-sm text-yellow-800">
                  {!dependencies.bc && (
                    <>
                      Installez bc avec:<br />
                      <code className="bg-yellow-100 px-2 py-1 rounded">
                        sudo apt install bc
                      </code>
                    </>
                  )}
                  {!dependencies.ffmpeg || !dependencies.ffprobe ? (
                    <div className="mt-2 text-red-600">
                      ⚠ Erreur: Les binaires ffmpeg/ffprobe embarqués ne sont pas disponibles
                    </div>
                  ) : null}
                </div>
              )}
              {dependencies.allInstalled && dependencies.embedded && (
                <div className="text-sm text-green-700">
                  ✓ Toutes les dépendances sont disponibles<br />
                  <span className="text-xs text-gray-600">ffmpeg et ffprobe sont embarqués dans l'application</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div>
            <ConfigForm
              onStart={handleStart}
              onScan={handleScan}
              isScanning={isScanning}
              isConverting={conversion?.status === 'running'}
            />
          </div>

          {/* Progression */}
          <div>
            <ProgressPanel
              conversion={conversion}
              onStop={handleStop}
            />
          </div>
        </div>

        {/* Résultats */}
        <div>
          <ResultsPanel conversion={conversion} outputDir={outputDir} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
          Extracteur DVD - Version 2.0
        </div>
      </footer>
    </div>
  );
}

export default App;
