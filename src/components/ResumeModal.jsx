import { useState, useEffect } from 'react';
import dvdApi from '../api/client';

const ResumeModal = ({ onResume, onDecline }) => {
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkForSavedState();
  }, []);

  const checkForSavedState = async () => {
    try {
      setLoading(true);
      const response = await dvdApi.getResumeState();
      
      if (response.hasSavedState) {
        // progress est un array d'items [{vts, status, progress, message, startTime}, ...]
        const progressArray = response.state.progress || [];
        setResumeData({
          hasState: true,
          state: response.state,
          stats: {
            total: progressArray.length,
            completed: progressArray.filter(d => d.status === 'success').length,
            remaining: progressArray.filter(d => d.status !== 'success').length,
          }
        });
      } else {
        // Pas d'état sauvegardé, fermer automatiquement
        onDecline();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setLoading(true);
      // La reprise est gérée par le composant parent (App.jsx)
      onResume();
    } catch (err) {
      setError(`Erreur lors de la reprise: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      await dvdApi.clearResumeState();
      onDecline();
    } catch (err) {
      console.error('Erreur suppression état:', err);
      onDecline(); // Fermer quand même
    }
  };

  if (loading && !resumeData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification d'une conversion en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Erreur</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onDecline}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return null;
  }

  const { state, stats } = resumeData;
  const savedDate = state.savedAt ? new Date(state.savedAt) : new Date();
  const now = new Date();
  const hoursDiff = Math.round((now - savedDate) / (1000 * 60 * 60));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">🔄</div>
            <div>
              <h2 className="text-2xl font-bold">Conversion interrompue détectée</h2>
              <p className="text-blue-100 text-sm">
                Une conversion était en cours il y a {hoursDiff}h
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total VTS</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Déjà convertis</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.remaining}</div>
              <div className="text-sm text-gray-600">Restants</div>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {state.dvdPath && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chemin DVD:</span>
                <span className="font-medium text-gray-800 truncate ml-2">{state.dvdPath}</span>
              </div>
            )}
            {state.outputDir && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dossier de sortie:</span>
                <span className="font-medium text-gray-800 truncate ml-2">{state.outputDir}</span>
              </div>
            )}
            {state.videoPreset && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Preset:</span>
                <span className="font-medium text-gray-800">{state.videoPreset}</span>
              </div>
            )}
          </div>

          {/* Détails des VTS */}
          {state.progress && state.progress.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Détails par titre</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {state.progress.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      item.status === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {item.status === 'success' ? '✓' : '⏳'}
                      </span>
                      <span className="font-medium text-gray-800">VTS_{item.vts}</span>
                    </div>
                    <span className={`text-sm ${
                      item.status === 'success' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {item.status === 'success' ? 'Complété' : 'À reprendre'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message d'information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div className="flex-1 text-sm">
                <p className="text-blue-800 font-medium mb-1">
                  Reprendre la conversion ?
                </p>
                <p className="text-blue-700">
                  Les {stats.completed} VTS déjà convertis seront conservés. 
                  Seuls les {stats.remaining} VTS restants seront traités.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-6 border-t flex gap-3">
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
          >
            Refuser (supprimer l'état)
          </button>
          <button
            onClick={handleResume}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors disabled:opacity-50 font-medium shadow-lg"
          >
            {loading ? 'Reprise en cours...' : '🔄 Reprendre la conversion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;

