import React from 'react';
import { formatText, formatTextToHTML } from '../../utils/textFormatting';

interface FormattedTextProps {
  text: string;
  className?: string;
  asHTML?: boolean;
  maxLength?: number;
  title?: string;
}

/**
 * 포맷팅된 텍스트를 표시하는 컴포넌트
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = "text-gray-700",
  asHTML = false,
  maxLength,
  title
}) => {
  if (!text) return null;

  const formattedText = formatText(text);
  
  if (asHTML) {
    const htmlContent = formatTextToHTML(formattedText);
    return (
      <div 
        className={`${className} whitespace-pre-wrap leading-relaxed`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <div className={`${className} whitespace-pre-wrap leading-relaxed`}>
      {formattedText}
    </div>
  );
};

/**
 * 카드 형태의 포맷팅된 텍스트 컴포넌트
 */
export const FormattedCardText: React.FC<FormattedTextProps> = ({
  text,
  className = "text-gray-700",
  title
}) => {
  if (!text) return null;

  const formattedText = title ? `【${title}】\n\n${formatText(text)}` : formatText(text);

  return (
    <div className={`${className} whitespace-pre-wrap leading-relaxed`}>
      {formattedText}
    </div>
  );
};

/**
 * JSON 데이터를 포맷팅하여 표시하는 컴포넌트
 */
export const FormattedJSON: React.FC<{
  data: any;
  className?: string;
}> = ({ data, className = "text-gray-700" }) => {
  if (!data) return null;

  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return (
      <div className={`${className} whitespace-pre-wrap leading-relaxed font-mono text-sm`}>
        {jsonString}
      </div>
    );
  } catch {
    return (
      <div className={`${className} whitespace-pre-wrap leading-relaxed`}>
        {String(data)}
      </div>
    );
  }
};

/**
 * 섹션별로 나뉜 포맷팅된 텍스트 컴포넌트
 */
export const FormattedSectionText: React.FC<{
  text: string;
  sections: string[];
  className?: string;
}> = ({ text, sections, className = "text-gray-700" }) => {
  if (!text) return null;

  let formatted = text;
  sections.forEach((section) => {
    const regex = new RegExp(`(${section})`, 'gi');
    formatted = formatted.replace(regex, `\n\n## ${section}\n`);
  });

  return (
    <div className={`${className} whitespace-pre-wrap leading-relaxed`}>
      {formatted.trim()}
    </div>
  );
};
