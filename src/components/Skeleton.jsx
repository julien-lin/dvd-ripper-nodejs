/**
 * Composant Skeleton pour les états de chargement
 * Crée des placeholders animés pendant le chargement des données
 */

export const Skeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded', 
  className = '' 
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${width} ${height} ${rounded} ${className}`}
      role="status"
      aria-label="Chargement en cours"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton width="w-12" height="h-12" rounded="rounded-full" />
        <div className="flex-1">
          <Skeleton width="w-1/2" height="h-4" className="mb-2" />
          <Skeleton width="w-3/4" height="h-3" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
};

export const SkeletonButton = ({ className = '' }) => {
  return (
    <Skeleton 
      width="w-32" 
      height="h-10" 
      rounded="rounded-lg" 
      className={className}
    />
  );
};

export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={`header-${i}`} width="flex-1" height="h-8" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {[...Array(cols)].map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} width="flex-1" height="h-6" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonList = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton width="w-10" height="h-10" rounded="rounded-lg" />
          <div className="flex-1">
            <Skeleton width="w-3/4" height="h-4" className="mb-2" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonStats = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
          <Skeleton width="w-full" height="h-8" className="mb-2" />
          <Skeleton width="w-2/3" height="h-4" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;

