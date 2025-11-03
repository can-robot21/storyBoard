import { DetailedSettings, ImageRole, ImageOutputSize, ImageEditingStyle } from '../types/imageGeneration';

// 번역 결과 캐싱을 위한 Map
const translationCache = new Map<string, string>();

// AI 최적화 프롬프트 생성 함수 (복합적 맥락 반영)
export const generateAIOptimizedKoreanPrompt = (
  basePrompt: string,
  imageRoles: ImageRole[],
  selectedOutputSize?: ImageOutputSize,
  selectedEditingStyle?: ImageEditingStyle,
  detailedSettings?: DetailedSettings,
  isDetailedMode?: boolean,
  customSize?: string,
  additionalPrompt?: string
): string => {
  if (!basePrompt || basePrompt.trim().length === 0) {
    return '아름다운 이미지';
  }

  try {
    // 1단계: 기본 프롬프트 분석 및 맥락 파악
    const contextAnalysis = analyzePromptContext(basePrompt);
    
    // 2단계: 첨부 이미지 정보 통합
    const imageContext = generateImageContext(imageRoles);
    
    // 3단계: 설정 정보 통합
    const settingsContext = generateSettingsContext(
      selectedOutputSize,
      selectedEditingStyle,
      detailedSettings,
      isDetailedMode,
      customSize,
      additionalPrompt
    );
    
    // 4단계: 복합적 맥락을 반영한 AI 최적화 프롬프트 생성
    const optimizedPrompt = constructOptimizedKoreanPrompt(
      contextAnalysis,
      imageContext,
      settingsContext
    );
    
    return optimizedPrompt;
  } catch (error) {
    console.error('❌ AI 최적화 프롬프트 생성 오류:', error);
    return basePrompt;
  }
};

// 프롬프트 맥락 분석 함수
const analyzePromptContext = (prompt: string): any => {
  const context = {
    hasCharacter: false,
    hasLocation: false,
    hasAction: false,
    hasCameraAngle: false,
    hasStyle: false,
    characters: [] as string[],
    locations: [] as string[],
    actions: [] as string[],
    cameraAngles: [] as string[],
    styles: [] as string[]
  };

  // 캐릭터 관련 키워드 분석
  const characterKeywords = ['소년', '소녀', '아이', '남자', '여자', '한국', '사람', '로봇', '캐릭터'];
  characterKeywords.forEach(keyword => {
    if (prompt.includes(keyword)) {
      context.hasCharacter = true;
      context.characters.push(keyword);
    }
  });

  // 장소 관련 키워드 분석
  const locationKeywords = ['공원', '잔디밭', '센터', '건물', '놀이터', '한강', '축구장', '배경'];
  locationKeywords.forEach(keyword => {
    if (prompt.includes(keyword)) {
      context.hasLocation = true;
      context.locations.push(keyword);
    }
  });

  // 동작 관련 키워드 분석
  const actionKeywords = ['타고', '올라탄', '놀고', '걸어나오는', '등장하는', '올려다본', '촬영한'];
  actionKeywords.forEach(keyword => {
    if (prompt.includes(keyword)) {
      context.hasAction = true;
      context.actions.push(keyword);
    }
  });

  // 카메라 각도 관련 키워드 분석
  const cameraKeywords = ['하이앵글', '로우앵글', '클로즈업', '와이드샷', '전신', '풋샷'];
  cameraKeywords.forEach(keyword => {
    if (prompt.includes(keyword)) {
      context.hasCameraAngle = true;
      context.cameraAngles.push(keyword);
    }
  });

  // 스타일 관련 키워드 분석
  const styleKeywords = ['고전적인', '현대적인', '판타지', '사실적', '예술적'];
  styleKeywords.forEach(keyword => {
    if (prompt.includes(keyword)) {
      context.hasStyle = true;
      context.styles.push(keyword);
    }
  });

  return context;
};

// 이미지 맥락 생성 함수
const generateImageContext = (imageRoles: ImageRole[]): string => {
  if (!imageRoles || imageRoles.length === 0) {
    return '';
  }

  const roleDescriptions = imageRoles.map(role => {
    const weightText = role.weight > 0.7 ? '강한' : role.weight > 0.4 ? '중간' : '약한';
    return `${role.role} 참조 (${weightText} 가중치)`;
  });

  return `참조 이미지: ${roleDescriptions.join(', ')}`;
};

