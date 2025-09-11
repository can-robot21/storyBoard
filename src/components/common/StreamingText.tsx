import React, { useState, useEffect } from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming,
  className = ""
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isStreaming && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20); // 20ms마다 한 글자씩 표시

      return () => clearTimeout(timer);
    } else if (!isStreaming) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
    }
  }, [text, isStreaming, currentIndex]);

  useEffect(() => {
    if (text !== displayedText) {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [text, displayedText]);

  return (
    <div className={`${className}`}>
      <pre className="whitespace-pre-wrap text-sm text-gray-800">
        {displayedText}
        {isStreaming && <span className="animate-pulse">|</span>}
      </pre>
    </div>
  );
};

export default StreamingText;
