import jsPDF from 'jspdf';

// Pretendard 폰트를 위한 변수
let pretendardFontLoaded = false;

/**
 * Pretendard 폰트를 로드하고 jsPDF에 추가
 * 폰트 파일은 public/fonts/Pretendard-Regular.ttf 경로에 위치해야 합니다
 */
/**
 * Pretendard 폰트를 로드하고 jsPDF에 추가
 * TTF 파일은 GitHub 릴리스에서 직접 다운로드
 */
const loadPretendardFont = async (pdf: jsPDF): Promise<boolean> => {
  if (pretendardFontLoaded) {
    return true;
  }

  try {
    console.log('🔤 Pretendard 폰트 로드 시작...');
    
    // 1순위: public 폴더에서 로드 시도
    let fontData: string | null = null;
    const localFontUrl = '/fonts/Pretendard-Regular.ttf';
    
    try {
      const response = await fetch(localFontUrl);
      if (response.ok) {
        const fontBlob = await response.blob();
        fontData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1] || base64;
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(fontBlob);
        });
        console.log('✅ 로컬 Pretendard 폰트 로드 성공');
      }
    } catch (error) {
      console.warn('⚠️ 로컬 폰트 로드 실패, GitHub 릴리스에서 다운로드 시도:', error);
      
      // 2순위: GitHub 릴리스에서 TTF 파일 다운로드
      try {
        // Pretendard v1.3.9 TTF 파일 (GitHub 릴리스)
        const ttfUrl = 'https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip';
        
        // 직접 TTF 파일 다운로드 (unpkg 또는 jsDelivr에서 제공하는 경우)
        // 실제로는 TTF 파일이 별도로 제공되지 않으므로, 다른 방법 사용
        
        // 대안: jsPDF의 한글 지원 플러그인 또는 다른 방법
        // 또는 폰트를 Base64로 인라인 임베드
        
        // GitHub Raw에서 직접 TTF 파일 다운로드 시도
        const rawTtfUrl = 'https://raw.githubusercontent.com/orioncactus/pretendard/main/packages/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2';
        
        // TTF 파일을 직접 찾을 수 없으므로, 사용자에게 안내
        console.warn('⚠️ TTF 파일을 직접 다운로드할 수 없습니다.');
        console.warn('📥 Pretendard TTF 파일을 수동으로 다운로드하여 public/fonts/ 폴더에 저장해주세요.');
        console.warn('🔗 다운로드: https://github.com/orioncactus/pretendard/releases');
        
      } catch (cdnError) {
        console.warn('❌ CDN에서 폰트 로드 실패:', cdnError);
      }
    }

    if (fontData) {
      // jsPDF에 폰트 추가
      try {
        // VFS에 폰트 파일 추가
        pdf.addFileToVFS('Pretendard-Regular.ttf', fontData);
        // 폰트 등록
        pdf.addFont('Pretendard-Regular.ttf', 'Pretendard', 'normal');
        pretendardFontLoaded = true;
        console.log('✅ Pretendard 폰트 jsPDF에 추가 성공');
        return true;
      } catch (fontError) {
        console.error('❌ Pretendard 폰트 jsPDF 추가 실패:', fontError);
        console.warn('기본 폰트를 사용합니다. 한글이 깨질 수 있습니다.');
        return false;
      }
    } else {
      console.error('⚠️ Pretendard 폰트 파일을 찾을 수 없습니다.');
      console.error('📁 폰트 파일 경로: public/fonts/Pretendard-Regular.ttf');
      console.error('💡 해결 방법:');
      console.error('   1. https://github.com/orioncactus/pretendard/releases 에서 TTF 파일 다운로드');
      console.error('   2. public/fonts/ 폴더에 Pretendard-Regular.ttf 파일 저장');
      console.error('   3. 애플리케이션 재시작');
      return false;
    }
  } catch (error) {
    console.error('❌ Pretendard 폰트 로드 오류:', error);
    return false;
  }
};

/**
 * 한글 텍스트를 안전하게 출력하는 헬퍼 함수
 * Pretendard 폰트가 있으면 사용, 없으면 기본 폰트 사용
 */
const safeText = async (pdf: jsPDF, text: string, x: number, y: number, options?: any): Promise<void> => {
  try {
    // Pretendard 폰트 로드 시도
    const fontLoaded = await loadPretendardFont(pdf);
    
    // 폰트가 실제로 로드되었는지 확인
    if (fontLoaded && pretendardFontLoaded) {
      try {
        // 폰트 목록 확인 (디버깅용)
        const fontList = pdf.getFontList();
        const hasPretendard = 'Pretendard' in fontList;
        
        if (hasPretendard) {
          pdf.setFont('Pretendard', 'normal');
        } else {
          throw new Error('Pretendard 폰트가 폰트 목록에 없습니다.');
        }
      } catch (fontError) {
        // Pretendard 폰트 설정 실패 시 기본 폰트 사용
        console.warn('Pretendard 폰트 설정 실패, 기본 폰트 사용:', fontError);
        pretendardFontLoaded = false; // 플래그 리셋
        pdf.setFont('helvetica', 'normal');
      }
    } else {
      // Pretendard 폰트가 없으면 기본 폰트 사용
      pdf.setFont('helvetica', 'normal');
    }
    
    // UTF-8 인코딩된 텍스트 출력
    pdf.text(text, x, y, { ...options, encoding: 'UTF8' });
  } catch (error) {
    // 폰트 문제로 실패 시 기본 폰트로 재시도
    console.warn('텍스트 출력 실패, 기본 폰트로 재시도:', error);
    try {
      // 에러 발생 시 항상 기본 폰트로 폴백
      pdf.setFont('helvetica', 'normal');
      pdf.text(text, x, y, { ...options, encoding: 'UTF8' });
    } catch (fallbackError) {
      console.error('텍스트 출력 최종 실패:', fallbackError);
      // 최후의 수단: 빈 텍스트라도 위치는 유지
      try {
        pdf.text('', x, y, options || {});
      } catch {
        // 무시
      }
    }
  }
};

