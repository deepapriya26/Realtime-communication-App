import React from "react";

const LoadingSpinner = ({ fullscreen = false, message = "Loading..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-accent-cyan/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-accent-cyan rounded-full animate-spin" />
      </div>
      {message && (
        <p className="font-body text-gray-500 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-space-950 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="font-display text-accent-cyan text-xl tracking-wider mb-8">⚡ SYNCSPACE</div>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
