import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';

interface RealTimeFeedbackProps {
  type: 'story' | 'character' | 'scenario' | 'episode';
  value: string | any[];
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export const RealTimeFeedback: React.FC<RealTimeFeedbackProps> = ({
  type,
  value,
  required = false,
  minLength = 0,
  maxLength = Infinity
}) => {
  const [feedback, setFeedback] = useState<{
    status: 'success' | 'warning' | 'error' | 'info';
    message: string;
    icon: React.ReactNode;
  }>({
    status: 'info',
    message: '',
    icon: <Info className="w-4 h-4" />
  });

  useEffect(() => {
    const validateInput = () => {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const length = stringValue.length;

      if (required && length === 0) {
        setFeedback({
          status: 'error',
          message: `${type === 'story' ? '스토리' : type === 'character' ? '캐릭터' : type === 'scenario' ? '시나리오' : '에피소드'}를 입력해주세요.`,
          icon: <AlertCircle className="w-4 h-4" />
        });
        return;
      }

      if (length < minLength) {
        setFeedback({
          status: 'warning',
          message: `최소 ${minLength}자 이상 입력해주세요. (현재: ${length}자)`,
          icon: <Clock className="w-4 h-4" />
        });
        return;
      }

      if (length > maxLength) {
        setFeedback({
          status: 'error',
          message: `최대 ${maxLength}자까지 입력 가능합니다. (현재: ${length}자)`,
          icon: <AlertCircle className="w-4 h-4" />
        });
        return;
      }

      if (type === 'character' && Array.isArray(value)) {
        if (value.length === 0) {
          setFeedback({
            status: 'warning',
            message: '최소 1명의 캐릭터를 추가해주세요.',
            icon: <Clock className="w-4 h-4" />
          });
          return;
        }
      }

      if (type === 'episode' && Array.isArray(value)) {
        if (value.length === 0) {
          setFeedback({
            status: 'info',
            message: '에피소드를 추가하면 더 풍부한 영상을 만들 수 있습니다.',
            icon: <Info className="w-4 h-4" />
          });
          return;
        }
      }

      setFeedback({
        status: 'success',
        message: `${type === 'story' ? '스토리' : type === 'character' ? '캐릭터' : type === 'scenario' ? '시나리오' : '에피소드'} 입력이 완료되었습니다.`,
        icon: <CheckCircle className="w-4 h-4" />
      });
    };

    validateInput();
  }, [type, value, required, minLength, maxLength]);

  const getStatusColor = () => {
    switch (feedback.status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${getStatusColor()}`}>
      {feedback.icon}
      <span>{feedback.message}</span>
    </div>
  );
};
