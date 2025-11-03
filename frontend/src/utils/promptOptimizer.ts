import { 
  ImageRole, 
  ImageOutputSize, 
  ImageEditingStyle, 
  DetailedSettings,
  ImageGenerationConfig
} from '../types/imageGeneration';

/**
 * 프롬프트 최적화 유틸리티 모듈
 * 재사용 가능한 프롬프트 조합 및 최적화 함수들
 */

// 한글을 영문으로 번역하는 기본 함수
export const translateKoreanToEnglish = (koreanText: string): string => {
  const translations: { [key: string]: string } = {
    '한국인 소녀': 'Korean girl',
    '전신': 'full body',
    '웨딩드레스': 'wedding dress',
    '성당 주변 공원': 'park around cathedral',
    '둘러보는 중': 'looking around',
    '카페': 'cafe',
    '커피': 'coffee',
    '앉아': 'sitting',
    '마시는': 'drinking',
    '들고': 'holding',
    '검은': 'black',
    'dress': 'dress',
    '입고': 'wearing',
    '광선검을': 'lightsaber',
    '오른쪽': 'right',
    '아래로': 'downward',
    '모습': 'pose'
  };

  let translatedText = koreanText;
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  sortedKeys.forEach(korean => {
    const regex = new RegExp(korean, 'g');
    translatedText = translatedText.replace(regex, translations[korean]);
  });

  return translatedText;
};

/**
 * 최적화된 프롬프트 생성 함수
 * 모든 설정을 통합하여 최적화된 영문 프롬프트를 생성
 */
export const generateOptimizedPrompt = (
  inputPrompt: string,
  imageRoles: ImageRole[],
  selectedOutputSize: ImageOutputSize | null,
  selectedEditingStyle: ImageEditingStyle | null,
  detailedSettings: DetailedSettings | null,
  isDetailedMode: boolean,
  config: ImageGenerationConfig
): {
  prompt: string;
  model: string;
  ratio: string;
  upscale: string;
  settings: string;
  baseSubject?: string;
} => {
  // 입력이 이미 영문인지 확인
  const isAlreadyEnglish = !/[가-힣]/.test(inputPrompt);
  
  // 한글 프롬프트를 영문으로 변환
  let baseSubject: string;
  
  if (isAlreadyEnglish) {
    baseSubject = inputPrompt;
  } else {
    baseSubject = translateKoreanToEnglish(inputPrompt);
  }

  // 프롬프트 구조 구성
  let optimizedPrompt = '';
  
  let angleDescription = '';
  let framePositionDescription = '';
  let lensDofDescription = '';
  let movementDescription = '';
  let lightingDescription = '';
  let textureDescription = '';
  
  if (isDetailedMode && detailedSettings?.camera) {
    const cameraSettings = detailedSettings.camera;
    
    // 카메라 각도 설명
    const panDirection = cameraSettings.panAngle < 0 ? 'left' : cameraSettings.panAngle > 0 ? 'right' : 'center';
    const tiltDirection = cameraSettings.tiltAngle < 0 ? 'downward' : cameraSettings.tiltAngle > 0 ? 'upward' : 'horizontal';
    
    angleDescription = `Capture the shot from a ${cameraSettings.position} perspective`;
    if (cameraSettings.distance) {
      angleDescription += ` at approximately ${cameraSettings.distance}m distance`;
    }
    if (cameraSettings.panAngle !== 0 || cameraSettings.tiltAngle !== 0) {
      angleDescription += `, panned ${Math.abs(cameraSettings.panAngle)}° ${panDirection}, tilted ${Math.abs(cameraSettings.tiltAngle)}° ${tiltDirection}`;
    }
    
    // 프레임 위치 설명
    if (cameraSettings.screenPositionX !== undefined || cameraSettings.screenPositionY !== undefined) {
      const x = cameraSettings.screenPositionX || 0;
      const y = cameraSettings.screenPositionY || 0;
      
      if (x !== 0 || y !== 0) {
        const xDir = x > 0 ? 'right' : x < 0 ? 'left' : '';
        const yDir = y > 0 ? 'upper' : y < 0 ? 'lower' : '';
        framePositionDescription = `Position the subject in the ${yDir} ${xDir} portion of the frame using the rule of thirds`;
      } else {
        framePositionDescription = `Position the subject near the frame center using the rule of thirds`;
      }
    } else {
      framePositionDescription = `Using the rule of thirds to position the subject naturally`;
    }
    
    // 렌즈 및 DOF 설명
    lensDofDescription = `Use a ${cameraSettings.lensFocalLength || 50}mm ${cameraSettings.lensType || 'standard'} lens with ${cameraSettings.depthOfField || 'medium'} depth of field`;
    
    // 이동 설명
    movementDescription = `Natural movement with ${cameraSettings.motionBlur || 'none'} motion blur`;
    
    // 조명 설명
    if (detailedSettings.lighting) {
      const lighting = detailedSettings.lighting;
      lightingDescription = `${lighting.intensity || 'medium'} ${lighting.type || 'natural'} lighting from the ${lighting.direction || 'front'}`;
      if (lighting.shadows) {
        lightingDescription += ` with ${lighting.shadows} shadows`;
      }
    }
    
    textureDescription = `lifelike textures and natural shadow falloff`;
  } else {
    // 기본 설정
    angleDescription = `Capture the shot from an elevated top-down perspective about 4 meters high and angled 40° downward`;
    framePositionDescription = `Compose the scene using the rule of thirds, position the subject near the frame's vertical third`;
    lensDofDescription = `Use a 70mm lens perspective with moderate depth of field`;
    movementDescription = `Natural motion with soft movement`;
    lightingDescription = `Soft daylight from the upper-right with subtle fill from the front-left`;
    textureDescription = `lifelike textures and natural shadow falloff`;
  }
  
  // 최종 프롬프트 조합
  optimizedPrompt = `Create a cinematic full-body photograph of ${baseSubject}. ${movementDescription}. ${framePositionDescription}. ${angleDescription}. ${lensDofDescription}. ${lightingDescription}. Ensure ${textureDescription} for a clean editorial-grade finish`;
  
  // 참조 이미지 보존
  if (imageRoles.length > 0) {
    optimizedPrompt += `. Preserve facial structure, hairstyle, and expression exactly as in the reference image`;
  }
  
  // 편집 스타일 적용
  if (selectedEditingStyle) {
    optimizedPrompt = `${selectedEditingStyle.prompt} ${optimizedPrompt}`;
  }
  
  // 출력 비율 결정: 우선순위
  // 1. 커스텀 사이즈가 있으면 기본 비율 사용 (customSize가 별도로 처리됨)
  // 2. 상단 옵션 (selectedOutputSize 또는 config.aspectRatio)
  // 3. 기본값 16:9 (일관성 유지)
  const outputRatio = config.customSize && config.customSize.trim()
    ? (selectedOutputSize?.ratio || config.aspectRatio || '16:9')
    : (selectedOutputSize?.ratio || config.aspectRatio || '16:9');
  
  // settings 문자열에 실제 비율 정보 포함 (중복 방지)
  const settingsString = `--no text --no logo --no watermark --no captions --no artifacts --ar ${outputRatio}`;
  
  return {
    model: "nano-banana",
    prompt: optimizedPrompt,
    ratio: outputRatio,
    upscale: "Upscale photos to high resolution x2",
    settings: settingsString,
    baseSubject: baseSubject
  };
};

/**
 * 프롬프트 통합 최적화 함수
 * 카메라/조명 설정을 포함하여 프롬프트를 최적화
 */
export const integratePromptWithSettings = (
  basePrompt: string,
  imageRoles: ImageRole[],
  selectedOutputSize: ImageOutputSize | null,
  selectedEditingStyle: ImageEditingStyle | null,
  detailedSettings: DetailedSettings | null,
  isDetailedMode: boolean,
  config: ImageGenerationConfig
): string => {
  const optimized = generateOptimizedPrompt(
    basePrompt,
    imageRoles,
    selectedOutputSize,
    selectedEditingStyle,
    detailedSettings,
    isDetailedMode,
    config
  );
  
  return optimized.prompt;
};

