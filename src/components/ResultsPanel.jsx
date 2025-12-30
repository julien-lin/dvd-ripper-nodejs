import { formatDuration, formatBytes, calculateBitrate } from '../utils/formatters';

const ResultsPanel = ({ conversion, outputDir }) => {
  if (!conversion || !outputDir) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500">
        Les résultats s'afficheront pendant la conversion
      </div>
    );
  }

  const { progress } = conversion;
  
  // Filtrer les fichiers terminés avec succès
  const completedFiles = progress.filter(item => item.status === 'success' && item.duration);
  
  if (completedFiles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500">
        Aucun fichier terminé pour le moment...
      </div>
    );
  }

  const totalSize = completedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const totalDuration = completedFiles.reduce((sum, file) => sum + (file.duration || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
          Résultats en temps réel
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Mise à jour automatique</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{completedFiles.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Fichiers terminés</div>
        </div>
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-green-600">{formatBytes(totalSize)}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Taille totale</div>
        </div>
        <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">{formatDuration(totalDuration)}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Durée totale</div>
        </div>
      </div>

      {/* Liste des fichiers */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Fichiers convertis</h3>
        <div className="space-y-2">
          {completedFiles.map((file, index) => {
            const bitrate = calculateBitrate(file.size, file.duration);
            
            return (
              <div 
                key={index} 
                className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-white animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        video_{file.vts}.mp4
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDuration(file.duration)} • {formatBytes(file.size)} • {bitrate} Mbps
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    Terminé
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
