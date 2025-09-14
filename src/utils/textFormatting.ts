/**
 * 텍스트 포맷팅 유틸리티 함수들
 */

/**
 * 텍스트를 포맷팅하여 줄바꿈과 정렬을 개선합니다.
 * @param text 원본 텍스트
 * @returns 포맷팅된 텍스트
 */
export const formatText = (text: string): string => {
  if (!text) return '';
  
  return text
    // 연속된 공백을 하나로 정리
    .replace(/\s+/g, ' ')
    // 문장 끝에 줄바꿈 추가
    .replace(/\.\s+/g, '.\n\n')
    // 문단 구분을 위한 이중 줄바꿈 정리
    .replace(/\n{3,}/g, '\n\n')
    // 앞뒤 공백 제거
    .trim();
};

/**
 * 텍스트를 HTML로 변환하여 줄바꿈을 <br> 태그로 처리합니다.
 * @param text 원본 텍스트
 * @returns HTML 문자열
 */
export const formatTextToHTML = (text: string): string => {
  if (!text) return '';
  
  return formatText(text)
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
};

/**
 * 텍스트의 줄 길이를 제한하여 가독성을 개선합니다.
 * @param text 원본 텍스트
 * @param maxLength 최대 줄 길이 (기본값: 80)
 * @returns 포맷팅된 텍스트
 */
export const wrapText = (text: string, maxLength: number = 80): string => {
  if (!text) return '';
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
};

/**
 * 텍스트를 카드 형태로 포맷팅합니다.
 * @param text 원본 텍스트
 * @param title 제목 (선택사항)
 * @returns 포맷팅된 카드 텍스트
 */
export const formatCardText = (text: string, title?: string): string => {
  if (!text) return '';
  
  let formatted = formatText(text);
  
  if (title) {
    formatted = `【${title}】\n\n${formatted}`;
  }
  
  return formatted;
};

/**
 * JSON 데이터를 읽기 쉬운 형태로 포맷팅합니다.
 * @param data JSON 데이터
 * @returns 포맷팅된 문자열
 */
export const formatJSONData = (data: any): string => {
  if (!data) return '';
  
  try {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

/**
 * 텍스트를 섹션별로 나누어 포맷팅합니다.
 * @param text 원본 텍스트
 * @param sections 섹션 구분자 배열
 * @returns 섹션별로 나뉜 텍스트
 */
export const formatSections = (text: string, sections: string[]): string => {
  if (!text) return '';
  
  let formatted = text;
  
  sections.forEach((section, index) => {
    const regex = new RegExp(`(${section})`, 'gi');
    formatted = formatted.replace(regex, `\n\n## ${section}\n`);
  });
  
  return formatted.trim();
};

/**
 * 텍스트에 들여쓰기를 추가합니다.
 * @param text 원본 텍스트
 * @param indentLevel 들여쓰기 레벨 (기본값: 1)
 * @returns 들여쓰기가 적용된 텍스트
 */
export const addIndent = (text: string, indentLevel: number = 1): string => {
  if (!text) return '';
  
  const indent = '  '.repeat(indentLevel);
  return text
    .split('\n')
    .map(line => line.trim() ? `${indent}${line}` : line)
    .join('\n');
};
