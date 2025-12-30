import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useToast } from './common/ToastContainer';

export const ConversionHistory = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'success', 'error', 'cancelled'

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [historyRes, statsRes] = await Promise.all([
        apiClient.get('/history'),
        apiClient.get('/history/stats'),
      ]);
      
      setHistory(historyRes.history || []);
      setStats(statsRes.stats);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      toast.error('Échec du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Voulez-vous vraiment supprimer tout l\'historique ?')) {
      return;
    }

    try {
      await apiClient.delete('/history');
      setHistory([]);
      setStats(null);
      toast.success('Historique supprimé');
    } catch (error) {
      toast.error('Échec de la suppression');
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  }).reverse(); // Plus récent en premier

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              📊 Historique des Conversions
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="text-3xl font-bold">{stats.totalConversions}</div>
                <div className="text-sm opacity-90">Conversions</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="text-3xl font-bold">{stats.totalVtsConverted}</div>
                <div className="text-sm opacity-90">VTS convertis</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="text-3xl font-bold">{stats.totalSizeGB} GB</div>
                <div className="text-sm opacity-90">Données</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div className="text-3xl font-bold">{stats.successRate}%</div>
                <div className="text-sm opacity-90">Succès</div>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['all', 'success', 'partial', 'error', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f === 'all' ? 'Tout' : f === 'success' ? 'Réussi' : f === 'partial' ? 'Partiel' : f === 'error' ? 'Échec' : 'Annulé'}
              </button>
            ))}
            
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="ml-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🗑️ Effacer tout
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {filter === 'all' ? 'Aucune conversion dans l\'historique' : `Aucune conversion ${filter}`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map(item => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${item.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            item.status === 'partial' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            item.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'}
                        `}>
                          {item.status === 'success' ? '✓ Réussi' :
                           item.status === 'partial' ? '⚠ Partiel' :
                           item.status === 'error' ? '✗ Échec' :
                           '○ Annulé'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <div className="font-medium truncate" title={item.dvdPath}>
                          📀 {item.dvdPath}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>🎬 {item.completedVts}/{item.vtsCount} VTS</span>
                          <span>📦 {(item.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
                          <span>⏱️ {formatElapsedTime(item.elapsedTime)}</span>
                          <span>🎚️ {item.videoPreset} / CRF {item.videoCrf}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatElapsedTime(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

