import { useEffect, useState } from 'react';

const ProgressPanel = ({ conversion, onStop }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  useEffect(() => {
    if (autoScroll) {
      const logsContainer = document.getElementById('logs-container');
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    }
  }, [conversion?.logs, autoScroll]);

  if (!conversion) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
        Aucune conversion en cours
      </div>
    );
  }

  const { status, progress, logs, startTime, endTime } = conversion;
  
  // Calculer la progression globale en comptant tous les titres (pending = 0%, success = 100%, etc.)
  const totalProgress = progress.length > 0
    ? Math.min(100, Math.max(0, Math.round(
        progress.reduce((sum, p) => {
          if (p.status === 'success') return sum + 100;
          if (p.status === 'error' || p.status === 'cancelled') return sum + 0;
          if (p.status === 'pending') return sum + 0;
          // status === 'processing'
          const prog = Math.min(100, Math.max(0, p.progress || 0));
          return sum + prog;
        }, 0) / progress.length
      )))
    : 0;

  const successCount = progress.filter(p => p.status === 'success').length;
  const errorCount = progress.filter(p => p.status === 'error').length;
  const processingCount = progress.filter(p => p.status === 'processing').length;
  const pendingCount = progress.filter(p => p.status === 'pending').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'processing': return '⟳';
      case 'pending': return '⏳';
      case 'cancelled': return '⊗';
      default: return '○';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'success': return 'Terminé';
      case 'error': return 'Erreur';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-600';
      case 'WARN': return 'text-yellow-600';
      case 'OK': return 'text-green-600';
      case 'INFO': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Progression</h2>
        {status === 'running' && (
          <button
            onClick={() => setShowStopConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Arrêter
          </button>
        )}
      </div>

      {/* Modal de confirmation d'arrêt */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Arrêter la conversion ?</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir arrêter la conversion en cours ? 
              Les fichiers en cours d'encodage seront perdus.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowStopConfirm(false);
                  onStop();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Oui, arrêter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{progress.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
          <div className="text-xs text-gray-600">En attente</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{processingCount}</div>
          <div className="text-xs text-gray-600">En cours</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{successCount}</div>
          <div className="text-xs text-gray-600">Succès</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          <div className="text-xs text-gray-600">Erreurs</div>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression globale</span>
          <span className="text-sm text-gray-600">{Math.round(totalProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Liste des conversions */}
      {progress.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Détails par titre ({progress.length})</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {progress.map((item, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-3 transition-all ${
                  item.status === 'processing' ? 'border-blue-300 bg-blue-50 shadow-sm' : 
                  item.status === 'pending' ? 'border-gray-200 bg-gray-50' :
                  item.status === 'success' ? 'border-green-200 bg-green-50' :
                  item.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getStatusIcon(item.status)}</span>
                    <div>
                      <span className="font-medium text-gray-800">VTS_{item.vts}</span>
                      <div className="text-xs text-gray-500">{item.message}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                
                {item.status === 'processing' && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, item.progress || 0))}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {Math.min(100, Math.max(0, item.progress || 0))}%
                    </div>
                  </div>
                )}
                
                {item.status === 'success' && (
                  <div className="text-sm text-gray-600 mt-2 flex gap-4">
                    {item.duration && (
                      <span>⏱ {formatDuration(item.duration)}</span>
                    )}
                    {item.size && (
                      <span>💾 {formatBytes(item.size)}</span>
                    )}
                  </div>
                )}
                
                {item.status === 'pending' && (
                  <div className="text-xs text-gray-500 italic mt-1">
                    Ce titre sera traité prochainement...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Logs</h3>
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="mr-2"
            />
            Défilement auto
          </label>
        </div>
        <div
          id="logs-container"
          className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500">Aucun log pour le moment...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`ml-2 ${getLogColor(log.level)}`}>
                  [{log.level}]
                </span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statut final */}
      {status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="font-semibold text-green-800 mb-2">✓ Conversion terminée</div>
          <div className="text-sm text-green-700">
            Début: {new Date(startTime).toLocaleString()}<br />
            Fin: {endTime ? new Date(endTime).toLocaleString() : 'N/A'}
          </div>
        </div>
      )}

      {status === 'stopped' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="font-semibold text-yellow-800">⚠ Conversion arrêtée</div>
        </div>
      )}
    </div>
  );
};

function formatDuration(seconds) {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default ProgressPanel;

