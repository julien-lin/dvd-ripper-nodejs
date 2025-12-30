import { useState } from 'react';
import FolderPicker from './FolderPicker';

const ConfigForm = ({ onStart, onScan, isScanning, isConverting }) => {
  const [config, setConfig] = useState({
    dvdPath: '/media/julien/LG_VDR/VIDEO_TS',
    outputDir: '/home/julien/Videos/DVD_Convert',
    videoPreset: 'medium',
    videoCrf: '18',
    audioBitrate: '192k'
  });

  const [selectedVts, setSelectedVts] = useState([]);
  const [vtsList, setVtsList] = useState([]);

  const handleScan = async () => {
    if (!config.dvdPath) {
      alert('Veuillez entrer un chemin DVD');
      return;
    }
    onScan(config.dvdPath, setVtsList);
  };

  const handleStart = () => {
    if (!config.dvdPath || !config.outputDir) {
      alert('Veuillez remplir tous les champs requis');
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
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Configuration</h2>

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

      {/* Liste des VTS */}
      {vtsList.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Titres disponibles ({vtsList.length})
            </h3>
            <div className="space-x-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={isConverting}
              >
                Tout sélectionner
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-800"
                disabled={isConverting}
              >
                Tout désélectionner
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {vtsList.map((vts) => (
              <label
                key={vts.vts}
                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedVts.includes(vts.vts)}
                  onChange={() => toggleVts(vts.vts)}
                  disabled={isConverting}
                  className="mr-3 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    VTS_{vts.vts} ({vts.files} fichier{vts.files > 1 ? 's' : ''})
                  </div>
                  <div className="text-sm text-gray-600">
                    Durée: {vts.durationFormatted || 'N/A'}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {selectedVts.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Aucun titre sélectionné. Tous les titres seront convertis.
            </p>
          )}
        </div>
      )}

      {/* Paramètres de qualité */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Paramètres de qualité</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preset (vitesse)
          </label>
          <select
            value={config.videoPreset}
            onChange={(e) => setConfig({ ...config, videoPreset: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isConverting}
          >
            <option value="slow">Slow (qualité optimale, lent)</option>
            <option value="medium">Medium (équilibré)</option>
            <option value="fast">Fast (rapide, qualité acceptable)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>18 (excellente)</span>
            <span>20 (très bonne)</span>
            <span>23 (bonne)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bitrate audio
          </label>
          <select
            value={config.audioBitrate}
            onChange={(e) => setConfig({ ...config, audioBitrate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isConverting}
          >
            <option value="128k">128 kbps</option>
            <option value="192k">192 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="320k">320 kbps</option>
          </select>
        </div>
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