/**
 * 안전한 폰트 설정 함수 (Pretendard는 'bold' 스타일 미지원)
 * @param pdf jsPDF 인스턴스
 * @param style 폰트 스타일 ('normal' 또는 'bold')
 * @param currentFontSize 현재 폰트 크기 (bold 효과를 위한 크기 조정용)
 * @returns bold 효과를 적용한 경우 새로운 폰트 크기, 그렇지 않으면 현재 크기
 */
/**
 * 이미지 플레이스홀더 그리기 함수
 */
const drawImagePlaceholder = async (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  pretendardFontLoaded: boolean
): Promise<void> => {
  // 배경색 설정
  pdf.setFillColor(249, 249, 249); // #f9f9f9
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.rect(x, y, width, height, 'FD'); // Fill and Draw
  
  // "이미지 없음" 텍스트
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  if (pretendardFontLoaded) {
    pdf.setFont('Pretendard', 'normal');
  } else {
    pdf.setFont('helvetica', 'normal');
  }
  const placeholderText = '이미지 없음';
  const textWidth = pdf.getTextWidth(placeholderText);
  await safeText(pdf, placeholderText, x + (width - textWidth) / 2, y + height / 2);
  pdf.setTextColor(0, 0, 0);
};

const setSafeFont = (pdf: jsPDF, style: 'normal' | 'bold' = 'normal', currentFontSize?: number): number => {
  if (pretendardFontLoaded) {
    // Pretendard는 'bold' 스타일이 없으므로 항상 'normal' 사용
    pdf.setFont('Pretendard', 'normal');
    // bold 효과를 위해 폰트 크기를 약간 키울 수 있음
    if (style === 'bold' && currentFontSize !== undefined) {
      pdf.setFontSize(currentFontSize + 0.5);
      return currentFontSize + 0.5;
    }
    return currentFontSize || 10; // 기본값 반환
  } else {
    pdf.setFont('helvetica', style);
    return currentFontSize || 10;
  }
};

export interface PDFGenerationData {
  headerData: {
    title: string;
    date: string;
    time: string;
    location: string;
    scene: string;
    cut: string;
    mainContent: string;
  };
  boardFormat: 'storyBoard' | 'imageBoard';
  storyboardCuts?: Array<{
    id: string;
    cutNumber: string;
    imagePreview: string | null;
    description: string;
    imageOnly?: boolean;
  }>;
  imageBoardItems?: Array<{
    id: string;
    number: number;
    imagePreview: string | null;
    description: string;
    imageOnly?: boolean;
  }>;
}

/**
 * 이미지 URL/Base64를 jsPDF에 추가할 수 있는 형식으로 변환
 */
const loadImage = async (imageSrc: string | null): Promise<string | null> => {
  if (!imageSrc) return null;
  
  try {
    // Base64인 경우
    if (imageSrc.startsWith('data:image')) {
      return imageSrc;
    }
    // URL인 경우 Base64로 변환
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('이미지 로드 실패:', error);
    return null;
  }
};

/**
 * StoryBoard PDF 생성
 */
