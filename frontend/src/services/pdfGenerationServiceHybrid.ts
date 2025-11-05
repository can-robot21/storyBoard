/**
 * 하이브리드 PDF 생성 서비스
 * HTML/CSS 렌더링 결과를 html2canvas로 캡처 후 jsPDF로 PDF 변환
 * 한글 폰트 문제 해결 및 레이아웃 정확도 향상
 * 
 * 주요 기능:
 * - 헤더 정보를 모든 페이지에 공통 출력
 * - 본문 이미지를 페이지네이션 기준으로 분할
 * - 상하단 여백 최적화 및 반응형 적용
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PDFGenerationData } from './pdfGenerationService';

/**
 * StoryBoard HTML 생성 (헤더 + 본문 분리)
 */
const generateStoryBoardHeaderHTML = (data: PDFGenerationData): string => {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <style>
        @font-face {
          font-family: 'Pretendard';
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.woff2') format('woff2');
        }
        
        @page {
          size: 210mm 280mm; /* 4A 기준 4:3 비율 */
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          width: 180mm; /* 4A 너비(210mm) - 좌우 여백(30mm) */
          margin: 0 auto;
          padding: 0;
          padding-top: 0; /* 상단 여백 제거 (5mm → 0mm) */
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
          font-size: 10pt;
          color: #000;
          background: #fff;
          position: relative;
          min-height: 260mm; /* availablePageHeight (하단 여백 10mm 줄임) */
          padding-bottom: 10mm; /* footer 공간 확보 (하단 여백 5mm + footer 높이 5mm) */
        }
        
        /* 타이틀 (테이블 밖 상단 중앙) */
        .header-title {
          text-align: center;
          font-size: 22pt;
          font-weight: 700;
          margin-top: 0; /* 상단 여백 제거 */
          margin-bottom: 4mm; /* 반으로 (8mm → 4mm) */
          padding: 0; /* 패딩 제거 */
        }
        
        /* 헤더 요약 (2줄 구성) */
        .header-summary {
          width: 100%;
          background: #f5f5f5;
          border: 1px solid #646464;
          padding: 4mm;
          margin-bottom: 3mm;
        }
        
        .header-line {
          display: flex;
          align-items: center;
          font-size: 9pt;
          line-height: 1.6;
          margin-bottom: 1mm;
        }
        
        .header-line:last-child {
          margin-bottom: 0;
        }
        
        .header-line-1 {
          font-size: 9pt;
          justify-content: space-between; /* 좌우 균형 배치 */
          padding: 0 2mm; /* 좌우 여백 추가 */
        }
        
        .header-line-2 {
          font-size: 9pt;
          color: #333;
          justify-content: flex-start; /* 왼쪽 정렬 (첫 번째 필드 위치와 동일) */
          padding-left: 2mm; /* 첫 번째 줄과 동일한 시작 위치 */
        }
        
        .header-info-item {
          margin-right: 8mm;
          display: inline-block;
          text-align: center;
          flex: 0 0 auto; /* 크기 고정 */
        }
        
        .header-info-item:last-child {
          margin-right: 0;
        }
        
        .header-info-label {
          font-weight: bold;
          margin-right: 2mm;
        }
        
        .header-main-content {
          display: inline-block;
          text-decoration: underline;
          max-width: calc(100% - 30mm);
          line-height: 1.4;
          word-wrap: break-word;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
    </head>
    <body>
      ${data.headerData.title ? `
      <div class="header-title">${escapeHtml(data.headerData.title)}</div>
      ` : ''}
      <div class="header-summary">
        <!-- 1줄: 날짜, 시간대, 장소, 씬, 컷 -->
        <div class="header-line header-line-1">
          ${data.headerData.date ? `
          <span class="header-info-item">
            <span class="header-info-label">날짜:</span>
            <span>${escapeHtml(data.headerData.date)}</span>
          </span>
          ` : ''}
          ${data.headerData.time ? `
          <span class="header-info-item">
            <span class="header-info-label">시간대:</span>
            <span>${(() => {
              const timeValue = data.headerData.time || '';
              if (timeValue === 'DAY') return '낮 (DAY)';
              if (timeValue === 'NIGHT') return '밤 (NIGHT)';
              if (timeValue === 'DUSK') return '황혼 (DUSK)';
              if (timeValue === 'DAWN') return '새벽 (DAWN)';
              if (timeValue === 'OTHER') return '기타';
              return escapeHtml(timeValue);
            })()}</span>
          </span>
          ` : ''}
          ${data.headerData.location ? `
          <span class="header-info-item">
            <span class="header-info-label">장소:</span>
            <span>${escapeHtml(data.headerData.location)}</span>
          </span>
          ` : ''}
          ${data.headerData.scene ? `
          <span class="header-info-item">
            <span class="header-info-label">씬:</span>
            <span>${escapeHtml(data.headerData.scene)}</span>
          </span>
          ` : ''}
          ${data.headerData.cut ? `
          <span class="header-info-item">
            <span class="header-info-label">컷:</span>
            <span>${escapeHtml(data.headerData.cut)}</span>
          </span>
          ` : ''}
        </div>
        <!-- 2줄: 주요 내용과 입력 내용을 밑줄에 한 줄로 배치 -->
        ${data.headerData.mainContent ? `
        <div class="header-line header-line-2">
          <span class="header-info-label">주요내용:</span>
          <span class="header-main-content">${escapeHtml(data.headerData.mainContent).replace(/\n/g, ' ')}</span>
        </div>
        ` : ''}
      </div>
      <div style="border-top: 0.8mm solid #969696; margin: 2mm 0;"></div>
    </body>
    </html>
  `;
};

/**
 * ImageBoard HTML 생성 (타이틀 + 3x3 그리드 + 주요 내용)
 */
const generateImageBoardHTML = (
  data: PDFGenerationData,
  startIndex: number,
  endIndex: number
): string => {
  const itemsToDisplay = data.imageBoardItems?.slice(startIndex, endIndex) || [];
  
  const gridItemsHTML = itemsToDisplay.map((item, index) => {
    const gridIndex = startIndex + index;
    const row = Math.floor((gridIndex % 9) / 3);
    const col = (gridIndex % 9) % 3;
    
    const imageHTML = item.imagePreview
      ? `<img src="${item.imagePreview}" alt="컷${item.number}" class="grid-image" />`
      : '<div class="grid-image-placeholder">이미지 없음</div>';
    
    const descriptionHTML = item.description
      ? `<div class="grid-description">${escapeHtml(item.description).replace(/\n/g, '<br>')}</div>`
      : '';
    
    return `
      <div class="grid-item">
        <div class="grid-number">컷${item.number}</div>
        ${imageHTML}
        ${descriptionHTML}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <style>
        @font-face {
          font-family: 'Pretendard';
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.woff2') format('woff2');
        }
        
        @page {
          size: 222.75mm 297mm; /* A4 세로 기준 4:3 비율 */
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          width: 192.75mm; /* 페이지 너비(222.75mm) - 좌우 여백(30mm) */
          margin: 0 auto;
          padding: 0;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
          font-size: 10pt;
          color: #000;
          background: #fff;
          position: relative;
          min-height: 287mm; /* 페이지 높이 297mm - 하단 여백 10mm */
        }
        
        /* 타이틀 */
        .title-section {
          text-align: center;
          padding: 10mm 0;
          border-bottom: 0.8mm solid #969696;
          margin-bottom: 8mm;
        }
        
        .title-text {
          font-size: 22pt;
          font-weight: bold;
        }
        
        /* 3x3 그리드 */
        .grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5mm;
          margin-bottom: 6mm; /* 컷 하단과 주요내용 박스 사이 여백 2줄 (약 6mm) */
        }
        
        .grid-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .grid-number {
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        
        .grid-image {
          width: 100%;
          height: auto;
          max-height: 60mm;
          object-fit: cover;
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          margin-bottom: 2mm;
        }
        
        .grid-image-placeholder {
          width: 100%;
          height: 60mm;
          border: 1px dashed #ccc;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          background: #f9f9f9;
          margin-bottom: 2mm;
        }
        
        .grid-description {
          font-size: 8pt;
          line-height: 1.4;
          text-align: center;
          width: 100%;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        /* 주요 내용 - 박스 스타일 */
        .main-content-section {
          margin-top: 0; /* grid-container의 margin-bottom으로 간격 조정 */
          margin-bottom: 15mm; /* 하단 라인과의 여백 15mm */
          padding: 2mm 2.5mm 5mm 2.5mm; /* 박스 내부 여백 (상단 2mm, 하단 5mm로 증가하여 텍스트 descender 공간 확보, 좌우 2.5mm) */
          background-color: #f9f9f9; /* 배경색 */
          border: 1px solid #969696; /* 테두리 */
          border-radius: 2px; /* 둥근 모서리 */
          width: calc(100% - 2px); /* border 너비 고려하여 오른쪽 라인 잘림 방지 */
          max-width: calc(100% - 2px); /* border 너비 고려 */
          display: flex;
          align-items: flex-start; /* 상단 정렬로 변경하여 줄바꿈 허용 */
          flex-wrap: nowrap;
          box-sizing: border-box;
          overflow: visible; /* 텍스트가 잘리지 않도록 변경 */
          min-height: 18mm; /* 최소 높이 증가 (패딩 2mm + 5mm + 텍스트 11mm) */
        }
        
        .main-content-label {
          font-size: 11pt;
          font-weight: bold;
          margin-right: 3mm; /* 라벨과 텍스트 사이 간격 줄임 */
          flex-shrink: 0;
          white-space: nowrap;
        }
        
        .main-content-text {
          font-size: 10pt;
          line-height: 1.6; /* line-height 증가 (1.5 → 1.6)하여 텍스트 간격 확대 */
          white-space: normal; /* 줄바꿈 허용 */
          overflow: visible; /* 텍스트 descender가 잘리지 않도록 변경 */
          word-wrap: break-word; /* 긴 단어 줄바꿈 */
          word-break: break-word; /* 한글/영문 모두 줄바꿈 */
          flex: 1;
          min-width: 0; /* flex 아이템이 줄어들 수 있도록 */
          padding-bottom: 0.5mm; /* 하단 여유 공간 추가 */
        }
        
        /* 워터마크 */
        .watermark {
          position: absolute;
          bottom: 2mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.9em;
          color: #9ca3af; /* gray-400 */
          text-align: center;
          width: 100%;
        }
        
        body {
          position: relative;
        }
      </style>
    </head>
    <body>
      <div class="title-section">
        <div class="title-text">${escapeHtml(data.headerData.title || '타이틀 미입력')}</div>
      </div>
      
      <div class="grid-container">
        ${gridItemsHTML}
      </div>
      
      ${data.headerData.mainContent ? `
      <div class="main-content-section">
        <div class="main-content-label">주요내용:</div>
        <div class="main-content-text">${escapeHtml(data.headerData.mainContent).replace(/\r/g, '').replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}
      <div class="watermark">storyboard.ai.kr</div>
    </body>
    </html>
  `;
};

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * StoryBoard 본문 HTML 생성 (페이지네이션 적용)
 */
const generateStoryBoardBodyHTML = (
  data: PDFGenerationData,
  startIndex: number,
  endIndex: number
): string => {
  // 원래 순서 유지하며 항목들을 처리
  const itemsHTML: string[] = [];
  let currentImageOnlyGroup: NonNullable<typeof data.storyboardCuts> = [];
  
  const cutsToDisplay = data.storyboardCuts?.slice(startIndex, endIndex) || [];
  
  cutsToDisplay.forEach((cut, index) => {
    if (cut.imageOnly) {
      currentImageOnlyGroup.push(cut);
      if (index === cutsToDisplay.length - 1 || !cutsToDisplay[index + 1]?.imageOnly) {
        if (currentImageOnlyGroup.length > 0) {
          const imagesHTML = currentImageOnlyGroup.slice(0, 3).map((item, idx) => 
            item.imagePreview 
              ? `<img src="${item.imagePreview}" alt="이미지만 추가 ${idx + 1}" class="image-only-item" />`
              : ''
          ).join('');
          
          if (imagesHTML) {
            itemsHTML.push(`<div class="image-only-group">${imagesHTML}</div>`);
          }
          currentImageOnlyGroup = [];
        }
      }
    } else {
      if (currentImageOnlyGroup.length > 0) {
        const imagesHTML = currentImageOnlyGroup.slice(0, 3).map((item, idx) => 
          item.imagePreview 
            ? `<img src="${item.imagePreview}" alt="이미지만 추가 ${idx + 1}" class="image-only-item" />`
            : ''
        ).join('');
        
        if (imagesHTML) {
          itemsHTML.push(`<div class="image-only-group">${imagesHTML}</div>`);
        }
        currentImageOnlyGroup = [];
      }
      
      // 컷 번호, 이미지, 텍스트를 가로로 배치
      // 컷 번호가 없어도 동일한 공간 확보 (외곽선 없는 박스)
      const cutNumberHTML = cut.cutNumber 
        ? `<div class="cut-number">${escapeHtml(cut.cutNumber)}</div>` 
        : '<div class="cut-number">&nbsp;</div>'; // 빈 공간 유지
      
      // 이미지와 텍스트 유무에 따라 레이아웃 변경
      const hasImage = !!cut.imagePreview;
      const hasDescription = !!cut.description;
      
      let imageHTML = '';
      let descriptionHTML = '';
      
      if (hasImage && hasDescription) {
        // 이미지와 텍스트 모두 있는 경우: 30% / 70% 비율
        imageHTML = `<div class="cut-image-container">
            <img src="${cut.imagePreview}" alt="${escapeHtml(cut.cutNumber || '이미지')}" class="cut-image" />
          </div>`;
        descriptionHTML = `<div class="cut-description">${escapeHtml(cut.description).replace(/\n/g, '<br>')}</div>`;
      } else if (hasImage && !hasDescription) {
        // 이미지만 있는 경우: 이미지 영역만 표시, 텍스트 영역은 빈 공간
        imageHTML = `<div class="cut-image-container">
            <img src="${cut.imagePreview}" alt="${escapeHtml(cut.cutNumber || '이미지')}" class="cut-image" />
          </div>`;
        descriptionHTML = '<div class="cut-description cut-description-empty"></div>';
      } else if (!hasImage && hasDescription) {
        // 텍스트만 있는 경우: 이미지 영역에 플레이스홀더 표시, 텍스트는 66.67% 영역에 출력 (1:2 비율 유지)
        imageHTML = `<div class="cut-image-container"><div class="cut-image-placeholder">이미지 없음</div></div>`;
        descriptionHTML = `<div class="cut-description">${escapeHtml(cut.description).replace(/\n/g, '<br>')}</div>`;
      } else {
        // 둘 다 없는 경우: 이미지 플레이스홀더만 표시 (1:2 비율 유지)
        imageHTML = `<div class="cut-image-container"><div class="cut-image-placeholder">이미지 없음</div></div>`;
        descriptionHTML = '<div class="cut-description cut-description-empty"></div>';
      }
      
      itemsHTML.push(`
        <div class="cut-item">
          ${cutNumberHTML}
          <div class="cut-content">
            ${imageHTML}
            ${descriptionHTML}
          </div>
        </div>
      `);
    }
  });
  
  if (currentImageOnlyGroup.length > 0) {
    const imagesHTML = currentImageOnlyGroup.slice(0, 3).map((item, idx) => 
      item.imagePreview 
        ? `<img src="${item.imagePreview}" alt="이미지만 추가 ${idx + 1}" class="image-only-item" />`
        : ''
    ).join('');
    
    if (imagesHTML) {
      itemsHTML.push(`<div class="image-only-group">${imagesHTML}</div>`);
    }
  }

  const cutsHTML = itemsHTML.join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <style>
        @font-face {
          font-family: 'Pretendard';
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.woff2') format('woff2');
        }
        
        @page {
          size: 210mm 280mm; /* 4A 기준 4:3 비율 */
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          width: 180mm; /* 4A 너비(210mm) - 좌우 여백(30mm) */
          margin: 0 auto;
          padding: 0;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
          font-size: 10pt;
          color: #000;
          background: #fff;
          position: relative;
          min-height: 260mm; /* availablePageHeight (하단 여백 10mm 줄임) */
          padding-bottom: 10mm; /* footer 공간 확보 (하단 여백 5mm + footer 높이 5mm) */
        }
        
        /* 컷 항목 */
        .storyboard-body {
          padding: 2mm 0;
        }
        
        .cut-item {
          margin-bottom: 4mm;
          page-break-inside: avoid;
          break-inside: avoid;
          min-height: 39mm; /* 컷 높이 일관성 유지 */
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          gap: 0 !important; /* gap 제거하고 margin 사용 */
        }
        
        .cut-number {
          font-size: 10pt;
          font-weight: bold;
          width: 22mm; /* 화면의 w-16 (64px ≈ 16.93mm) + 오른쪽 5mm 여백 추가 */
          flex-shrink: 0;
          padding-top: 1mm;
          margin-right: 1mm !important; /* 컷 번호와 이미지 사이 간격 (30%로 감소: 3mm → 1mm) - html2canvas 호환 */
        }
        
        .cut-content {
          flex: 1;
          display: flex;
          gap: 3mm;
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
        }
        
        .cut-image-container {
          width: 33.33% !important; /* 정확히 1:2 비율 (1/3 = 33.33%) - 강제 적용 */
          flex-shrink: 0 !important;
          flex-grow: 0 !important;
          max-height: 35.6mm;
          overflow: hidden;
          box-sizing: border-box;
          position: relative;
        }
        
        .cut-image {
          width: 100%;
          height: auto;
          max-height: 35.6mm;
          object-fit: cover;
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          display: block;
        }
        
        .cut-image-placeholder {
          width: 100%;
          height: 35.6mm;
          min-height: 35.6mm;
          max-height: 35.6mm;
          border: 1px dashed #ccc;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          background: #f9f9f9;
          box-sizing: border-box;
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .cut-description {
          width: 66.67%; /* 정확히 1:2 비율 (2/3 = 66.67%) */
          font-size: 9pt;
          line-height: 1.4;
          white-space: pre-wrap;
          padding: 2mm;
          max-height: 35.6mm;
          overflow: hidden;
          word-wrap: break-word;
          box-sizing: border-box;
          flex-shrink: 0;
          flex-grow: 0;
        }
        
        /* 페이지 하단 여백과 라인 - 페이지 하단 기준으로 고정 */
        .page-footer {
          position: absolute;
          bottom: 5mm; /* 하단 여백과 동일 (10mm 줄임) */
          left: 0;
          right: 0;
          width: 180mm; /* contentWidth */
          padding-top: 5mm;
          border-top: 0.5mm solid #969696;
          height: 5mm;
        }
        
        /* 워터마크 */
        .watermark {
          position: absolute;
          bottom: 2mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.9em;
          color: #9ca3af; /* gray-400 */
          text-align: center;
          width: 100%;
        }
        
            /* 이미지만 추가 그룹 - 가로 배치 강제 (일반 컷 이미지와 동일한 시작/끝 위치) */
            .image-only-group {
              display: flex !important;
              flex-direction: row !important;
              gap: 3mm !important; /* 이미지 간 간격은 유지 */
              margin-bottom: 4mm;
              page-break-inside: avoid;
              break-inside: avoid;
              /* 일반 컷의 cut-content와 동일한 너비로 제한 */
              margin-left: 23mm !important; /* 컷 번호(22mm) + gap(1mm) = 시작 위치 */
              width: calc(100% - 23mm) !important; /* cut-content와 동일한 너비 */
              max-width: 157mm !important; /* 일반 컷의 cut-content 너비와 동일 */
              align-items: flex-start;
              min-height: 35.6mm; /* 컷 높이 일관성 유지 (일반 컷과 동일) */
              box-sizing: border-box;
            }
            
            /* 이미지만 추가 그룹의 이미지 너비 재계산 (gap 3mm에 맞춤) */
            .image-only-item {
              flex: 1;
              width: calc(33.33% - 2mm) !important; /* gap 3mm 기준으로 조정 (3개 이미지, gap 2개) */
              max-width: calc(33.33% - 2mm) !important;
              height: auto;
              max-height: 35.6mm;
              object-fit: cover;
              border: 1px solid #ddd;
              border-radius: 0.5rem;
            }
      </style>
    </head>
    <body>
      <div class="storyboard-body">
        ${cutsHTML}
      </div>
      <div class="watermark">storyboard.ai.kr</div>
    </body>
    </html>
  `;
};

const compressImage = async (imageData: string, maxWidth: number = 1920, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = imageData;
  });
};

/**
 * 하이브리드 방식 PDF 생성
 */
export const generatePDFBlobHybrid = async (
  data: PDFGenerationData
): Promise<Blob> => {
  console.log('📄 PDF 생성 시작:', {
    format: data.boardFormat,
    imageBoardItems: data.imageBoardItems?.length || 0,
    storyboardCuts: data.storyboardCuts?.length || 0
  });

  // ImageBoard는 하이브리드 방식 사용 (A4 세로 기준 4:3 비율)
  if (data.boardFormat === 'imageBoard') {
    const itemsPerPage = 9;
    const totalItems = data.imageBoardItems?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    
    console.log('📄 ImageBoard PDF 생성 (하이브리드):', {
      totalItems,
      itemsPerPage,
      totalPages,
      pageSize: '222.75mm x 297mm (A4 세로 기준 4:3)'
    });

    // PDF 생성 (A4 세로 기준 4:3 비율)
    const pageWidth = 222.75; // mm
    const pageHeight = 297; // mm (A4 세로 높이)
    const margin = 15; // mm
    const contentWidth = pageWidth - (margin * 2); // 약 192.75mm
    
    const pdf = new jsPDF('portrait', 'mm', [pageWidth, pageHeight] as any);
    
    // 각 페이지 생성
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) {
        pdf.addPage();
      }
      
      const startIndex = pageNum * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      
      if (startIndex < totalItems) {
        const pageHTML = generateImageBoardHTML(data, startIndex, endIndex);
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = `${contentWidth}mm`;
        container.style.height = 'auto';
        container.style.zIndex = '9999';
        container.style.opacity = '1';
        container.style.pointerEvents = 'none';
        container.style.backgroundColor = '#ffffff';
        container.innerHTML = pageHTML;
        document.body.appendChild(container);
        
        // 폰트 로드 대기
        await new Promise<void>((resolve) => {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
              setTimeout(() => resolve(), 200);
            }).catch(() => {
              setTimeout(() => resolve(), 500);
            });
          } else {
            setTimeout(() => resolve(), 500);
          }
        });
        
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve(void 0));
          });
        });
        
        // 이미지 로드 대기 (시간 증가 및 에러 처리 개선)
        const images = container.querySelectorAll('img');
        console.log(`🖼️ 페이지 ${pageNum + 1} 이미지 로드 대기 시작: ${images.length}개`);
        
        let loadedCount = 0;
        let errorCount = 0;
        
        await Promise.all(
          Array.from(images).map((img: HTMLImageElement, idx) => {
            return new Promise<void>((resolve) => {
              // 이미 로드된 이미지 확인
              if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                console.log(`✅ 이미지 ${idx + 1} 이미 로드됨 (${img.naturalWidth}x${img.naturalHeight})`);
                loadedCount++;
                resolve();
                return;
              }
              
              // 새로 로드해야 하는 이미지
              let resolved = false;
              
              const handleLoad = () => {
                if (resolved) return;
                resolved = true;
                loadedCount++;
                console.log(`✅ 이미지 ${idx + 1} 로드 완료 (${img.naturalWidth}x${img.naturalHeight})`);
                resolve();
              };
              
              const handleError = () => {
                if (resolved) return;
                resolved = true;
                errorCount++;
                console.warn(`⚠️ 이미지 ${idx + 1} 로드 실패:`, img.src?.substring(0, 100));
                // 에러가 있어도 계속 진행 (플레이스홀더 표시)
                resolve();
              };
              
              img.addEventListener('load', handleLoad, { once: true });
              img.addEventListener('error', handleError, { once: true });
              
              // 타임아웃을 5초로 증가
              setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  errorCount++;
                  console.warn(`⏱️ 이미지 ${idx + 1} 로드 타임아웃 (5초)`);
                  resolve();
                }
              }, 5000);
              
              // src가 없으면 즉시 에러 처리
              if (!img.src || img.src === '') {
                handleError();
              }
            });
          })
        );
        
        console.log(`📊 이미지 로드 완료: 성공 ${loadedCount}개, 실패 ${errorCount}개`);
        
        // 추가 렌더링 대기 시간
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // HTML을 캔버스로 캡처
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: container.scrollWidth,
          height: container.scrollHeight
        } as any);
        
        document.body.removeChild(container);
        
        // 캔버스를 이미지로 변환하여 PDF에 추가
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height / canvas.width) * contentWidth;
        
        // 페이지 높이에 맞게 조정
        const finalHeight = Math.min(imgHeight, pageHeight - margin * 2);
        
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, finalHeight, undefined, 'FAST');
        
        console.log(`✅ 페이지 ${pageNum + 1}/${totalPages} 생성 완료`);
      }
    }
    
    console.log('✅ ImageBoard PDF 생성 완료');
    return pdf.output('blob');
  }
  
  // StoryBoard는 하이브리드 방식 사용 (4A 기준 4:3 비율)
  const totalCuts = data.storyboardCuts?.length || 0;
  
  console.log('📄 StoryBoard PDF 생성 (하이브리드):', {
    format: data.boardFormat,
    totalCuts,
    pageSize: '210mm x 280mm (4A 기준 4:3)'
  });

  // PDF 생성 (4A 기준 4:3 비율)
  const pageWidth = 210; // mm (4A 너비)
  const pageHeight = 280; // mm (4A 높이, 4:3 비율)
  const topMargin = 10; // mm (상단 여백 5mm 감소: 15mm → 10mm)
  const bottomMargin = 5; // mm (하단 여백, 15mm에서 10mm 줄임)
  const margin = 15; // mm (좌우 여백, PDF 이미지 추가 시 x 좌표용)
  const contentWidth = pageWidth - (margin * 2); // 180mm
  const availablePageHeight = pageHeight - topMargin - bottomMargin; // 260mm (상단 15mm + 하단 5mm 제외)
  
  // 헤더 높이 예상치 (실제로는 더 클 수 있으므로 여유있게 설정)
  const estimatedHeaderHeight = 22; // mm (18mm → 22mm로 증가하여 여유 확보)
  const pageFooterHeight = 15; // mm (13mm → 15mm로 증가하여 여유 확보)
  const availableBodyHeight = availablePageHeight - estimatedHeaderHeight - pageFooterHeight; // 약 213mm
  
  const pdf = new jsPDF('portrait', 'mm', [pageWidth, pageHeight] as any);
  
  // 컷 높이 계산 (일관된 높이 사용)
  const cutImageHeight = 35.6; // mm (기존 50mm의 71.2%, 5% 추가 축소)
  const cutMargin = 4; // mm (컷 간 여백)
  const cutHeight = cutImageHeight + cutMargin; // 약 39.6mm (컷 번호는 가로 배치로 높이에 영향 없음)
  
  // 페이지당 컷 수 (화면 페이지네이션과 동일)
  const itemsPerPage = 5;
  
  // 화면 페이지네이션과 동일한 로직으로 페이지 분할
  // 연속된 이미지만 추가 항목을 1개로 카운트하는 로직 사용
  const getEffectivePageCount = (cuts: typeof data.storyboardCuts): number => {
    if (!cuts) return 0;
    let count = 0;
    let i = 0;
    while (i < cuts.length) {
      if (cuts[i].imageOnly) {
        // 연속된 이미지만 추가 항목들을 찾아서 1개로 카운트
        while (i < cuts.length && cuts[i].imageOnly) {
          i++;
        }
        count++; // 연속된 그룹을 1개로 카운트
      } else {
        count++; // 일반 항목은 1개씩 카운트
        i++;
      }
    }
    return count;
  };
  
  // 화면 페이지네이션과 동일한 로직으로 표시할 컷들 결정
  const getDisplayedCutsForPage = (
    cuts: typeof data.storyboardCuts,
    pageNum: number
  ): { startIndex: number; endIndex: number } => {
    if (!cuts) return { startIndex: 0, endIndex: 0 };
    
    const effectivePageCount = getEffectivePageCount(cuts);
    const totalPages = Math.ceil(effectivePageCount / itemsPerPage);
    
    if (totalPages <= 1) {
      return { startIndex: 0, endIndex: cuts.length };
    }
    
    // 현재 페이지에 표시할 항목들 계산 (화면 페이지네이션과 동일)
    let pageCount = 0;
    let startIdx = -1;
    let endIdx = cuts.length;
    
    const targetStartCount = (pageNum - 1) * itemsPerPage;
    const targetEndCount = pageNum * itemsPerPage;
    
    for (let i = 0; i < cuts.length; i++) {
      if (cuts[i].imageOnly) {
        // 연속된 이미지만 추가 항목들의 시작 인덱스
        const groupStartIdx = i;
        // 연속된 이미지만 추가 항목들 건너뛰기
        while (i < cuts.length && cuts[i].imageOnly) {
          i++;
        }
        i--; // for 루프의 증가를 보정
        const groupEndIdx = i + 1;
        
        // 페이지 카운트 증가
        pageCount++;
        
        // 시작 인덱스 설정
        if (pageCount === targetStartCount + 1 && startIdx === -1) {
          startIdx = groupStartIdx;
        }
        
        // 끝 인덱스 설정
        if (pageCount === targetEndCount) {
          endIdx = groupEndIdx;
          break;
        }
      } else {
        // 일반 항목
        pageCount++;
        
        // 시작 인덱스 설정
        if (pageCount === targetStartCount + 1 && startIdx === -1) {
          startIdx = i;
        }
        
        // 끝 인덱스 설정
        if (pageCount === targetEndCount) {
          endIdx = i + 1;
          break;
        }
      }
    }
    
    if (startIdx === -1) startIdx = 0;
    return { startIndex: startIdx, endIndex: endIdx };
  };
  
  // 전체 페이지 수 계산
  const effectivePageCount = getEffectivePageCount(data.storyboardCuts);
  const totalPages = Math.ceil(effectivePageCount / itemsPerPage) || 1;
  
  // 각 페이지별로 컷 분할 (화면 페이지네이션과 동일)
  const pages: { startIndex: number; endIndex: number }[] = [];
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pageInfo = getDisplayedCutsForPage(data.storyboardCuts, pageNum);
    if (pageInfo.startIndex < pageInfo.endIndex) {
      pages.push(pageInfo);
    }
  }
  
  // 빈 페이지 제거 (startIndex >= endIndex인 경우)
  const validPages = pages.filter(p => p.startIndex < p.endIndex && p.endIndex > 0);
  
  const finalTotalPages = validPages.length || 1;
  
  console.log(`📐 페이지 분할 (화면 페이지네이션과 동일): ${finalTotalPages}페이지, 페이지당 항목: ${itemsPerPage}개`);
  console.log(`📄 페이지 분할: ${totalPages}페이지 (${validPages.map(p => `${p.endIndex - p.startIndex}개 컷`).join(', ')})`);
  
  // pages 배열을 validPages로 교체
  const finalPages = validPages.length > 0 ? validPages : [{ startIndex: 0, endIndex: totalCuts }];
  
  // 각 페이지 생성
  for (let pageNum = 0; pageNum < finalTotalPages; pageNum++) {
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    const { startIndex, endIndex } = finalPages[pageNum] || { startIndex: 0, endIndex: totalCuts };
    
    // 빈 페이지 생성을 방지 (startIndex >= endIndex인 경우 건너뛰기)
    if (startIndex >= endIndex || endIndex <= startIndex) {
      console.warn(`⚠️ 빈 페이지 감지됨 (pageNum: ${pageNum}, startIndex: ${startIndex}, endIndex: ${endIndex}) - 건너뜀`);
      continue;
    }
    
    if (startIndex < totalCuts && endIndex > startIndex) {
      // 헤더 + 본문을 하나의 HTML로 생성
      const headerHTML = generateStoryBoardHeaderHTML(data);
      const bodyHTML = generateStoryBoardBodyHTML(data, startIndex, endIndex);
      const pageHTML = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
          <style>
            @font-face {
              font-family: 'Pretendard';
              font-weight: 400;
              font-style: normal;
              font-display: swap;
              src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.woff2') format('woff2'),
                   url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff/Pretendard-Regular.woff') format('woff');
            }
            
            @page {
              size: 210mm 280mm;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              width: 180mm;
              margin: 0 auto;
              padding: 0;
              padding-top: 0; /* 상단 여백 제거 (5mm → 0mm) */
              font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
              font-size: 10pt;
              color: #000;
              background: #fff;
            }
            
            /* 타이틀 (테이블 밖 상단 중앙) */
            .header-title {
              text-align: center;
              font-size: 22pt;
              font-weight: 700;
              margin-top: 0; /* 상단 여백 제거 */
              margin-bottom: 4mm; /* 반으로 (8mm → 4mm) */
              padding: 0; /* 패딩 제거 */
            }
            
            /* 헤더 요약 스타일 포함 */
            .header-summary {
              width: 100%;
              background: #f5f5f5;
              border: 1px solid #646464;
              padding: 4mm;
              margin-bottom: 3mm;
            }
            
            .header-line {
              display: flex;
              align-items: center;
              font-size: 9pt;
              line-height: 1.6;
              margin-bottom: 1mm;
            }
            
            .header-line:last-child {
              margin-bottom: 0;
            }
            
            .header-line-1 {
              font-size: 9pt;
              justify-content: space-between; /* 좌우 균형 배치 */
              padding: 0 2mm; /* 좌우 여백 추가 */
            }
            
            .header-line-2 {
              font-size: 9pt;
              color: #333;
              justify-content: flex-start; /* 왼쪽 정렬 (첫 번째 필드 위치와 동일) */
              padding-left: 2mm; /* 첫 번째 줄과 동일한 시작 위치 */
            }
            
            .header-info-item {
              margin-right: 8mm;
              display: inline-block;
              text-align: center;
              flex: 0 0 auto; /* 크기 고정 */
            }
            
            .header-info-item:last-child {
              margin-right: 0;
            }
            
            .header-info-label {
              font-weight: bold;
              margin-right: 2mm;
            }
            
            .header-main-content {
              display: inline-block;
              text-decoration: underline;
              max-width: calc(100% - 30mm);
              line-height: 1.4;
              word-wrap: break-word;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            /* 컷 항목 스타일 */
            .storyboard-body {
              padding: 2mm 0;
            }
            
            .cut-item {
              margin-bottom: 4mm;
              page-break-inside: avoid;
              break-inside: avoid;
              min-height: 39mm; /* 컷 높이 일관성 유지 (이미지 35.6mm + 여백) */
              display: flex !important;
              flex-direction: row !important;
              align-items: flex-start !important;
              gap: 0 !important; /* gap 제거하고 margin 사용 */
            }
            
            .cut-number {
              font-size: 10pt;
              font-weight: bold;
              width: 22mm; /* 화면의 w-16 (64px ≈ 16.93mm) + 오른쪽 5mm 여백 추가 */
              flex-shrink: 0;
              padding-top: 1mm;
              margin-right: 1mm !important; /* 컷 번호와 이미지 사이 간격 (30%로 감소: 3mm → 1mm) - html2canvas 호환 */
            }
            
            .cut-content {
              flex: 1;
              display: flex;
              gap: 3mm;
              align-items: flex-start;
              width: 100%;
              box-sizing: border-box;
            }
            
            /* 페이지 하단 여백과 라인 - 페이지 하단 기준으로 고정 */
            .page-footer {
              position: absolute;
              bottom: 5mm; /* 하단 여백과 동일 (10mm 줄임) */
              left: 0;
              right: 0;
              width: 180mm; /* contentWidth */
              padding-top: 5mm;
              border-top: 0.5mm solid #969696;
              height: 5mm;
            }
            
            /* 워터마크 */
            .watermark {
              position: absolute;
              bottom: 2mm;
              left: 50%;
              transform: translateX(-50%);
              font-size: 0.9em;
              color: #9ca3af; /* gray-400 */
              text-align: center;
              width: 100%;
            }
            
            /* body에 position relative 추가 */
            body {
              position: relative;
              min-height: 260mm; /* availablePageHeight (하단 여백 10mm 줄임) */
              padding-bottom: 10mm; /* footer 공간 확보 (하단 여백 5mm + footer 높이 5mm) */
            }
            
            .cut-image-container {
              width: 33.33% !important; /* 정확히 1:2 비율 (1/3 = 33.33%) - 강제 적용 */
              flex-shrink: 0 !important;
              flex-grow: 0 !important;
              max-height: 35.6mm;
              overflow: hidden;
              box-sizing: border-box;
              position: relative;
            }
            
            .cut-image {
              width: 100%;
              height: auto;
              max-height: 35.6mm;
              object-fit: cover;
              border: 1px solid #ddd;
              border-radius: 0.5rem;
              display: block;
            }
            
            .cut-image-placeholder {
              width: 100%;
              height: 35.6mm;
              min-height: 35.6mm;
              max-height: 35.6mm;
              border: 1px dashed #ccc;
              border-radius: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
              background: #f9f9f9;
              box-sizing: border-box;
              flex-shrink: 0;
              overflow: hidden;
            }
            
            .cut-description {
              font-size: 9pt;
              line-height: 1.4;
              white-space: pre-wrap;
              padding: 2mm;
              max-height: 35.6mm;
              overflow: hidden;
              word-wrap: break-word;
              box-sizing: border-box;
            }
            
            .cut-description:not(.cut-description-empty) {
              width: 66.67% !important; /* 정확히 1:2 비율 (2/3 = 66.67%) - 강제 적용 */
              flex-shrink: 0 !important;
              flex-grow: 0 !important;
              display: block !important;
              min-height: 35.6mm; /* 최소 높이 설정으로 텍스트 영역 보장 */
            }
            
            .cut-description-empty {
              width: 66.67% !important; /* 정확히 1:2 비율 유지 - 강제 적용 */
              min-height: 0;
              padding: 0;
              display: block;
              flex-shrink: 0;
            }
            
            /* 이미지만 추가 그룹 - 가로 배치 (일반 컷 이미지와 동일한 시작/끝 위치) */
            .image-only-group {
              display: flex;
              flex-direction: row;
              gap: 3mm; /* 이미지 간 간격은 유지 */
              margin-bottom: 4mm;
              page-break-inside: avoid;
              break-inside: avoid;
              /* 일반 컷의 cut-content와 동일한 너비로 제한 */
              /* 컷 번호(22mm) + gap(1mm) 이후부터 시작하여 cut-content 너비(157mm)만큼만 사용 */
              margin-left: 23mm; /* 컷 번호(22mm) + gap(1mm) = 시작 위치 */
              width: calc(100% - 23mm); /* cut-content와 동일한 너비 (180mm - 23mm = 157mm) */
              max-width: 157mm; /* 일반 컷의 cut-content 너비와 동일 */
              min-height: 35.6mm; /* 일반 컷과 동일한 높이 유지 */
              box-sizing: border-box;
            }
            
            .image-only-item {
              flex: 1;
              width: calc(33.33% - 2mm); /* gap 3mm 기준으로 조정 (3개 이미지, gap 2개) */
              max-width: calc(33.33% - 2mm);
              height: auto;
              max-height: 35.6mm;
              object-fit: cover;
              border: 1px solid #ddd;
              border-radius: 0.5rem;
            }
          </style>
        </head>
        <body>
          ${headerHTML.match(/<body>([\s\S]*)<\/body>/)?.[1] || ''}
          ${bodyHTML.match(/<body>([\s\S]*)<\/body>/)?.[1] || ''}
          <div class="watermark">storyboard.ai.kr</div>
          <div class="page-footer"></div>
        </body>
        </html>
      `;
      
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = `${contentWidth}mm`;
      container.style.height = `${availablePageHeight}mm`; // 고정 높이로 설정 (260mm)
      container.style.minHeight = `${availablePageHeight}mm`;
      container.style.maxHeight = `${availablePageHeight}mm`; // 최대 높이 제한
      container.style.zIndex = '9999';
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      container.style.backgroundColor = '#ffffff';
      container.style.overflow = 'hidden'; // 넘치는 부분 숨김
      container.style.boxSizing = 'border-box'; // 박스 모델 일관성
      container.innerHTML = pageHTML;
      document.body.appendChild(container);
      
      // 폰트 로드 대기
      await new Promise<void>((resolve) => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            setTimeout(() => resolve(), 200);
          }).catch(() => {
            setTimeout(() => resolve(), 500);
          });
        } else {
          setTimeout(() => resolve(), 500);
        }
      });
      
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve(void 0));
        });
      });
      
      // 이미지 로드 대기
      const images = container.querySelectorAll('img');
      console.log(`🖼️ 페이지 ${pageNum + 1} 이미지 로드 대기 시작: ${images.length}개`);
      
      let loadedCount = 0;
      let errorCount = 0;
      
      await Promise.all(
        Array.from(images).map((img: HTMLImageElement, idx) => {
          return new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
              console.log(`✅ 이미지 ${idx + 1} 이미 로드됨`);
              loadedCount++;
              resolve();
              return;
            }
            
            let resolved = false;
            const handleLoad = () => {
              if (resolved) return;
              resolved = true;
              loadedCount++;
              resolve();
            };
            const handleError = () => {
              if (resolved) return;
              resolved = true;
              errorCount++;
              resolve();
            };
            
            img.addEventListener('load', handleLoad, { once: true });
            img.addEventListener('error', handleError, { once: true });
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                errorCount++;
                resolve();
              }
            }, 5000);
            
            if (!img.src || img.src === '') {
              handleError();
            }
          });
        })
      );
      
      console.log(`📊 페이지 ${pageNum + 1} 이미지 로드 완료: 성공 ${loadedCount}개, 실패 ${errorCount}개`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // HTML을 캔버스로 캡처 (일관성을 위해 명시적 크기 지정)
      const containerWidth = contentWidth * 3.779527559; // mm를 px로 변환 (1mm = 3.779527559px)
      const containerHeight = availablePageHeight * 3.779527559; // mm를 px로 변환
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: containerWidth,
        height: containerHeight,
        windowWidth: containerWidth,
        windowHeight: containerHeight
      } as any);
      
      document.body.removeChild(container);
      
      // 캔버스를 이미지로 변환하여 PDF에 추가
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = contentWidth;
      
      // 페이지 높이 계산 (헤더 포함)
      const availableHeight = pageHeight - topMargin - bottomMargin; // 상단 여백 + 하단 여백 제외 (260mm)
      const maxPageHeight = availableHeight; // 최대 페이지 높이
      
      // 페이지 높이를 강제로 고정 (5개 컷 강제이므로 항상 동일 높이)
      // 넘치는 부분은 무시하고 빈 페이지 생성하지 않음
      const clampedHeight = maxPageHeight;
      pdf.addImage(imgData, 'JPEG', margin, topMargin, imgWidth, clampedHeight, undefined, 'FAST');
      
      console.log(`✅ 페이지 ${pageNum + 1}/${finalTotalPages} 생성 완료 (높이: ${clampedHeight.toFixed(2)}mm 고정, 화면 페이지네이션과 동일)`);
    }
  }
  
  console.log('✅ StoryBoard PDF 생성 완료');
  return pdf.output('blob');
};