// 설정 맥락 생성 함수
const generateSettingsContext = (
  selectedOutputSize?: ImageOutputSize,
  selectedEditingStyle?: ImageEditingStyle,
  detailedSettings?: DetailedSettings,
  isDetailedMode?: boolean,
  customSize?: string,
  additionalPrompt?: string
): string => {
  const settings = [];

  // 출력 크기 설정
  if (selectedOutputSize) {
    settings.push(`${selectedOutputSize.ratio} 비율 (${selectedOutputSize.resolution})`);
  }

  // 편집 스타일 설정
  if (selectedEditingStyle) {
    settings.push(`${selectedEditingStyle.name} 스타일`);
  }

  // 상세 설정 - 카메라 설정을 자연어로 변환
  if (isDetailedMode && detailedSettings) {
    if (detailedSettings.camera) {
      const cameraDescription = generateCameraDescription(detailedSettings.camera);
      if (cameraDescription) {
        settings.push(cameraDescription);
      }
    }

    if (detailedSettings.lighting) {
      const lightingDescription = generateLightingDescription(detailedSettings.lighting);
      if (lightingDescription) {
        settings.push(lightingDescription);
      }
    }

    if (detailedSettings.color) {
      const colorDescription = generateColorDescription(detailedSettings.color);
      if (colorDescription) {
        settings.push(colorDescription);
      }
    }
  }

  // 커스텀 크기
  if (customSize) {
    settings.push(`커스텀 크기: ${customSize}`);
  }

  // 추가 프롬프트
  if (additionalPrompt) {
    settings.push(`추가 요구사항: ${additionalPrompt}`);
  }

  return settings.length > 0 ? `설정: ${settings.join(', ')}` : '';
};

