import React from 'react';

const MechanicalIDE: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Compact Control Bar */}
      <div className="bg-dark-sidebar border-b border-dark-border px-3 py-2 flex items-center gap-3">
        <span className="text-xs text-gray-400 font-medium">Autodesk Fusion 360 - Professional CAD/CAM Software</span>
        <a 
          href="https://www.autodesk.com/products/fusion-360/free-trial" 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-auto text-[10px] px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
        >
          Launch Fusion 360
        </a>
      </div>

      {/* Full-Screen Interface */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center max-w-2xl px-8">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Autodesk Fusion 360
          </h2>
          
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Industry-leading CAD/CAM/CAE software for mechanical engineering. 
            <strong className="text-gray-300"> Note:</strong> Fusion 360 requires desktop installation and cannot be embedded directly. 
            Click the button above to access the web version or download the desktop app.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left mb-6">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-gray-300">3D Modeling</span>
              </div>
              <p className="text-[10px] text-gray-500">Parametric & direct modeling</p>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-gray-300">CAM</span>
              </div>
              <p className="text-[10px] text-gray-500">Manufacturing toolpaths</p>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-gray-300">Simulation</span>
              </div>
              <p className="text-[10px] text-gray-500">Stress analysis & testing</p>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-gray-300">Collaboration</span>
              </div>
              <p className="text-[10px] text-gray-500">Cloud-based teamwork</p>
            </div>
          </div>
          
          <a 
            href="https://www.autodesk.com/products/fusion-360/free-trial" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Access Fusion 360
          </a>
          
          <p className="text-[10px] text-gray-500 mt-4">
            Free for students and educators • Desktop & web versions available
          </p>
        </div>
      </div>
    </div>
  );
};

export default MechanicalIDE;
