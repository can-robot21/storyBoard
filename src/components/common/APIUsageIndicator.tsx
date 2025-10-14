import React, { useState, useEffect } from 'react';
import TokenCalculator from '../../utils/tokenCalculator';

interface APIUsageIndicatorProps {
  className?: string;
}

export const APIUsageIndicator: React.FC<APIUsageIndicatorProps> = ({ className = '' }) => {
  const [sessionStats, setSessionStats] = useState({
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    callsByType: {} as { [key: string]: number },
    callsByModel: {} as { [key: string]: number }
  });

  const tokenCalculator = TokenCalculator.getInstance();

  useEffect(() => {
    const updateStats = () => {
      setSessionStats(tokenCalculator.getCurrentSessionStats());
    };

    // 초기 로드
    updateStats();

    // 이벤트 기반 업데이트로 변경 (주기적 호출 제거)
    const handleApiCall = () => {
      updateStats();
    };

    // API 호출 시에만 업데이트
    window.addEventListener('apiCallCompleted', handleApiCall);
    window.addEventListener('apiCallFailed', handleApiCall);

    return () => {
      window.removeEventListener('apiCallCompleted', handleApiCall);
      window.removeEventListener('apiCallFailed', handleApiCall);
    };
  }, []);

  const formatCost = (cost: number): string => {
    if (cost < 0.001) return '< $0.001';
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  if (sessionStats.totalCalls === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-24 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs">
        {/* 간소화된 헤더 */}
        <div className="flex items-center justify-center p-2">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">
              {formatTokens(sessionStats.totalTokens)}
            </span>
            <span className="text-xs text-gray-500">
              {formatCost(sessionStats.totalCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIUsageIndicator;