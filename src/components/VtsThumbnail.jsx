import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

/**
 * Composant pour afficher le thumbnail d'un VTS
 * Charge l'image depuis l'API backend qui extrait un frame avec FFmpeg
 */
export const VtsThumbnail = ({ vts, dvdPath, className = '' }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        // Construire l'URL de l'API
        const url = `${API_BASE_URL}/vts-thumbnail/${vts}?dvdPath=${encodeURIComponent(dvdPath)}`;
        
        // Vérifier que l'image est accessible
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Créer un blob URL pour l'image
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (mounted) {
          setThumbnailUrl(blobUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn(`Erreur chargement thumbnail VTS ${vts}:`, err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    // Cleanup: révoquer le blob URL quand le composant se démonte
    return () => {
      mounted = false;
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [vts, dvdPath, thumbnailUrl]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex items-center justify-center`}>
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex flex-col items-center justify-center text-gray-400 dark:text-gray-500`}>
        <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm11 5a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
          <path d="M3 15l2-2 2 2 4-4 6 6H3v-2z" />
        </svg>
        <span className="text-xs">Pas de preview</span>
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      alt={`Preview VTS ${vts}`}
      className={`${className} rounded object-cover`}
      loading="lazy"
    />
  );
};

