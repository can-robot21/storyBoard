import React from 'react';

interface ModeToggleProps {
  isDetailedMode: boolean;
  setIsDetailedMode: (mode: boolean) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  isDetailedMode,
  setIsDetailedMode
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setIsDetailedMode(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !isDetailedMode 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          일반 보드
        </button>
        <button
          onClick={() => setIsDetailedMode(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isDetailedMode 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          상세 설정
        </button>
      </div>
    </div>
  );
};
