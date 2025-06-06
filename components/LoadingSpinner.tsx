
import React from 'react';

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = "w-8 h-8" }) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-purple-500 border-t-transparent ${size}`} role="status">
      <span className="sr-only">Carregando...</span>
    </div>
  );
};

export default LoadingSpinner;