/**
 * 이미지 압축 및 텍스트 저장
 */
export const saveCompressedImagesAndText = async (
  data: PDFGenerationData
): Promise<{ images: string[]; text: string }> => {
  const compressedImages: string[] = [];
  const textParts: string[] = [];
  
  // 헤더 정보
  textParts.push(`타이틀: ${data.headerData.title || ''}`);
  textParts.push(`날짜: ${data.headerData.date || ''}`);
  textParts.push(`시간: ${data.headerData.time || ''}`);
  textParts.push(`장소: ${data.headerData.location || ''}`);
  textParts.push(`씬: ${data.headerData.scene || ''}`);
  textParts.push(`주요 내용: ${data.headerData.mainContent || ''}`);
  textParts.push('');
  
  if (data.boardFormat === 'storyBoard' && data.storyboardCuts) {
    for (let index = 0; index < data.storyboardCuts.length; index++) {
      const cut = data.storyboardCuts[index];
      textParts.push(`컷 ${index + 1}: ${cut.cutNumber || ''}`);
      textParts.push(`설명: ${cut.description || ''}`);
      textParts.push('');
      
      if (cut.imagePreview) {
        const compressed = await compressImage(cut.imagePreview);
        compressedImages.push(compressed);
      }
    }
  } else if (data.boardFormat === 'imageBoard' && data.imageBoardItems) {
    for (let index = 0; index < data.imageBoardItems.length; index++) {
      const item = data.imageBoardItems[index];
      textParts.push(`항목 ${item.number}: ${item.description || ''}`);
      textParts.push('');
      
      if (item.imagePreview) {
        const compressed = await compressImage(item.imagePreview);
        compressedImages.push(compressed);
      }
    }
  }
  
  return {
    images: compressedImages,
    text: textParts.join('\n')
  };
};