export const generateStoryBoardPDF = async (
  data: PDFGenerationData,
  pageNumber: number = 1
): Promise<Blob> => {
  // A4 사이즈 정확히 설정: 210mm x 297mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  
  const pageWidth = 210; // A4 너비 (mm)
  const pageHeight = 297; // A4 높이 (mm)
  const margin = 20; // 여백 증가 (15mm → 20mm)
  const contentWidth = pageWidth - margin * 2; // 170mm
  let currentY = 0; // 상단 여백 제거 (5mm → 0mm)

  // Pretendard 폰트 로드 (최초 한 번만)
  await loadPretendardFont(pdf);
  
  // 타이틀 (테이블 밖 상단 중앙)
  if (data.headerData.title) {
    pdf.setFontSize(22);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'bold');
      pdf.setFontSize(24); // 크기를 키워서 더 두껍게
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
    }
    // 중앙 정렬을 위해 텍스트 너비 계산
    try {
      const titleWidth = pdf.getTextWidth(data.headerData.title);
      const titleX = (pageWidth - titleWidth) / 2;
      await safeText(pdf, data.headerData.title, titleX, currentY);
    } catch (error) {
      // 에러 발생 시 중앙 정렬 없이 출력
      await safeText(pdf, data.headerData.title, margin + 5, currentY);
    }
    currentY += 9; // 여백 반으로 (18mm → 9mm)
  }

  // 헤더 테이블 영역 시작
  const headerTableY = currentY;
  const headerTableHeight = 20; // 헤더 영역 높이 (2줄)
  
  // 헤더 테이블 배경
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, headerTableY, contentWidth, headerTableHeight, 'F');
  
  // 헤더 테이블 외곽선
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, headerTableY, contentWidth, headerTableHeight);

  // 첫 번째 줄: 나머지 필드들 (날짜, 시간대, 장소, 씬, 컷) - 중앙 정렬
  pdf.setFontSize(10);
  if (pretendardFontLoaded) {
    pdf.setFont('Pretendard', 'normal');
  } else {
    pdf.setFont('helvetica', 'normal');
  }
  
  const firstRowY = headerTableY + 6;
  const fieldSpacing = 25; // 필드 간 간격
  
  // 필드 정보 수집
  interface FieldInfo {
    label: string;
    value: string;
    labelWidth: number;
    valueWidth: number;
    totalWidth: number;
  }
  
  const fields: FieldInfo[] = [];
  
  // 날짜
  if (data.headerData.date) {
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    const labelWidth = pdf.getTextWidth('날짜:');
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const valueWidth = pdf.getTextWidth(data.headerData.date);
    fields.push({
      label: '날짜:',
      value: data.headerData.date,
      labelWidth,
      valueWidth,
      totalWidth: labelWidth + valueWidth + 12
    });
  }
  
  // 시간대
  if (data.headerData.time) {
    const timeLabel = data.headerData.time === 'DAY' ? '낮 (DAY)' : 
                     data.headerData.time === 'NIGHT' ? '밤 (NIGHT)' :
                     data.headerData.time === 'DUSK' ? '황혼 (DUSK)' :
                     data.headerData.time === 'DAWN' ? '새벽 (DAWN)' :
                     data.headerData.time === 'OTHER' ? '기타' : data.headerData.time;
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    const labelWidth = pdf.getTextWidth('시간대:');
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const valueWidth = pdf.getTextWidth(timeLabel);
    fields.push({
      label: '시간대:',
      value: timeLabel,
      labelWidth,
      valueWidth,
      totalWidth: labelWidth + valueWidth + 15
    });
  }
  
  // 장소
  if (data.headerData.location) {
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    const labelWidth = pdf.getTextWidth('장소:');
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const valueWidth = pdf.getTextWidth(data.headerData.location);
    fields.push({
      label: '장소:',
      value: data.headerData.location,
      labelWidth,
      valueWidth,
      totalWidth: labelWidth + valueWidth + 12
    });
  }
  
  // 씬
  if (data.headerData.scene) {
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    const labelWidth = pdf.getTextWidth('씬:');
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const valueWidth = pdf.getTextWidth(data.headerData.scene);
    fields.push({
      label: '씬:',
      value: data.headerData.scene,
      labelWidth,
      valueWidth,
      totalWidth: labelWidth + valueWidth + 10
    });
  }
  
  // 컷
  if (data.headerData.cut) {
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    const labelWidth = pdf.getTextWidth('컷:');
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const valueWidth = pdf.getTextWidth(data.headerData.cut);
    fields.push({
      label: '컷:',
      value: data.headerData.cut,
      labelWidth,
      valueWidth,
      totalWidth: labelWidth + valueWidth + 10
    });
  }
  
  // 전체 필드 너비 계산
  const totalFieldsWidth = fields.reduce((sum, field) => sum + field.totalWidth, 0);
  
  // 좌우 균형 배치: 첫 번째 필드는 왼쪽에서 시작, 마지막 필드는 오른쪽에서 끝
  const firstFieldStartX = margin + 2; // 첫 번째 필드 시작 위치 (2mm 여백)
  const lastFieldEndX = pageWidth - margin - 2; // 마지막 필드 끝 위치
  const lastFieldStartX = lastFieldEndX - fields[fields.length - 1].totalWidth;
  
  // 필드 간 균등 간격 계산 (space-between 효과)
  let adjustedSpacing = 0;
  if (fields.length > 1) {
    const usedWidth = totalFieldsWidth;
    const availableWidth = lastFieldStartX - firstFieldStartX;
    adjustedSpacing = (availableWidth - usedWidth) / (fields.length - 1);
  }
  
  let currentX = firstFieldStartX;
  
  // 필드들 그리기
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    
    // 라벨
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    await safeText(pdf, field.label, currentX, firstRowY);
    
    // 값
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const valueX = currentX + field.labelWidth + (field.label === '시간대:' ? 15 : 12);
    await safeText(pdf, field.value, valueX, firstRowY);
    
    // 다음 필드 위치 (조정된 간격 사용)
    currentX += field.totalWidth + adjustedSpacing;
  }
  
  // 첫 번째 필드의 시작 위치 저장 (두 번째 줄에서 사용)
  const firstFieldStartX_saved = firstFieldStartX;
  
  // 두 번째 줄: 주요내용과 입력 내용을 밑줄에 한 줄로 배치 - 첫 번째 필드와 동일한 시작 위치
  const secondRowY = headerTableY + 16;
  if (data.headerData.mainContent) {
    // 라벨 너비 계산
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    const labelText = '주요내용:';
    const labelWidth = pdf.getTextWidth(labelText);
    
    // 내용 텍스트 너비 계산 (한 줄로 표시 가능한 부분만)
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const maxContentWidth = contentWidth - labelWidth - 20; // 여백 고려
    let contentText = '';
    try {
      const contentLines = pdf.splitTextToSize(data.headerData.mainContent, maxContentWidth);
      contentText = contentLines[0] || data.headerData.mainContent.substring(0, 50);
    } catch (error) {
      contentText = data.headerData.mainContent.substring(0, 50);
    }
    const contentWidth_actual = pdf.getTextWidth(contentText);
    
    // 첫 번째 필드와 동일한 시작 위치 사용
    const secondRowStartX = firstFieldStartX_saved;
    
    // 라벨 그리기
    pdf.setFontSize(10.5);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    await safeText(pdf, labelText, secondRowStartX, secondRowY);
    
    // 내용 텍스트 (밑줄과 함께)
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const contentX = secondRowStartX + labelWidth + 15;
    await safeText(pdf, contentText, contentX, secondRowY);
    
    // 밑줄 그리기
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(contentX, secondRowY + 1.5, contentX + contentWidth_actual, secondRowY + 1.5);
  }
  
  currentY = headerTableY + headerTableHeight + 5;
  
  // 테이블 하단 라인
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // 본문 구별 라인 (상단 영역과 본문 사이)
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.8);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 12; // 본문 시작 여백

  // 컷별 내용
  if (data.storyboardCuts) {
    // 연속된 이미지만 추가 항목을 그룹화
    let imageOnlyGroup: typeof data.storyboardCuts = [];
    
    for (let i = 0; i < data.storyboardCuts.length; i++) {
      const cut = data.storyboardCuts[i];
      
      // 페이지 용량 체크
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = margin;
      }

      if (cut.imageOnly) {
        // 이미지만 추가 항목: 그룹에 추가
        imageOnlyGroup.push(cut);
        
        // 다음 항목이 이미지만 추가가 아니거나 마지막이면 그룹 렌더링
        if (i === data.storyboardCuts.length - 1 || !data.storyboardCuts[i + 1]?.imageOnly) {
          // 가로로 3개씩 배치
          const imageWidth = (contentWidth - 10) / 3; // 3개 이미지, 간격 5mm
          const imageHeight = 40; // 이미지 높이
          let imageX = margin;
          
          for (let j = 0; j < Math.min(imageOnlyGroup.length, 3); j++) {
            const imageCut = imageOnlyGroup[j];
            
            if (imageCut.imagePreview) {
              try {
                const imageData = await loadImage(imageCut.imagePreview);
                if (imageData) {
                  pdf.addImage(imageData, 'JPEG', imageX, currentY, imageWidth, imageHeight);
                }
              } catch (error) {
                console.error('이미지 추가 실패:', error);
              }
            }
            
            imageX += imageWidth + 5;
          }
          
          currentY += imageHeight + 5;
          imageOnlyGroup = [];
        }
      } else {
        // 먼저 이미지만 추가 그룹이 있다면 렌더링
        if (imageOnlyGroup.length > 0) {
          const imageWidth = (contentWidth - 10) / 3;
          const imageHeight = 40;
          let imageX = margin;
          
          for (let j = 0; j < Math.min(imageOnlyGroup.length, 3); j++) {
            const imageCut = imageOnlyGroup[j];
            if (imageCut.imagePreview) {
              try {
                const imageData = await loadImage(imageCut.imagePreview);
                if (imageData) {
                  pdf.addImage(imageData, 'JPEG', imageX, currentY, imageWidth, imageHeight);
                }
              } catch (error) {
                console.error('이미지 추가 실패:', error);
              }
            }
            imageX += imageWidth + 5;
          }
          currentY += imageHeight + 5;
          imageOnlyGroup = [];
        }
        
        // 일반 항목 렌더링
        // 컷 번호
        if (cut.cutNumber) {
          pdf.setFontSize(11);
          if (pretendardFontLoaded) {
            pdf.setFont('Pretendard', 'normal');
          } else {
            pdf.setFont('helvetica', 'bold');
          }
          await safeText(pdf, cut.cutNumber, margin, currentY);
          currentY += 6;
        }

        // 이미지와 텍스트 (1:2 비율 - 정확히 33.33%:66.67%)
        const imageWidth = contentWidth / 3; // 정확히 1/3 = 33.33%
        const imageHeight = 50;
        const textWidth = (contentWidth * 2) / 3; // 정확히 2/3 = 66.67%
        const hasImage = !!cut.imagePreview;
        const hasDescription = !!cut.description;
        
        // 페이지 용량 체크
        if (currentY + imageHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }

        // 이미지 영역 (왼쪽 1/3) - 항상 표시 (1:2 비율 유지)
        if (hasImage) {
          try {
            const imageData = await loadImage(cut.imagePreview);
            if (imageData) {
              pdf.addImage(imageData, 'JPEG', margin, currentY, imageWidth, imageHeight);
            } else {
              // 이미지 로드 실패 시 플레이스홀더 표시
              drawImagePlaceholder(pdf, margin, currentY, imageWidth, imageHeight, pretendardFontLoaded);
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('이미지 추가 실패:', error);
            }
            // 이미지 로드 실패 시 플레이스홀더 표시
            drawImagePlaceholder(pdf, margin, currentY, imageWidth, imageHeight, pretendardFontLoaded);
          }
        } else {
          // 이미지가 없을 경우: 이미지 영역에 플레이스홀더 표시 (1:2 비율 유지)
          drawImagePlaceholder(pdf, margin, currentY, imageWidth, imageHeight, pretendardFontLoaded);
        }

        // 텍스트 영역 (오른쪽 2/3) - 항상 표시 (1:2 비율 유지)
        const textX = margin + imageWidth + 5;
        if (hasDescription) {
          pdf.setFontSize(10);
          if (pretendardFontLoaded) {
            pdf.setFont('Pretendard', 'normal');
          } else {
            pdf.setFont('helvetica', 'normal');
          }
          try {
            const textLines = pdf.splitTextToSize(cut.description, textWidth - 5);
            for (let i = 0; i < textLines.length; i++) {
              await safeText(pdf, textLines[i], textX, currentY + 5 + i * 5);
            }
            // 텍스트 높이에 따라 currentY 조정
            const textHeight = textLines.length * 5;
            currentY += Math.max(imageHeight, textHeight) + 8;
          } catch (error) {
            // 한글 처리 실패 시 일반 출력
            await safeText(pdf, cut.description, textX, currentY + 5);
            currentY += imageHeight + 8;
          }
        } else {
          // 텍스트가 없는 경우: 빈 텍스트 영역 유지 (1:2 비율 유지)
          currentY += imageHeight + 8;
        }
      }
    }
    
    // 남은 이미지만 추가 그룹 처리
    if (imageOnlyGroup.length > 0) {
      const imageWidth = (contentWidth - 10) / 3;
      const imageHeight = 40;
      let imageX = margin;
      
      for (let j = 0; j < Math.min(imageOnlyGroup.length, 3); j++) {
        const imageCut = imageOnlyGroup[j];
        if (imageCut.imagePreview) {
          try {
            const imageData = await loadImage(imageCut.imagePreview);
            if (imageData) {
              pdf.addImage(imageData, 'JPEG', imageX, currentY, imageWidth, imageHeight);
            }
          } catch (error) {
            console.error('이미지 추가 실패:', error);
          }
        }
        imageX += imageWidth + 5;
      }
    }
  }

  // 페이지 번호 및 워터마크 추가
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    await safeText(
      pdf,
      `페이지 ${i} / ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
    
    // 워터마크 추가 (하단 중앙)
    const watermarkText = 'storyboard.ai.kr';
    pdf.setFontSize(7.2); // 본문 90% (8pt * 0.9)
    pdf.setTextColor(128, 128, 128); // 회색 (gray-400)
    const watermarkWidth = pdf.getTextWidth(watermarkText);
    const watermarkX = (pageWidth - watermarkWidth) / 2; // 중앙 정렬
    await safeText(
      pdf,
      watermarkText,
      watermarkX,
      pageHeight - 8,
      { align: 'left' }
    );
    pdf.setTextColor(0, 0, 0); // 색상 초기화
  }

  return pdf.output('blob');
};

/**
 * ImageBoard PDF 생성 (3x3 그리드, 4A 기준 4:3 비율)
 */
export const generateImageBoardPDF = async (
  data: PDFGenerationData,
  pageNumber: number = 1
): Promise<Blob> => {
  // 4A 기준 4:3 비율 (작은축 210mm 기준: 210mm x 280mm)
  const pageWidth = 210; // 작은축 (mm)
  const pageHeight = 280; // 4:3 비율 (210 * 4/3 = 280mm)
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight], // 커스텀 사이즈
    compress: true
  });
  
  const margin = 15; // 여백
  const contentWidth = pageWidth - margin * 2; // 약 192.75mm
  let currentY = margin;

  // Pretendard 폰트 로드 (최초 한 번만)
  const fontLoaded = await loadPretendardFont(pdf);
  console.log('🔤 Pretendard 폰트 로드 결과:', fontLoaded ? '✅ 성공' : '⚠️ 실패 (기본 폰트 사용)');

  // 타이틀 (상단) - 매 페이지 상단에 출력
  const titleY = currentY;
  const titleHeight = 15; // 타이틀 영역 높이

  // 타이틀 (상단 중앙)
  const titleFontSize = 22;
  pdf.setFontSize(titleFontSize);
  setSafeFont(pdf, 'bold', titleFontSize);
  if (data.headerData.title) {
    // 중앙 정렬을 위해 텍스트 너비 계산
    try {
      const titleWidth = pdf.getTextWidth(data.headerData.title);
      const titleX = (pageWidth - titleWidth) / 2;
      await safeText(pdf, data.headerData.title, titleX, titleY + 10);
    } catch (error) {
      // 에러 발생 시 중앙 정렬 없이 출력
      console.warn('타이틀 중앙 정렬 실패:', error);
      await safeText(pdf, data.headerData.title, margin + 5, titleY + 10);
    }
  }
  
  currentY = titleY + titleHeight + 8; // 타이틀 아래 여백

  // 타이틀 하단 라인
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.8);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8; // 본문 시작 여백

  // 3x3 그리드 레이아웃 (중간 영역)
  // 그리드 변수들을 스코프 밖에서 선언 (주요내용 출력에서도 사용)
  let itemsPerPage = 9;
  let gridCols = 3;
  let gridRows = 3;
  let itemSpacing = 4;
  let gridStartY = currentY;
  let itemHeight = 0;
  let itemWidth = 0;
  let bottomLineMargin = 15; // 주요내용 박스 하단과 하단 라인 사이 여백 15mm
  let mainContentBoxHeight = data.headerData.mainContent ? 18.5 : 0; // 주요내용 박스 높이 (패딩 2mm + 5mm + 텍스트 2줄 11.5mm = 18.5mm)
  let mainContentBoxMargin = 6; // 컷 하단과 주요내용 박스 사이 여백 (2줄 가량)
  
  if (data.imageBoardItems) {
    itemsPerPage = 9;
    gridCols = 3;
    gridRows = 3;
    itemSpacing = 4;
    
    // 이미지 그리드가 들어갈 공간 계산 (컷 하단과 주요내용 박스 사이 6mm + 박스 높이 + 하단 라인 여백 15mm)
    mainContentBoxMargin = 6; // 컷 하단과 주요내용 박스 사이 여백 (2줄 가량)
    mainContentBoxHeight = data.headerData.mainContent ? 18.5 : 0; // 주요내용 박스 높이 (패딩 2mm + 5mm + 텍스트 2줄 11.5mm = 18.5mm)
    bottomLineMargin = 15; // 주요내용 박스 하단과 하단 라인 사이 여백 15mm
    const gridAreaHeight = pageHeight - currentY - mainContentBoxMargin - mainContentBoxHeight - bottomLineMargin - 20; // 하단 여백 포함
    gridStartY = currentY;
    
    itemHeight = (gridAreaHeight - (gridRows - 1) * itemSpacing) / gridRows - 15; // 설명 공간 제외
    itemWidth = (contentWidth - (gridCols - 1) * itemSpacing) / gridCols;

    for (let i = 0; i < data.imageBoardItems.length; i++) {
      const item = data.imageBoardItems[i];
      const pageIndex = Math.floor(i / itemsPerPage);
      
      if (pageIndex > 0 && i % itemsPerPage === 0) {
        pdf.addPage();
        // 새 페이지에 상단 정보 재출력
        const newHeaderTableY = margin;
        const newHeaderTableHeight = 35;
        
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, newHeaderTableY, contentWidth, newHeaderTableHeight, 'F');
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.3);
        pdf.rect(margin, newHeaderTableY, contentWidth, newHeaderTableHeight);
        
        // 헤더 정보 다시 출력 (위의 헤더 생성 코드와 동일)
        const newBaseFontSize = 10;
        pdf.setFontSize(newBaseFontSize);
        setSafeFont(pdf, 'normal', newBaseFontSize);
        
        const newCellWidth = contentWidth / 2;
        const newTableRowY = newHeaderTableY + 8;
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.2);
        for (let j = 0; j <= 2; j++) {
          const lineX = margin + (j * newCellWidth);
          pdf.line(lineX, newHeaderTableY, lineX, newHeaderTableY + newHeaderTableHeight);
        }
        pdf.line(margin, newHeaderTableY, margin + contentWidth, newHeaderTableY);
        pdf.line(margin, newHeaderTableY + newHeaderTableHeight, margin + contentWidth, newHeaderTableY + newHeaderTableHeight);
        
        let newCellX = margin;
        let newCellRow = 0;
        const newRowHeight = 12;
        
        if (data.headerData.time) {
          const boldFontSize = setSafeFont(pdf, 'bold', newBaseFontSize);
          pdf.setFontSize(boldFontSize);
          await safeText(pdf, '시간:', newCellX + 2, newTableRowY + newCellRow * newRowHeight);
          pdf.setFontSize(newBaseFontSize);
          setSafeFont(pdf, 'normal', newBaseFontSize);
          await safeText(pdf, data.headerData.time, newCellX + 20, newTableRowY + newCellRow * newRowHeight);
          newCellRow++;
        }
        
        if (data.headerData.scene) {
          if (newCellX === margin) {
            if (newCellRow >= 2) {
              newCellX += newCellWidth;
              newCellRow = 0;
            }
          }
          const boldFontSize = setSafeFont(pdf, 'bold', newBaseFontSize);
          pdf.setFontSize(boldFontSize);
          await safeText(pdf, '씬:', newCellX + 2, newTableRowY + newCellRow * newRowHeight);
          pdf.setFontSize(newBaseFontSize);
          setSafeFont(pdf, 'normal', newBaseFontSize);
          await safeText(pdf, data.headerData.scene, newCellX + 20, newTableRowY + newCellRow * newRowHeight);
          newCellRow++;
        }
        
        // 타이틀 재출력
        const newTitleFontSize = 20;
        pdf.setFontSize(newTitleFontSize);
        setSafeFont(pdf, 'bold', newTitleFontSize);
        if (data.headerData.title) {
          try {
            const titleWidth = pdf.getTextWidth(data.headerData.title);
            const titleX = (pageWidth - titleWidth) / 2;
            await safeText(pdf, data.headerData.title, titleX, newHeaderTableY + newHeaderTableHeight + 13);
          } catch (error) {
            await safeText(pdf, data.headerData.title, margin + 5, newHeaderTableY + newHeaderTableHeight + 13);
          }
        }
        
        currentY = newHeaderTableY + newHeaderTableHeight + 23;
        const newGridStartY = currentY;
        pdf.setDrawColor(150, 150, 150);
        pdf.setLineWidth(0.8);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;
        
        // 이미지 그리드가 들어갈 공간 계산 (컷 하단과 주요내용 박스 사이 6mm + 박스 높이 + 하단 라인 여백 15mm)
        const newGridAreaHeight = pageHeight - currentY - mainContentBoxMargin - mainContentBoxHeight - bottomLineMargin - 20;
        const newItemHeight = (newGridAreaHeight - (gridRows - 1) * itemSpacing) / gridRows - 15;
        const newItemWidth = (contentWidth - (gridCols - 1) * itemSpacing) / gridCols;
        
        // 그리드 인덱스 재계산
        const newGridIndex = i % itemsPerPage;
        const newRow = Math.floor(newGridIndex / gridCols);
        const newCol = newGridIndex % gridCols;
        
        const newItemX = margin + newCol * (newItemWidth + itemSpacing);
        const newItemY = newGridStartY + 8 + newRow * (newItemHeight + 15 + itemSpacing);

        // 이미지
        if (!item.imageOnly && item.imagePreview) {
          try {
            console.log(`📷 새 페이지 이미지 로드 시도: 컷${item.number}`, item.imagePreview?.substring(0, 50));
            const imageData = await loadImage(item.imagePreview);
            if (imageData) {
              console.log(`✅ 새 페이지 이미지 로드 성공: 컷${item.number}`, imageData.substring(0, 50));
              pdf.addImage(imageData, 'JPEG', newItemX, newItemY, newItemWidth, newItemHeight * 0.75);
              console.log(`✅ 새 페이지 이미지 PDF 추가 완료: 컷${item.number}`);
            } else {
              console.warn(`⚠️ 새 페이지 이미지 데이터 없음: 컷${item.number}`);
            }
          } catch (error) {
            console.error(`❌ 새 페이지 이미지 추가 실패: 컷${item.number}`, error);
          }
        }

        // 번호
        const cutNumberFontSize = 9;
        pdf.setFontSize(cutNumberFontSize);
        setSafeFont(pdf, 'normal', cutNumberFontSize);
        await safeText(pdf, `컷${item.number}`, newItemX, newItemY - 2);

        // 설명
        if (!item.imageOnly && item.description) {
          const descFontSize = 8;
          pdf.setFontSize(descFontSize);
          setSafeFont(pdf, 'normal', descFontSize);
          try {
            const descLines = pdf.splitTextToSize(item.description, newItemWidth - 2);
            for (let j = 0; j < descLines.length; j++) {
              await safeText(pdf, descLines[j], newItemX, newItemY + newItemHeight * 0.75 + 3 + j * 4);
            }
          } catch (error) {
            await safeText(pdf, item.description, newItemX, newItemY + newItemHeight * 0.75 + 3);
          }
        }

        continue;
      }

      const gridIndex = i % itemsPerPage;
      const row = Math.floor(gridIndex / gridCols);
      const col = gridIndex % gridCols;
      
      const itemX = margin + col * (itemWidth + itemSpacing);
      const itemY = gridStartY + 8 + row * (itemHeight + 15 + itemSpacing);

      // 이미지
      if (!item.imageOnly && item.imagePreview) {
        try {
          console.log(`📷 이미지 로드 시도: 컷${item.number}`, item.imagePreview?.substring(0, 50));
          const imageData = await loadImage(item.imagePreview);
          if (imageData) {
            console.log(`✅ 이미지 로드 성공: 컷${item.number}`, imageData.substring(0, 50));
            pdf.addImage(imageData, 'JPEG', itemX, itemY, itemWidth, itemHeight * 0.75);
            console.log(`✅ 이미지 PDF 추가 완료: 컷${item.number}`);
          } else {
            console.warn(`⚠️ 이미지 데이터 없음: 컷${item.number}`);
          }
        } catch (error) {
          console.error(`❌ 이미지 추가 실패: 컷${item.number}`, error);
        }
      } else if (item.imageOnly) {
        console.log(`⏭️ 이미지만 추가 항목 건너뜀: 컷${item.number}`);
      } else {
        console.log(`⚠️ 이미지 미첨부 항목: 컷${item.number}`);
      }

      // 번호
      const itemCutNumberFontSize = 9;
      pdf.setFontSize(itemCutNumberFontSize);
      setSafeFont(pdf, 'normal', itemCutNumberFontSize);
      await safeText(pdf, `컷${item.number}`, itemX, itemY - 2);

      // 설명 (이미지 하단)
      if (!item.imageOnly && item.description) {
        const itemDescFontSize = 8;
        pdf.setFontSize(itemDescFontSize);
        setSafeFont(pdf, 'normal', itemDescFontSize);
        try {
          const descLines = pdf.splitTextToSize(item.description, itemWidth - 2);
          for (let j = 0; j < descLines.length; j++) {
            await safeText(pdf, descLines[j], itemX, itemY + itemHeight * 0.75 + 3 + j * 4);
          }
        } catch (error) {
          await safeText(pdf, item.description, itemX, itemY + itemHeight * 0.75 + 3);
        }
      }
    }
  }

  // 페이지 번호 및 주요내용 추가 (모든 페이지)
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // 페이지 번호
    const pageNumberFontSize = 8;
    pdf.setFontSize(pageNumberFontSize);
    setSafeFont(pdf, 'normal', pageNumberFontSize);
    await safeText(
      pdf,
      `페이지 ${i} / ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
    
    // 워터마크 추가 (하단 중앙, 페이지 번호 아래)
    const watermarkText = 'storyboard.ai.kr';
    pdf.setFontSize(7.2); // 본문 90% (8pt * 0.9)
    pdf.setTextColor(128, 128, 128); // 회색 (gray-400)
    setSafeFont(pdf, 'normal', 7.2);
    const watermarkWidth = pdf.getTextWidth(watermarkText);
    const watermarkX = (pageWidth - watermarkWidth) / 2; // 중앙 정렬
    await safeText(
      pdf,
      watermarkText,
      watermarkX,
      pageHeight - 6,
      { align: 'left' }
    );
    pdf.setTextColor(0, 0, 0); // 색상 초기화
    
    // 주요내용 (컷 하단에서 3mm 지점) - 줄바꿈 포함
    if (data.headerData.mainContent && data.imageBoardItems && itemHeight > 0) {
      // 각 페이지의 그리드 시작 위치 계산 (첫 페이지는 이미 계산됨, 다른 페이지는 헤더 위치 기준)
      let pageGridStartY = gridStartY;
      if (i > 1) {
        // 다른 페이지는 헤더 위치를 기준으로 계산
        // 헤더 높이: margin + 35 (헤더 테이블) + titleHeight + 여백
        const headerHeight = margin + 35 + titleHeight + 8 + 8; // 헤더 + 타이틀 + 여백
        // 이미지 그리드가 들어갈 공간 계산 (컷 하단과 주요내용 박스 사이 6mm + 박스 높이 + 하단 라인 여백 15mm)
        const gridAreaHeight = pageHeight - headerHeight - mainContentBoxMargin - mainContentBoxHeight - bottomLineMargin - 20;
        const calculatedItemHeight = (gridAreaHeight - (gridRows - 1) * itemSpacing) / gridRows - 15;
        // 실제 그리드가 시작되는 위치 (헤더 아래)
        pageGridStartY = headerHeight;
      }
      
      // 컷 하단 위치 계산 (마지막 행의 마지막 항목 하단)
      const lastRow = 2; // 0-based, 마지막 행
      const lastItemY = pageGridStartY + 8 + lastRow * (itemHeight + 15 + itemSpacing);
      const lastItemBottom = lastItemY + itemHeight * 0.75 + 15; // 이미지 높이 + 설명 공간
      const mainContentBoxTop = lastItemBottom + 6; // 컷 하단에서 6mm 아래 (2줄 가량의 공간)
      
      // 주요내용 박스 높이 계산 (줄바꿈 고려, 텍스트 descender 공간 확보)
      const boxPaddingTop = 2; // 상단 패딩 (여백 줄여 텍스트 공간 확대)
      const boxPaddingBottom = 5; // 하단 패딩 증가 (텍스트 descender 공간 확보)
      const boxPadding = boxPaddingTop; // 텍스트 위치 계산용
      const lineHeight = 4.5; // 줄 간격 (10pt 폰트 기준 약 4.5mm)
      const maxLines = 2; // 최대 줄 수 (박스 높이에 맞춰 2줄)
      const textDescenderSpace = 1.5; // 텍스트 descender 공간 (하강부 여유 공간)
      const textHeight = lineHeight * maxLines + textDescenderSpace; // 텍스트 영역 높이 (2줄 + descender 공간)
      const boxHeight = boxPaddingTop + boxPaddingBottom + textHeight; // 패딩 + 텍스트 높이
      const mainContentBoxBottom = mainContentBoxTop + boxHeight;
      
      // 하단 라인 그리기 (주요내용 박스 하단에서 15mm 아래)
      const lineY = mainContentBoxBottom + 15; // 하단 라인과 박스 사이 여백 15mm
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.8);
      pdf.line(margin, lineY, pageWidth - margin, lineY);
      
      // 주요내용 박스 배경 그리기
      pdf.setFillColor(249, 249, 249); // #f9f9f9
      pdf.setDrawColor(150, 150, 150); // #969696
      pdf.setLineWidth(0.3);
      // border 너비 고려하여 오른쪽 라인 잘림 방지
      const boxWidth = contentWidth - 0.3; // border 두께(0.3mm) 고려
      pdf.roundedRect(margin, mainContentBoxTop - boxPaddingTop, boxWidth, boxHeight, 1, 1, 'FD'); // Fill and Draw (boxPaddingTop 사용)
      
      const mainContentLabelFontSize = 11;
      pdf.setFontSize(mainContentLabelFontSize);
      setSafeFont(pdf, 'bold', mainContentLabelFontSize);
      const labelText = '주요내용:';
      const labelX = margin + 2.5; // 좌측 여백 최소화 (2.5mm)
      const mainContentTextY = mainContentBoxTop + boxPadding - 1; // 박스 상단에서 패딩 아래 (상단 여백 조정: -1mm)
      await safeText(pdf, labelText, labelX, mainContentTextY);
      
      // 라벨 너비 계산
      const labelWidth = pdf.getTextWidth(labelText);
      const contentStartX = labelX + labelWidth + 3; // 라벨과 내용 사이 간격 (3mm)
      // 우측 여백 최소화하여 텍스트 공간 확대
      const maxContentWidth = pageWidth - margin - contentStartX - 2.5; // 사용 가능한 너비 (우측 패딩 2.5mm)
      
      const mainContentFontSize = 10;
      pdf.setFontSize(mainContentFontSize);
      setSafeFont(pdf, 'normal', mainContentFontSize);
      
      // 줄바꿈 허용하여 표시
      const mainContentText = data.headerData.mainContent.replace(/\r/g, ''); // \r만 제거, \n은 유지
      
      try {
        // 텍스트를 박스 너비에 맞춰 여러 줄로 분할
        const contentLines = pdf.splitTextToSize(mainContentText, maxContentWidth);
        const lineHeight = 4.5; // 줄 간격 (10pt 폰트 기준 약 4.5mm)
        const maxLines = Math.min(contentLines.length, 2); // 최대 2줄까지 표시
        
        // 박스 내부에 맞춰 줄바꿈하여 표시
        let currentY = mainContentTextY;
        const textDescenderSpace = 1.5; // 텍스트 descender 공간
        for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
          // 하단 패딩과 descender 공간을 고려하여 텍스트가 가려지지 않도록 확인
          if (currentY + lineHeight + textDescenderSpace > mainContentBoxBottom - boxPaddingBottom) {
            // 박스 높이를 초과하면 중단
            break;
          }
          await safeText(pdf, contentLines[lineIndex], contentStartX, currentY);
          currentY += lineHeight;
        }
        
        // 2줄을 초과하는 경우 마지막 줄에 ... 표시
        if (contentLines.length > maxLines && maxLines > 0) {
          const lastLine = contentLines[maxLines - 1];
          let truncatedLastLine = lastLine;
          const ellipsisWidth = pdf.getTextWidth('...');
          while (pdf.getTextWidth(truncatedLastLine + '...') > maxContentWidth && truncatedLastLine.length > 0) {
            truncatedLastLine = truncatedLastLine.substring(0, truncatedLastLine.length - 1);
          }
          // 마지막 줄을 덮어쓰기
          await safeText(pdf, truncatedLastLine + '...', contentStartX, currentY - lineHeight);
        }
      } catch (error) {
        // 에러 발생 시 원본 텍스트를 한 줄로 표시
        const fallbackText = mainContentText.replace(/\n/g, ' ').substring(0, 50) + (mainContentText.length > 50 ? '...' : '');
        await safeText(pdf, fallbackText, contentStartX, mainContentTextY);
      }
    }
  }

  return pdf.output('blob');
};

/**
 * PDF 생성 및 다운로드
 */
export const generateAndDownloadPDF = async (
  data: PDFGenerationData,
  filename?: string
): Promise<void> => {
  let blob: Blob;
  
  if (data.boardFormat === 'storyBoard') {
    blob = await generateStoryBoardPDF(data);
  } else {
    blob = await generateImageBoardPDF(data);
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `storyboard_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * PDF 생성 (Blob 반환, 다운로드 없음)
 * 하이브리드 방식 사용 (HTML/CSS 렌더링 → PDF 변환)
 */
export const generatePDFBlob = async (
  data: PDFGenerationData
): Promise<Blob> => {
  // 하이브리드 방식 사용 (한글 문제 해결 및 레이아웃 정확도 향상)
  try {
    const { generatePDFBlobHybrid } = await import('./pdfGenerationServiceHybrid');
    return await generatePDFBlobHybrid(data);
  } catch (error) {
    console.warn('하이브리드 PDF 생성 실패, 기본 방식으로 폴백:', error);
    // 폴백: 기존 jsPDF 방식
    if (data.boardFormat === 'storyBoard') {
      return await generateStoryBoardPDF(data);
    } else {
      return await generateImageBoardPDF(data);
    }
  }
};
