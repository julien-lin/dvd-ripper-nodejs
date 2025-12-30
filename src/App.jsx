import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConfigForm from './components/ConfigForm';
import ProgressPanel from './components/ProgressPanel';
import ResultsPanel from './components/ResultsPanel';
import { POLLING_INTERVAL, debugLog } from './config';
import dvdApi, { ApiError } from './api/client';
import { useToast } from './components/common/ToastContainer';
import {
  selectConversion,
  selectOutputDir,
  selectIsScanning,
  selectIsConverting,
  setConversion,
  clearConversion,
  setOutputDir,
  setIsScanning,
} from './store/conversionSlice';
import {
  selectDependencies,
  selectBackendAvailable,
  setDependencies,
  setBackendAvailable,
} from './store/systemSlice';

function App() {
  const toast = useToast();
  const dispatch = useDispatch();
  
  // Selectors Redux
  const dependencies = useSelector(selectDependencies);
  const conversion = useSelector(selectConversion);
  const outputDir = useSelector(selectOutputDir);
  const backendAvailable = useSelector(selectBackendAvailable);
  const isScanning = useSelector(selectIsScanning);

  // Vérifier les dépendances au chargement
  useEffect(() => {
    checkDependencies();
    checkStatus();
  }, []);

  // Polling pour les conversions en cours
  useEffect(() => {
    if (conversion?.status === 'running') {
      // PERFORMANCE: Réduit de 1s à 5s (3600 → 720 req/h/user)
      // TODO: Implémenter WebSockets pour temps réel sans polling
      const interval = setInterval(() => {
        checkStatus();
      }, POLLING_INTERVAL); // Vérifier toutes les 5 secondes (optimisé)

      return () => clearInterval(interval);
    }
  }, [conversion?.status]);

  const checkDependencies = async () => {
    try {
      const data = await dvdApi.checkDependencies();
      dispatch(setDependencies(data));
      dispatch(setBackendAvailable(true));
    } catch (error) {
      dispatch(setBackendAvailable(false));
      if (error instanceof ApiError) {
        console.error('Le backend ne répond pas correctement:', error.message);
      } else {
        console.error('Erreur lors de la vérification des dépendances:', error);
      }
    }
  };

  const checkStatus = async () => {
    try {
      const data = await dvdApi.getStatus();
      if (data.status !== 'idle') {
        dispatch(setConversion(data));
        if (data.outputDir) {
          dispatch(setOutputDir(data.outputDir));
        }
      } else {
        dispatch(clearConversion());
      }
    } catch (error) {
      // Ignorer les erreurs de connexion silencieusement pour le polling
      debugLog('Erreur polling status:', error);
    }
  };

  const handleScan = async (dvdPath, setVtsList) => {
    dispatch(setIsScanning(true));
    try {
      const data = await dvdApi.scanDvd(dvdPath);
      setVtsList(data.vtsList);
      toast.success(`${data.vtsList.length} titre(s) détecté(s)`);
    } catch (error) {
      toast.error(`Erreur lors du scan: ${error.message}`);
    } finally {
      dispatch(setIsScanning(false));
    }
  };

  const handleStart = async (config) => {
    try {
      const data = await dvdApi.startConversion(config);
      dispatch(setConversion(data.conversion));
      dispatch(setOutputDir(config.outputDir));
      toast.success('Conversion démarrée avec succès !');
      
      // Le polling est géré par useEffect (pas de double polling)
    } catch (error) {
      toast.error(`Erreur lors du démarrage: ${error.message}`);
    }
  };

  const handleStop = async () => {
    try {
      await dvdApi.stopConversion();
      await checkStatus();
      toast.warning('Conversion arrêtée par l\'utilisateur');
    } catch (error) {
      toast.error(`Erreur lors de l'arrêt: ${error.message}`);
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
