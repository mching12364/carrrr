import React from 'react';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <h3 className="text-xl font-medium text-slate-800">Identifying your car...</h3>
      <p className="text-slate-600 mt-2 text-center">
        Our AI is analyzing the image to identify the make, model and specifications.
      </p>
    </div>
  );
}