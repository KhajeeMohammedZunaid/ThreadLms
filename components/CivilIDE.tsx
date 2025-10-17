import React from 'react';

const CivilIDE: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Compact Control Bar */}
      <div className="bg-dark-sidebar border-b border-dark-border px-3 py-2 flex items-center gap-3">
        <span className="text-xs text-gray-400 font-medium">GeoGebra - Mathematics & Geometry Tool</span>
      </div>

      {/* Full-Screen GeoGebra Interface */}
      <div className="flex-1">
        <iframe
          src="https://www.geogebra.org/3d"
          className="w-full h-full border-0"
          title="GeoGebra"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
};

export default CivilIDE;
