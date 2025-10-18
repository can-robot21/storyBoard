import React, { useState } from 'react';
import { Lightbulb, Copy, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface SmartInputHelperProps {
  type: 'story' | 'character' | 'scenario';
  onApplySuggestion: (suggestion: string) => void;
  currentValue?: string;
}

export const SmartInputHelper: React.FC<SmartInputHelperProps> = ({
  type,
  onApplySuggestion,
  currentValue = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { addNotification } = useUIStore();

  const getSuggestions = () => {
    switch (type) {
      case 'story':
        return [
          "한 소년이 마법의 세계로 떠나는 모험 이야기",
          "미래 도시에서 일어나는 로봇과 인간의 우정",
          "고대 왕국을 배경으로 한 판타지 모험",
          "학교를 배경으로 한 청춘 로맨스",
          "우주를 배경으로 한 SF 모험"
        ];
      case 'character':
        return [
          "용감한 마법사 - 지혜롭고 친절한 성격",
          "똑똑한 발명가 - 호기심이 많고 창의적",
          "강한 전사 - 정의롭고 용감한 성격",
          "재미있는 코미디언 - 유머러스하고 밝은 성격",
          "신비한 마법사 - 조용하고 지혜로운 성격"
        ];
      case 'scenario':
        return [
          "주인공이 새로운 세계를 발견하고 모험을 시작하는 이야기",
          "친구들과 함께 어려운 문제를 해결해나가는 과정",
          "사랑하는 사람을 구하기 위한 위험한 여행",
          "마법의 힘을 배우며 성장하는 과정",
          "팀워크로 큰 위기를 극복하는 이야기"
        ];
      default:
        return [];
    }
  };

  const handleCopySuggestion = (suggestion: string, index: number) => {
    navigator.clipboard.writeText(suggestion).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      addNotification({
        type: 'success',
        title: '복사 완료',
        message: '제안이 클립보드에 복사되었습니다.',
      });
    });
  };

  const handleApplySuggestion = (suggestion: string) => {
    onApplySuggestion(suggestion);
    setIsOpen(false);
    addNotification({
      type: 'success',
      title: '적용 완료',
      message: '제안이 입력 필드에 적용되었습니다.',
    });
  };

  const suggestions = getSuggestions();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg border border-yellow-300 transition-colors"
      >
        <Lightbulb className="w-4 h-4" />
        스마트 입력 도우미
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {type === 'story' ? '스토리' : type === 'character' ? '캐릭터' : '시나리오'} 제안
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700 mb-2">{suggestion}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      적용
                    </button>
                    <button
                      onClick={() => handleCopySuggestion(suggestion, index)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          복사
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              💡 현재 입력된 내용: {currentValue ? `${currentValue.substring(0, 50)}...` : '없음'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
