import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepNames,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {/* 단계 표시기 */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center">
              {/* 단계 원 */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              
              {/* 단계 이름 */}
              <div className="ml-2 text-sm">
                <div className={`
                  font-medium
                  ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                `}>
                  {stepNames[index]}
                </div>
              </div>
              
              {/* 연결선 */}
              {stepNumber < totalSteps && (
                <div
                  className={`
                    w-8 h-0.5 mx-2
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* 진행률 표시 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      
      {/* 현재 단계 정보 */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-600">
          단계 {currentStep} / {totalSteps}: {stepNames[currentStep - 1]}
        </span>
      </div>
    </div>
  );
};
