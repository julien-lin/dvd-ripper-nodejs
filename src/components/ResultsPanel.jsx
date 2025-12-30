const ResultsPanel = ({ conversion, outputDir }) => {
  if (!conversion || !outputDir) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
        Les résultats s'afficheront pendant la conversion
      </div>
    );
  }

  const { progress } = conversion;
  
  // Filtrer les fichiers terminés avec succès
  const completedFiles = progress.filter(item => item.status === 'success' && item.duration);
  
  if (completedFiles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
        Aucun fichier terminé pour le moment...
      </div>
    );
  }

  const totalSize = completedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const totalDuration = completedFiles.reduce((sum, file) => sum + (file.duration || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Résultats en temps réel
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Mise à jour automatique</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{completedFiles.length}</div>
          <div className="text-sm text-gray-600">Fichiers terminés</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{formatBytes(totalSize)}</div>
          <div className="text-sm text-gray-600">Taille totale</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{formatDuration(totalDuration)}</div>
          <div className="text-sm text-gray-600">Durée totale</div>
        </div>
      </div>

      {/* Liste des fichiers */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-3">Fichiers convertis</h3>
        <div className="space-y-2">
          {completedFiles.map((file, index) => {
            const bitrate = file.size && file.duration ? (file.size * 8 / file.duration / 1000000).toFixed(2) : 'N/A';
            
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
                      <div className="font-medium text-gray-800">
                        video_{file.vts}.mp4
                      </div>
                      <div className="text-sm text-gray-600">
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

export default ResultsPanel;
