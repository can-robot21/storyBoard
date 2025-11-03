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
  let currentY = margin;

  // 상단 라인 (테이블 상단)
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY - 5, pageWidth - margin, currentY - 5);

  // 헤더 테이블 영역 시작
  const headerTableY = currentY;
  const headerTableHeight = 45; // 헤더 영역 높이
  
  // 헤더 테이블 배경
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, currentY - 5, contentWidth, headerTableHeight, 'F');
  
  // 헤더 테이블 외곽선
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY - 5, contentWidth, headerTableHeight);

  // Pretendard 폰트 로드 (최초 한 번만)
  await loadPretendardFont(pdf);
  
  // 타이틀 (첫 번째 행)
  pdf.setFontSize(18);
  if (pretendardFontLoaded) {
    // Pretendard는 bold 지원이 제한적이므로 normal 사용 후 크기 조정
    pdf.setFont('Pretendard', 'normal');
    pdf.setFontSize(19); // 크기를 약간 키워서 bold 효과
  } else {
    pdf.setFont('helvetica', 'bold');
  }
  if (data.headerData.title) {
    await safeText(pdf, data.headerData.title, margin + 5, currentY + 5);
    currentY += 10;
  }

  // 헤더 정보 테이블 (두 번째 행)
  pdf.setFontSize(11);
  if (pretendardFontLoaded) {
    pdf.setFont('Pretendard', 'normal');
  } else {
    pdf.setFont('helvetica', 'normal');
  }
  
  // 테이블 셀 너비 계산
  const cellCount = 4;
  const cellWidth = contentWidth / cellCount;
  const tableRowY = currentY + 5;
  
  // 테이블 라인 (세로선)
  for (let i = 0; i <= cellCount; i++) {
    const lineX = margin + (i * cellWidth);
    pdf.line(lineX, headerTableY - 5, lineX, headerTableY - 5 + headerTableHeight);
  }
  
  // 헤더 정보 셀별 배치
  let cellX = margin;
  if (data.headerData.date) {
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
      pdf.setFontSize(11.5); // 약간 크게
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    await safeText(pdf, '날짜:', cellX + 2, tableRowY);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    await safeText(pdf, data.headerData.date, cellX + 15, tableRowY);
  }
  cellX += cellWidth;
  
  if (data.headerData.time) {
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    await safeText(pdf, '시간:', cellX + 2, tableRowY);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    await safeText(pdf, data.headerData.time, cellX + 15, tableRowY);
  }
  cellX += cellWidth;
  
  if (data.headerData.location) {
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    await safeText(pdf, '장소:', cellX + 2, tableRowY);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    await safeText(pdf, data.headerData.location, cellX + 15, tableRowY);
  }
  cellX += cellWidth;
  
  if (data.headerData.scene) {
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    await safeText(pdf, '씬:', cellX + 2, tableRowY);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    await safeText(pdf, data.headerData.scene, cellX + 15, tableRowY);
  }
  
  currentY = headerTableY + headerTableHeight - 10;
  
  // 테이블 하단 라인
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // 주요 내용 영역 (세 번째 행)
  if (data.headerData.mainContent) {
    pdf.setFontSize(11);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'bold');
    }
    await safeText(pdf, '주요 내용:', margin + 5, currentY);
    currentY += 6;
    
    pdf.setFontSize(10);
    if (pretendardFontLoaded) {
      pdf.setFont('Pretendard', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    // 텍스트 줄바꿈 처리 (한글 지원)
    try {
      const mainContentLines = pdf.splitTextToSize(data.headerData.mainContent, contentWidth - 10);
      for (let i = 0; i < mainContentLines.length; i++) {
        await safeText(pdf, mainContentLines[i], margin + 5, currentY + i * 5);
      }
      currentY += mainContentLines.length * 5 + 5;
    } catch (error) {
      // splitTextToSize 실패 시 일반 텍스트 출력
      await safeText(pdf, data.headerData.mainContent, margin + 5, currentY);
      currentY += 8;
    }
  }

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

        // 이미지와 텍스트 (1:2 비율)
        const imageWidth = contentWidth / 3;
        const imageHeight = 50;
        const textWidth = (contentWidth * 2) / 3;
        
        // 페이지 용량 체크
        if (currentY + imageHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }

        // 이미지 (왼쪽 1/3)
        if (cut.imagePreview) {
          try {
            const imageData = await loadImage(cut.imagePreview);
            if (imageData) {
              pdf.addImage(imageData, 'JPEG', margin, currentY, imageWidth, imageHeight);
            }
          } catch (error) {
            console.error('이미지 추가 실패:', error);
          }
        }

        // 텍스트 (오른쪽 2/3)
        if (cut.description) {
          pdf.setFontSize(10);
          if (pretendardFontLoaded) {
            pdf.setFont('Pretendard', 'normal');
          } else {
            pdf.setFont('helvetica', 'normal');
          }
          const textX = margin + imageWidth + 5;
          try {
            const textLines = pdf.splitTextToSize(cut.description, textWidth - 5);
            for (let i = 0; i < textLines.length; i++) {
              await safeText(pdf, textLines[i], textX, currentY + 5 + i * 5);
            }
          } catch (error) {
            // 한글 처리 실패 시 일반 출력
            await safeText(pdf, cut.description, textX, currentY + 5);
          }
        }

        currentY += imageHeight + 8;
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
  if (data.imageBoardItems) {
    const itemsPerPage = 9;
    const gridCols = 3;
    const gridRows = 3;
    const itemSpacing = 4;
    
    // 이미지 그리드가 들어갈 공간 계산 (하단 주요내용 영역 제외)
    const mainContentHeight = data.headerData.mainContent ? 30 : 0; // 주요내용 예상 높이
    const gridAreaHeight = pageHeight - currentY - mainContentHeight - 20; // 하단 여백 포함
    const gridStartY = currentY;
    
    const itemHeight = (gridAreaHeight - (gridRows - 1) * itemSpacing) / gridRows - 15; // 설명 공간 제외
    const itemWidth = (contentWidth - (gridCols - 1) * itemSpacing) / gridCols;

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
        
        const newGridAreaHeight = pageHeight - currentY - mainContentHeight - 20;
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
    
    // 주요내용 (가장 하단) - 모든 페이지 하단에 출력
    if (data.headerData.mainContent) {
      const mainContentY = pageHeight - 25; // 하단에서 25mm 위
      
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.8);
      pdf.line(margin, mainContentY - 5, pageWidth - margin, mainContentY - 5);
      
      const mainContentLabelFontSize = 11;
      pdf.setFontSize(mainContentLabelFontSize);
      setSafeFont(pdf, 'bold', mainContentLabelFontSize);
      await safeText(pdf, '주요내용:', margin + 5, mainContentY);
      
      const mainContentFontSize = 10;
      pdf.setFontSize(mainContentFontSize);
      setSafeFont(pdf, 'normal', mainContentFontSize);
      try {
        const mainContentLines = pdf.splitTextToSize(data.headerData.mainContent, contentWidth - 10);
        for (let j = 0; j < Math.min(mainContentLines.length, 3); j++) { // 최대 3줄
          await safeText(pdf, mainContentLines[j], margin + 5, mainContentY + 5 + j * 5);
        }
      } catch (error) {
        await safeText(pdf, data.headerData.mainContent.substring(0, 50) + '...', margin + 5, mainContentY + 5);
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