// 카메라 설정을 자연어로 변환하는 함수 - 개선된 버전
const generateCameraDescription = (cameraSettings: any): string => {
  const descriptions = [];

  // 카메라 위치와 각도 - 구체적인 서술로 개선
  if (cameraSettings.position && cameraSettings.position !== 'front') {
    const positionMap: { [key: string]: string } = {
      'back': '카메라를 피사체 후면에 위치하여',
      'side': '카메라를 피사체 측면에 위치하여',
      'top': '카메라를 피사체 상단에서 내려다보는 각도로',
      'bottom': '카메라를 피사체 하단에서 올려다보는 각도로'
    };
    descriptions.push(positionMap[cameraSettings.position] || `카메라를 ${cameraSettings.position}에 위치하여`);
  }

  // 카메라 거리와 촬영 거리 - 구체적인 거리 정보 추가
  if (cameraSettings.distance && cameraSettings.distance !== 1) {
    const distanceMap: { [key: number]: string } = {
      1: '클로즈업 샷으로 약 1미터 거리에서',
      2: '클로즈업 샷으로 약 2미터 거리에서',
      3: '미디엄 클로즈업 샷으로 약 3미터 거리에서',
      4: '미디엄 샷으로 약 4미터 거리에서',
      5: '미디엄 샷으로 약 5미터 거리에서',
      6: '미디엄 와이드 샷으로 약 6미터 거리에서',
      7: '와이드 샷으로 약 7미터 거리에서',
      8: '와이드 샷으로 약 8미터 거리에서',
      9: '익스트림 와이드 샷으로 약 9미터 거리에서',
      10: '익스트림 와이드 샷으로 약 10미터 거리에서'
    };
    const shotType = distanceMap[cameraSettings.distance] || '미디엄 샷으로 약 5미터 거리에서';
    descriptions.push(`${shotType} 촬영하여`);
  }

  // 렌즈 타입과 초점거리 - 구체적인 렌즈 정보 추가
  if (cameraSettings.lensType && cameraSettings.lensType !== 'standard') {
    const lensMap: { [key: string]: string } = {
      'wide': '24mm 광각 렌즈를 사용하여 자연스러운 원근감으로',
      'telephoto': '85mm 망원 렌즈를 사용하여 자연스러운 압축감으로',
      'macro': '100mm 매크로 렌즈를 사용하여 세밀한 디테일로'
    };
    descriptions.push(lensMap[cameraSettings.lensType] || `${cameraSettings.lensType} 렌즈를 사용하여`);
  }

  // 카메라 틸트 각도 - 구체적인 각도 정보 추가
  if (cameraSettings.tiltAngle && cameraSettings.tiltAngle !== 0) {
    const angle = Math.abs(cameraSettings.tiltAngle);
    if (cameraSettings.tiltAngle > 0) {
      descriptions.push(`카메라를 약 ${angle}도 위쪽으로 틸트하여 역동적인 구도를 만들고`);
    } else {
      descriptions.push(`카메라를 약 ${angle}도 아래쪽으로 틸트하여 안정적인 구도를 만들고`);
    }
  }

  // 화면 그리드 위치 (화면 이동) - 구체적인 위치 정보 추가
  if (cameraSettings.gridPosition) {
    const { x, y } = cameraSettings.gridPosition;
    if (x !== 0 || y !== 0) {
      const positionDescriptions = [];
      if (x > 0) positionDescriptions.push('오른쪽 삼등분선에');
      if (x < 0) positionDescriptions.push('왼쪽 삼등분선에');
      if (y > 0) positionDescriptions.push('상단 삼등분선에');
      if (y < 0) positionDescriptions.push('하단 삼등분선에');
      
      if (positionDescriptions.length > 0) {
        descriptions.push(`프레임을 ${positionDescriptions.join(' ')} 배치하여 균형잡힌 구도를 만들고`);
      }
    }
  }

  // 카메라 회전 - 구체적인 방향 정보 추가
  if (cameraSettings.rotationX !== 0 || cameraSettings.rotationY !== 0) {
    const rotationDescriptions = [];
    if (cameraSettings.rotationY > 0) rotationDescriptions.push('오른쪽으로 팬하여');
    if (cameraSettings.rotationY < 0) rotationDescriptions.push('왼쪽으로 팬하여');
    if (cameraSettings.rotationX > 0) rotationDescriptions.push('위쪽으로 기울여');
    if (cameraSettings.rotationX < 0) rotationDescriptions.push('아래쪽으로 기울여');
    
    if (rotationDescriptions.length > 0) {
      descriptions.push(`카메라를 ${rotationDescriptions.join(' ')} 자연스러운 시선을 유도하고`);
    }
  }

  // 피사계 심도 - 구체적인 효과 설명 추가
  if (cameraSettings.depthOfField && cameraSettings.depthOfField !== 'medium') {
    const dofMap: { [key: string]: string } = {
      'shallow': '얕은 피사계 심도를 적용하여 배경을 부드럽게 흐리게 하되 세부 디테일은 유지하고',
      'deep': '깊은 피사계 심도를 적용하여 전체를 선명하게 하되 자연스러운 깊이감을 유지하고'
    };
    descriptions.push(dofMap[cameraSettings.depthOfField] || '');
  }

  return descriptions.length > 0 ? descriptions.join(' ') : '';
};

// 조명 설정을 자연어로 변환하는 함수
const generateLightingDescription = (lightingSettings: any): string => {
  const descriptions = [];

  if (lightingSettings.type && lightingSettings.type !== 'natural') {
    const typeMap: { [key: string]: string } = {
      'studio': '스튜디오 조명으로',
      'golden': '골든 아워 조명으로',
      'blue': '블루 아워 조명으로',
      'dramatic': '드라마틱한 조명으로'
    };
    descriptions.push(typeMap[lightingSettings.type] || `${lightingSettings.type} 조명으로`);
  }

  if (lightingSettings.direction && lightingSettings.direction !== 'front') {
    const directionMap: { [key: string]: string } = {
      'back': '후면에서 비추는',
      'side': '측면에서 비추는',
      'top': '상단에서 비추는',
      'bottom': '하단에서 비추는'
    };
    descriptions.push(directionMap[lightingSettings.direction] || `${lightingSettings.direction}에서 비추는`);
  }

  if (lightingSettings.intensity && lightingSettings.intensity !== 'medium') {
    const intensityMap: { [key: string]: string } = {
      'soft': '부드러운',
      'bright': '밝은',
      'dim': '어두운'
    };
    descriptions.push(intensityMap[lightingSettings.intensity] || `${lightingSettings.intensity} 강도의`);
  }

  return descriptions.length > 0 ? `${descriptions.join(' ')} 조명` : '';
};

// 색상 설정을 자연어로 변환하는 함수
const generateColorDescription = (colorSettings: any): string => {
  const descriptions = [];

  if (colorSettings.palette && colorSettings.palette !== 'natural') {
    const paletteMap: { [key: string]: string } = {
      'warm': '따뜻한 톤의',
      'cool': '차가운 톤의',
      'monochrome': '흑백의',
      'vintage': '빈티지 톤의',
      'high_contrast': '고대비의'
    };
    descriptions.push(paletteMap[colorSettings.palette] || `${colorSettings.palette} 팔레트의`);
  }

  if (colorSettings.saturation && colorSettings.saturation !== 'medium') {
    const saturationMap: { [key: string]: string } = {
      'low': '채도가 낮은',
      'high': '채도가 높은',
      'vivid': '선명한 색상의'
    };
    descriptions.push(saturationMap[colorSettings.saturation] || `${colorSettings.saturation} 채도의`);
  }

  if (colorSettings.contrast && colorSettings.contrast !== 'medium') {
    const contrastMap: { [key: string]: string } = {
      'low': '대비가 낮은',
      'high': '대비가 높은',
      'dramatic': '드라마틱한 대비의'
    };
    descriptions.push(contrastMap[colorSettings.contrast] || `${colorSettings.contrast} 대비의`);
  }

  return descriptions.length > 0 ? `${descriptions.join(' ')} 색상` : '';
};

// 최적화된 한국어 프롬프트 구성 함수 - 개선된 버전
const constructOptimizedKoreanPrompt = (
  contextAnalysis: any,
  imageContext: string,
  settingsContext: string
): string => {
  const promptParts = [];

  // 기본 구조: 캐릭터 + 동작 + 장소 + 카메라 각도
  if (contextAnalysis.hasCharacter) {
    const characterText = contextAnalysis.characters.includes('한국') && contextAnalysis.characters.includes('소녀') 
      ? '한국 소녀' 
      : contextAnalysis.characters.includes('한국') && contextAnalysis.characters.includes('여성')
      ? '한국인 여성'
      : contextAnalysis.characters.join(', ');
    promptParts.push(characterText);
  }

  if (contextAnalysis.hasAction) {
    const actionText = contextAnalysis.actions.join(', ');
    promptParts.push(actionText);
  }

  if (contextAnalysis.hasLocation) {
    const locationText = contextAnalysis.locations.join(', ');
    promptParts.push(locationText);
  }

  if (contextAnalysis.hasCameraAngle) {
    const cameraText = contextAnalysis.cameraAngles.join(', ');
    promptParts.push(cameraText);
  }

  if (contextAnalysis.hasStyle) {
    const styleText = contextAnalysis.styles.join(', ');
    promptParts.push(styleText);
  }

  // 기본 프롬프트 구성
  let basePrompt = promptParts.join(', ');

  // 이미지 맥락 추가
  if (imageContext) {
    basePrompt += `. ${imageContext}`;
  }

  // 설정 맥락 추가 - 자연어로 변환된 카메라 설정 포함
  if (settingsContext) {
    basePrompt += `. ${settingsContext}`;
  }

  // 최종 최적화: 자연스러운 한국어 문장으로 변환
  const finalPrompt = optimizeKoreanSentence(basePrompt);

  return finalPrompt;
};

// 한국어 문장 최적화 함수
const optimizeKoreanSentence = (sentence: string): string => {
  // 불필요한 쉼표 제거 및 자연스러운 문장으로 변환
  let optimized = sentence
    .replace(/,\s*,/g, ',') // 연속된 쉼표 제거
    .replace(/,\s*\./g, '.') // 쉼표 다음 마침표 정리
    .replace(/\s+/g, ' ') // 연속된 공백 제거
    .trim();

  // 문장 끝에 마침표 추가 (없는 경우)
  if (!optimized.endsWith('.') && !optimized.endsWith('!') && !optimized.endsWith('?')) {
    optimized += '.';
  }

  return optimized;
};

// 한글을 영어로 번역하는 함수 (캐싱 버전)
export const translateKoreanToEnglish = (text: string): string => {
  // 입력값 검증 및 안전성 강화
  if (!text || typeof text !== 'string') {
    console.warn('⚠️ translateKoreanToEnglish: 유효하지 않은 입력값:', text);
    return '';
  }
  
  // 빈 문자열 처리
  if (text.trim().length === 0) {
    return '';
  }
  
  // 캐시에서 결과 확인
  const cacheKey = text.trim();
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  // 번역 시작
  
  // 1단계: 복합 명사구 패턴 매칭 (우선순위 높음)
  const complexPatterns: { [key: string]: string } = {
    // 로봇 관련 복합 패턴
    '거대 로봇의 어깨에 타고 있는 모습': 'riding on giant robot\'s shoulder',
    '거대 로봇의 어깨에 타고': 'riding on giant robot\'s shoulder',
    '거대한 로봇': 'giant robot',
    '거대 로봇': 'giant robot',
    
    // 공원 관련 복합 패턴
    '공원 잔디밭 센터': 'center of park lawn',
    '공원 잔디밭': 'park lawn',
    '잔디밭 센터': 'center of lawn',
    '잔디밭': 'lawn',
    
    // 건물 관련 복합 패턴
    '건물 2층 높이': '2-story building height',
    '2층 높이': '2-story height',
    '고전적인 로봇': 'classic robot',
    '로봇 전신 풋샷': 'robot full body shot',
    '전신 풋샷': 'full body shot',
    
    // 기본 단어들
    '배구선수': 'volleyball player',
    '운동복': 'sportswear',
    '강아지 다수': 'multiple dogs',
    '강아지': 'dog',
    '고양이': 'cat',
    '전신 풀샷': 'full body shot',
    '버즈 아이샷': 'bird\'s eye view shot',
    '노을지는 언덕길': 'sunset hill road',
    '언덕길': 'hill road',
    '노을': 'sunset',
    '소년': 'boy',
    '소녀': 'girl',
    '아이': 'child',
    '한국': 'Korean',
    '공원': 'park',
    '하이앵글': 'high angle',
    '전신': 'full body',
    '풋샷': 'shot',
    '촬영한': 'shot',
    '모습': 'scene',
    '장면': 'scene'
  };

  // 패턴 길이순으로 정렬 (긴 패턴부터 적용)
  const sortedPatterns = Object.entries(complexPatterns).sort((a, b) => b[0].length - a[0].length);
  
  let translated = text;
  
  // 복합 패턴 적용
  for (const [korean, english] of sortedPatterns) {
    if (translated.includes(korean)) {
      translated = translated.replace(new RegExp(korean, 'g'), english);
    }
  }
  
  // 2단계: 조사/어미 처리
  const particleMap: { [key: string]: string } = {
    '의': '\'s',
    '에': 'on',
    '에서': 'at',
    '를': '',
    '을': '',
    '이': '',
    '가': '',
    '는': '',
    '은': '',
    '와': 'and',
    '과': 'and',
    '로': 'with',
    '으로': 'with',
    '한': '',
    '인': '',
    '된': '',
    '하는': 'ing'
  };
  
  for (const [korean, english] of Object.entries(particleMap)) {
    translated = translated.replace(new RegExp(korean, 'g'), english);
  }
  
  // 3단계: 남은 한글 문자 제거
  translated = translated.replace(/[가-힣]/g, '');
  
  // 4단계: 영어 구조 최적화
  translated = optimizeEnglishStructure(translated);
  
  // 캐시에 저장
  translationCache.set(cacheKey, translated);
  // 번역 결과 캐시에 저장
  
  return translated;
};

// 영어 문장 구조 최적화 함수
const optimizeEnglishStructure = (text: string): string => {
  // 연속된 공백을 하나로 정리
  let optimized = text.replace(/\s+/g, ' ').trim();
  
  // 불필요한 구두점 정리
  optimized = optimized.replace(/,\s*,/g, ',');
  optimized = optimized.replace(/\.\s*\./g, '.');
  
  // 문장 부호 앞뒤 공백 정리
  optimized = optimized.replace(/\s*,\s*/g, ', ');
  optimized = optimized.replace(/\s*\.\s*/g, '. ');
  
  // 연속된 'and' 제거
  optimized = optimized.replace(/\band\s+and\b/g, 'and');
  
  // 빈 괄호 제거
  optimized = optimized.replace(/\(\s*\)/g, '');
  
  // 연속된 쉼표 제거
  optimized = optimized.replace(/,\s*,+/g, ',');
  
  return optimized.trim();
};

// 최종 프롬프트 생성 함수 (번역 비활성화 - JSON 최적화에서만 사용)
export const generateFinalPrompt = (
  basePrompt: string,
  imageRoles: ImageRole[],
  selectedOutputSize: ImageOutputSize | undefined,
  selectedEditingStyle: ImageEditingStyle | undefined,
  detailedSettings: DetailedSettings,
  isDetailedMode: boolean,
  customSize?: string,
  additionalPrompt?: string
): string => {
  // 번역은 JSON 최적화에서만 수행하므로 원본 프롬프트 반환
  return basePrompt || 'A beautiful image';
};

// 기술적 설정 생성 함수
const generateTechnicalSettings = (detailedSettings: DetailedSettings): string => {
  const settings: string[] = [];
  
  // 카메라 설정
  if (detailedSettings.camera.position !== 'front') {
    settings.push(`Camera position: ${detailedSettings.camera.position}`);
  }
  if (detailedSettings.camera.distance !== 1) {
    settings.push(`Distance: ${detailedSettings.camera.distance}`);
  }
  if (detailedSettings.camera.angle) {
    settings.push(`Angle: ${detailedSettings.camera.angle}`);
  }
  
  // 조명 설정
  if (detailedSettings.lighting.type !== 'natural') {
    settings.push(`Lighting type: ${detailedSettings.lighting.type}`);
  }
  if (detailedSettings.lighting.direction !== 'front') {
    settings.push(`Lighting direction: ${detailedSettings.lighting.direction}`);
  }
  if (detailedSettings.lighting.intensity !== 'medium') {
    settings.push(`Lighting intensity: ${detailedSettings.lighting.intensity}`);
  }
  
  // 색상 설정
  if (detailedSettings.color.palette !== 'natural') {
    settings.push(`Color palette: ${detailedSettings.color.palette}`);
  }
  if (detailedSettings.color.saturation !== 'medium') {
    settings.push(`Saturation: ${detailedSettings.color.saturation}`);
  }
  if (detailedSettings.color.contrast !== 'medium') {
    settings.push(`Contrast: ${detailedSettings.color.contrast}`);
  }
  
  return settings.join(', ');
};

// 추가 설정 생성 함수
const generateAdditionalSettings = (customSize?: string, additionalPrompt?: string): string => {
  const settings: string[] = [];
  
  if (customSize) {
    settings.push(`Custom size: ${customSize}`);
  }
  
  if (additionalPrompt) {
    settings.push(`Additional prompt: ${additionalPrompt}`);
  }
  
  return settings.join('\n');
};

// 최종 프롬프트 최적화 함수
const optimizeFinalPrompt = (prompt: string): string => {
  // 중복된 정보 제거
  let optimized = prompt;
  
  // 중복된 "Output settings" 제거
  const outputSettingsRegex = /Output settings:.*?(?=\n\n|\nReference images:|$)/g;
  const outputSettingsMatches = optimized.match(outputSettingsRegex);
  if (outputSettingsMatches && outputSettingsMatches.length > 1) {
    // 첫 번째 매치만 유지
    const firstMatch = outputSettingsMatches[0];
    optimized = optimized.replace(outputSettingsRegex, (match, index) => {
      return index === 0 ? firstMatch : '';
    });
  }
  
  // 연속된 줄바꿈 정리
  optimized = optimized.replace(/\n{3,}/g, '\n\n');
  
  // 불필요한 공백 정리
  optimized = optimized.replace(/[ \t]+/g, ' ');
  
  // 문장 부호 정리
  optimized = optimized.replace(/\s*,\s*/g, ', ');
  optimized = optimized.replace(/\s*\.\s*/g, '. ');
  
  return optimized.trim();
};
