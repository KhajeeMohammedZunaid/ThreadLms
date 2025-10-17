import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full w-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
  </div>
);

export const FullPageLoader: React.FC = () => (
    <div className="fixed inset-0 bg-light-bg z-50 flex items-center justify-center">
        <LoadingSpinner />
    </div>
);