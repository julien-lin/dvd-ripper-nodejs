import { useState } from 'react';
import FolderPicker from './FolderPicker';
import { useToast } from './common/ToastContainer';
import { SkeletonList } from './Skeleton';
import { usePersistedConfig } from '../hooks/usePersistedConfig';

const ConfigForm = ({ onStart, onScan, isScanning, isConverting }) => {
  const toast = useToast();
  
  // Configuration par défaut
  const defaultConfig = {
    dvdPath: '/media/julien/LG_VDR/VIDEO_TS',
    outputDir: '/home/julien/Videos/DVD_Convert',
    videoPreset: 'medium',
    videoCrf: '18',
    audioBitrate: '192k'
  };
  
  // Utiliser le hook de persistance pour sauvegarder automatiquement
  const [config, setConfig, resetToDefaults] = usePersistedConfig('dvd-ripper-config', defaultConfig);

  const [selectedVts, setSelectedVts] = useState([]);
  const [vtsList, setVtsList] = useState([]);

  const handleScan = async () => {
    if (!config.dvdPath) {
      toast.warning('Veuillez entrer un chemin DVD');
      return;
    }
    onScan(config.dvdPath, setVtsList);
  };

  const handleStart = () => {
    if (!config.dvdPath || !config.outputDir) {
      toast.warning('Veuillez remplir tous les champs requis');
      return;
    }
    onStart({ ...config, selectedVts });
  };

  const toggleVts = (vts) => {
    setSelectedVts(prev => 
      prev.includes(vts) 
        ? prev.filter(v => v !== vts)
        : [...prev, vts]
    );
  };

  const selectAll = () => {
    setSelectedVts(vtsList.map(v => v.vts));
  };

  const deselectAll = () => {
    setSelectedVts([]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6 transition-colors duration-300">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 dark:text-gray-100">Configuration</h2>

      {/* Chemins */}
      <div className="space-y-4">
        <FolderPicker
          label="Chemin DVD (VIDEO_TS)"
          value={config.dvdPath}
          onChange={(path) => setConfig({ ...config, dvdPath: path })}
          placeholder="/media/user/DVD/VIDEO_TS"
          disabled={isConverting}
        />

        <FolderPicker
          label="Répertoire de sortie"
          value={config.outputDir}
          onChange={(path) => setConfig({ ...config, outputDir: path })}
          placeholder="/home/user/Videos/DVD_Convert"
          disabled={isConverting}
        />

        <button
          onClick={handleScan}
          disabled={isScanning || isConverting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isScanning && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{isScanning ? 'Scan en cours...' : 'Scanner le DVD'}</span>
        </button>
      </div>

      {/* Skeleton pendant le scan */}
      {isScanning && (
        <div className="border-t pt-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Scan en cours...
          </h3>
          <SkeletonList items={3} />
        </div>
      )}

      {/* Liste des VTS */}
      {vtsList.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
              Titres disponibles ({vtsList.length})
            </h3>
            <div className="flex gap-2 text-sm">
              <button
                onClick={selectAll}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow"
                disabled={isConverting || selectedVts.length === vtsList.length}
                title="Sélectionner tous les titres VTS"
              >
                ✓ Tout sélectionner
              </button>
              <button
                onClick={deselectAll}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                disabled={isConverting || selectedVts.length === 0}
                title="Désélectionner tous les titres VTS"
              >
                ✗ Tout désélectionner
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
            {vtsList.map((vts) => (
              <label
                key={vts.vts}
                className={`
                  flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200
                  ${selectedVts.includes(vts.vts) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                  ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedVts.includes(vts.vts)}
                  onChange={() => toggleVts(vts.vts)}
                  disabled={isConverting}
                  className="mr-3 w-5 h-5 text-blue-600 dark:text-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-0 transition-colors cursor-pointer"
                  aria-label={`Sélectionner VTS ${vts.vts}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>VTS_{vts.vts}</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {vts.files} fichier{vts.files > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center">
                      ⏱️ {vts.durationFormatted || 'N/A'}
                    </span>
                  </div>
                </div>
                {selectedVts.includes(vts.vts) && (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            ))}
          </div>
          {selectedVts.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Aucun titre sélectionné. Tous les titres seront convertis.
            </p>
          )}
        </div>
      )}

      {/* Paramètres de qualité */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Paramètres de qualité</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preset (vitesse)
          </label>
          <select
            value={config.videoPreset}
            onChange={(e) => setConfig({ ...config, videoPreset: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            disabled={isConverting}
          >
            <option value="slow">Slow (qualité optimale, lent)</option>
            <option value="medium">Medium (équilibré)</option>
            <option value="fast">Fast (rapide, qualité acceptable)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CRF (qualité) - {config.videoCrf}
          </label>
          <input
            type="range"
            min="18"
            max="23"
            value={config.videoCrf}
            onChange={(e) => setConfig({ ...config, videoCrf: e.target.value })}
            className="w-full"
            disabled={isConverting}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>18 (excellente)</span>
            <span>20 (très bonne)</span>
            <span>23 (bonne)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bitrate audio
          </label>
          <select
            value={config.audioBitrate}
            onChange={(e) => setConfig({ ...config, audioBitrate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            disabled={isConverting}
          >
            <option value="128k">128 kbps</option>
            <option value="192k">192 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="320k">320 kbps</option>
          </select>
        </div>
      </div>

      {/* Bouton restaurer paramètres par défaut */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Paramètres de conversion
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Les paramètres sont sauvegardés automatiquement
          </p>
        </div>
        <button
          onClick={() => {
            resetToDefaults();
            toast.success('Paramètres restaurés aux valeurs par défaut');
          }}
          disabled={isConverting}
          className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Réinitialiser aux valeurs par défaut"
        >
          🔄 Restaurer
        </button>
      </div>

      {/* Bouton de démarrage */}
      <button
        onClick={handleStart}
        disabled={isConverting || !config.dvdPath || !config.outputDir}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
      >
        {isConverting ? 'Conversion en cours...' : 'Démarrer la conversion'}
      </button>
    </div>
  );
};

export default ConfigForm;

