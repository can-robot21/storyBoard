import React, { useState, useEffect } from 'react';
import TokenCalculator, { APICall } from '../../utils/tokenCalculator';
import { useUIStore } from '../../stores/uiStore';

interface APIUsageIndicatorProps {
  className?: string;
}

export const APIUsageIndicator: React.FC<APIUsageIndicatorProps> = ({ className = '' }) => {
  const { addNotification } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    callsByType: {} as { [key: string]: number },
    callsByModel: {} as { [key: string]: number }
  });
  const [recentCalls, setRecentCalls] = useState<APICall[]>([]);

  const tokenCalculator = TokenCalculator.getInstance();

  useEffect(() => {
    const updateStats = () => {
      setSessionStats(tokenCalculator.getCurrentSessionStats());
      setRecentCalls(tokenCalculator.getCurrentSessionStats().totalCalls > 0 
        ? tokenCalculator['currentSessionCalls'].slice(-5) 
        : []);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
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

  const handleClearSession = () => {
    tokenCalculator.clearSession();
    setSessionStats({
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      callsByType: {},
      callsByModel: {}
    });
    setRecentCalls([]);
    addNotification({
      type: 'success',
      title: '세션 초기화',
      message: '현재 세션의 API 사용량이 초기화되었습니다.',
    });
  };

  if (sessionStats.totalCalls === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm">
        {/* 헤더 */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">API 사용량</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {formatTokens(sessionStats.totalTokens)} 토큰
            </span>
            <span className="text-xs text-gray-500">
              {formatCost(sessionStats.totalCost)}
            </span>
            <button className="text-gray-400 hover:text-gray-600">
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>

        {/* 확장된 내용 */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-3 space-y-3">
            {/* 통계 요약 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-medium">총 호출</div>
                <div className="text-blue-800">{sessionStats.totalCalls}회</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-green-600 font-medium">총 토큰</div>
                <div className="text-green-800">{formatTokens(sessionStats.totalTokens)}</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="text-purple-600 font-medium">총 비용</div>
                <div className="text-purple-800">{formatCost(sessionStats.totalCost)}</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="text-orange-600 font-medium">평균 토큰</div>
                <div className="text-orange-800">
                  {formatTokens(Math.round(sessionStats.totalTokens / sessionStats.totalCalls))}
                </div>
              </div>
            </div>

            {/* 타입별 통계 */}
            {Object.keys(sessionStats.callsByType).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">타입별 호출</div>
                <div className="space-y-1">
                  {Object.entries(sessionStats.callsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {type === 'text' ? '📝 텍스트' : 
                         type === 'image' ? '🖼️ 이미지' : 
                         type === 'video' ? '🎬 영상' : type}
                      </span>
                      <span className="text-gray-800">{count}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 모델별 통계 */}
            {Object.keys(sessionStats.callsByModel).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">모델별 호출</div>
                <div className="space-y-1">
                  {Object.entries(sessionStats.callsByModel).map(([model, count]) => (
                    <div key={model} className="flex justify-between text-xs">
                      <span className="text-gray-600 truncate">{model}</span>
                      <span className="text-gray-800">{count}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최근 호출 */}
            {recentCalls.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">최근 호출</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recentCalls.map((call) => (
                    <div key={call.id} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {call.type === 'text' ? '📝' : 
                           call.type === 'image' ? '🖼️' : '🎬'}
                        </span>
                        <span className="text-gray-500">
                          {new Date(call.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-700 truncate mt-1">{call.prompt}</div>
                      <div className="text-gray-500 mt-1">
                        {formatTokens(call.tokens.totalTokens)} 토큰
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={handleClearSession}
                className="flex-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                세션 초기화
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIUsageIndicator;