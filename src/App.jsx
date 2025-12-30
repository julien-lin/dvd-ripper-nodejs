import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConfigForm from './components/ConfigForm';
import ProgressPanel from './components/ProgressPanel';
import ResultsPanel from './components/ResultsPanel';
import ResumeModal from './components/ResumeModal';
import NotificationSettings from './components/NotificationSettings';
import ThemeToggle from './components/ThemeToggle';
import SkipLink from './components/SkipLink';
import { POLLING_INTERVAL, debugLog } from './config';
import dvdApi, { ApiError } from './api/client';
import { useToast } from './components/common/ToastContainer';
import { useWebSocket } from './hooks/useWebSocket';
import {
  notifyConversionComplete,
  notifyConversionError,
  notifyConversionStopped,
  titleBadge,
  loadNotificationPreferences,
} from './services/notificationService';
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
  const [usePolling, setUsePolling] = useState(false); // Fallback sur polling si WebSocket échoue
  const [showResumeModal, setShowResumeModal] = useState(false);
  
  // Selectors Redux
  const dependencies = useSelector(selectDependencies);
  const conversion = useSelector(selectConversion);
  const outputDir = useSelector(selectOutputDir);
  const backendAvailable = useSelector(selectBackendAvailable);
  const isScanning = useSelector(selectIsScanning);

  // WebSocket pour temps réel
  const { isConnected } = useWebSocket({
    onConversionProgress: (data) => {
      dispatch(setConversion(data));
      // Mettre à jour le badge du titre
      if (data.progress) {
        const totalProgress = Math.round(data.progress.totalProgress || 0);
        titleBadge.setPermanent(`(${totalProgress}%)`, 'DVD Ripper');
      }
    },
    onConversionComplete: (data) => {
      dispatch(setConversion(data));
      toast.success('✅ Conversion terminée !');
      
      // Notifications
      if (loadNotificationPreferences()) {
        const stats = {
          success: data.progress?.details?.filter(d => d.status === 'success').length || 0,
          failed: data.progress?.details?.filter(d => d.status === 'error').length || 0,
        };
        notifyConversionComplete(stats);
      }
      
      // Badge de succès clignotant
      titleBadge.set('✅', 'Conversion terminée');
      setTimeout(() => titleBadge.reset(), 10000);
    },
    onConversionError: (data) => {
      dispatch(setConversion(data));
      toast.error('❌ Erreur pendant la conversion');
      
      // Notifications
      if (loadNotificationPreferences()) {
        notifyConversionError(data.error || 'Une erreur est survenue');
      }
      
      // Badge d'erreur
      titleBadge.setPermanent('❌', 'Erreur de conversion');
      setTimeout(() => titleBadge.reset(), 10000);
    },
    onConversionStopped: (data) => {
      dispatch(setConversion(data));
      toast.warning('⏸️ Conversion arrêtée');
      
      // Notifications
      if (loadNotificationPreferences()) {
        notifyConversionStopped();
      }
      
      // Réinitialiser le badge
      titleBadge.reset();
    },
    enabled: backendAvailable && !usePolling,
  });

  // Vérifier les dépendances au chargement
  useEffect(() => {
    checkDependencies();
    checkStatus();
    // Vérifier s'il y a une conversion à reprendre
    setShowResumeModal(true);
    
    // Réinitialiser le badge du titre
    titleBadge.reset();
    
    // Réinitialiser le badge quand l'utilisateur revient sur la page
    const handleVisibilityChange = () => {
      if (!document.hidden && conversion?.status !== 'running') {
        titleBadge.reset();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fallback: Polling si WebSocket non connecté
  useEffect(() => {
    // Si WebSocket ne se connecte pas après 10 secondes, utiliser le polling
    if (backendAvailable && !isConnected && !usePolling) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ WebSocket non disponible, fallback sur polling');
        setUsePolling(true);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [backendAvailable, isConnected, usePolling]);

  // Polling (uniquement si WebSocket échoue)
  useEffect(() => {
    if (usePolling && conversion?.status === 'running') {
      const interval = setInterval(() => {
        checkStatus();
      }, POLLING_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [usePolling, conversion?.status]);

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
      
      // Réinitialiser le badge du titre
      titleBadge.reset();
      
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

  const handleResumeConversion = async () => {
    setShowResumeModal(false);
    // Rafraîchir le statut pour afficher la conversion reprise
    await checkStatus();
    toast.success('🔄 Conversion reprise avec succès !');
  };

  const handleDeclineResume = () => {
    setShowResumeModal(false);
    toast.info('État de conversion supprimé');
  };

  return (
    <>
      {/* Skip Link pour accessibilité */}
      <SkipLink />
      
      {/* Modal de reprise de conversion */}
      {showResumeModal && backendAvailable && (
        <ResumeModal
          onResume={handleResumeConversion}
          onDecline={handleDeclineResume}
        />
      )}
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 theme-transition">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">
                🎬 Extracteur DVD vers MP4
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Interface conviviale pour convertir vos DVD en fichiers MP4
              </p>
            </div>
            {backendAvailable && (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificationSettings />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Avertissement backend non disponible */}
      {!backendAvailable && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 theme-transition">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold text-red-800 dark:text-red-300 mb-2">⚠️ Backend non disponible</div>
                <div className="text-sm text-red-700 dark:text-red-400">
                  Le serveur backend n'est pas démarré ou n'est pas accessible sur le port 3001.
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                  Pour démarrer le backend, exécutez dans un terminal :
                </div>
                <code className="block mt-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded text-xs sm:text-sm overflow-x-auto text-red-800 dark:text-red-300">
                  cd server && npm start
                </code>
              </div>
              <button
                onClick={checkDependencies}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 whitespace-nowrap theme-transition"
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
          <div className={`p-4 rounded-lg theme-transition ${
            dependencies.allInstalled 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">État des dépendances</div>
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
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  {!dependencies.bc && (
                    <>
                      Installez bc avec:<br />
                      <code className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-yellow-900 dark:text-yellow-200">
                        sudo apt install bc
                      </code>
                    </>
                  )}
                  {!dependencies.ffmpeg || !dependencies.ffprobe ? (
                    <div className="mt-2 text-red-600 dark:text-red-400">
                      ⚠ Erreur: Les binaires ffmpeg/ffprobe embarqués ne sont pas disponibles
                    </div>
                  ) : null}
                </div>
              )}
              {dependencies.allInstalled && dependencies.embedded && (
                <div className="text-sm text-green-700 dark:text-green-300">
                  ✓ Toutes les dépendances sont disponibles<br />
                  <span className="text-xs text-gray-600 dark:text-gray-400">ffmpeg et ffprobe sont embarqués dans l'application</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main 
        id="main-content" 
        tabIndex="-1"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6"
        aria-label="Contenu principal de l'application"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 theme-transition">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Extracteur DVD - Version 2.3 🌙
        </div>
      </footer>
    </div>
    </>
  );
}

export default App;
