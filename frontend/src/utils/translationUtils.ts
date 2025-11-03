import { GoogleAIService } from '../services/googleAIService';

/**
 * 번역 유틸리티 모듈
 * 한글-영문 번역 관련 함수들을 모아놓은 유틸리티
 */

// 기본적인 한글-영문 변환 매핑 (확장된 버전)
const KOREAN_TO_ENGLISH_MAP: { [key: string]: string } = {
  '한국인': 'Korean',
  '여성': 'woman',
  '소녀': 'girl',
  '남성': 'man',
  '소년': 'boy',
  '아이': 'child',
  '아기': 'baby',
  '노인': 'elderly person',
  '전신': 'full body',
  '반신': 'half body',
  '상반신': 'upper body',
  '하반신': 'lower body',
  '얼굴': 'face',
  '웨딩드레스': 'wedding dress',
  '정장': 'suit',
  '캐주얼': 'casual wear',
  '드레스': 'dress',
  '셔츠': 'shirt',
  '바지': 'pants',
  '치마': 'skirt',
  '신발': 'shoes',
  '구두': 'dress shoes',
  '운동화': 'sneakers',
  '공원': 'park',
  '성당': 'cathedral',
  '교회': 'church',
  '학교': 'school',
  '병원': 'hospital',
  '사무실': 'office',
  '집': 'house',
  '아파트': 'apartment',
  '빌딩': 'building',
  '거리': 'street',
  '광장': 'square',
  '해변': 'beach',
  '산': 'mountain',
  '강': 'river',
  '호수': 'lake',
  '숲': 'forest',
  '정원': 'garden',
  '카페': 'cafe',
  '레스토랑': 'restaurant',
  '쇼핑몰': 'shopping mall',
  '도서관': 'library',
  '박물관': 'museum',
  '미술관': 'art gallery',
  '극장': 'theater',
  '영화관': 'cinema',
  '체육관': 'gym',
  '수영장': 'swimming pool',
  '놀이터': 'playground',
  '주차장': 'parking lot',
  '지하철': 'subway',
  '버스': 'bus',
  '택시': 'taxi',
  '자동차': 'car',
  '자전거': 'bicycle',
  '오토바이': 'motorcycle',
  '비행기': 'airplane',
  '기차': 'train',
  '배': 'ship',
  '날씨': 'weather',
  '맑음': 'sunny',
  '흐림': 'cloudy',
  '비': 'rainy',
  '눈': 'snowy',
  '바람': 'windy',
  '따뜻함': 'warm',
  '시원함': 'cool',
  '추움': 'cold',
  '더움': 'hot',
  '아침': 'morning',
  '점심': 'afternoon',
  '저녁': 'evening',
  '밤': 'night',
  '새벽': 'dawn',
  '일몰': 'sunset',
  '일출': 'sunrise',
  '달': 'moon',
  '별': 'star',
  '하늘': 'sky',
  '구름': 'cloud',
  '태양': 'sun',
  '그림자': 'shadow',
  '빛': 'light',
  '어둠': 'darkness',
  '색깔': 'color',
  '빨간색': 'red',
  '파란색': 'blue',
  '초록색': 'green',
  '노란색': 'yellow',
  '주황색': 'orange',
  '보라색': 'purple',
  '분홍색': 'pink',
  '검은색': 'black',
  '흰색': 'white',
  '회색': 'gray',
  '갈색': 'brown',
  '금색': 'gold',
  '은색': 'silver',
  // 추가된 번역 (요청사항 반영)
  '금발머리로 변경하고': 'with soft blonde hair',
  '금발': 'blonde',
  '머리': 'hair',
  '변경하고': 'changed to',
  '오른손에': 'in her right hand',
  '권총을 들고': 'holding a handgun',
  '권총': 'handgun',
  '의상은': 'wearing',
  '어깨 드러난': 'off-shoulder',
  '흰': 'white',
  '입은 모습': 'dress',
  'ship경은': 'background is',
  '꽃밭': 'flower field',
  '가운데': 'in the middle of',
  '선 상태': 'standing',
  '서있는': 'standing',
  '앉아있는': 'sitting',
  '걷고있는': 'walking',
  '뛰고있는': 'running',
  '웃고있는': 'smiling',
  '울고있는': 'crying',
  '검은': 'black',
  'dress': 'dress',
  '입고': 'wearing',
  '광선검을': 'lightsaber',
  '들고': 'holding',
  '오른쪽': 'right',
  '아래로': 'downward',
  '모습': 'pose'
};

/**
 * 한글을 영문으로 변환하는 함수 (패턴 매칭 기반)
 */
export const translateKoreanToEnglish = (koreanText: string): string => {
  if (!koreanText || koreanText.trim().length === 0) {
    return '';
  }

  let translatedText = koreanText;
  
  // 한글 단어를 영문으로 변환 (긴 구문부터 우선 처리)
  const sortedKeys = Object.keys(KOREAN_TO_ENGLISH_MAP).sort((a, b) => b.length - a.length);
  sortedKeys.forEach(korean => {
    const regex = new RegExp(korean, 'g');
    translatedText = translatedText.replace(regex, KOREAN_TO_ENGLISH_MAP[korean]);
  });

  return translatedText;
};

/**
 * AI를 사용한 한글-영문 번역 함수 (API 키 검증 포함)
 */
export const translateKoreanToEnglishWithAI = async (koreanText: string): Promise<string> => {
  if (!koreanText || koreanText.trim().length === 0) {
    return '';
  }

  try {
    // API 키 상태 확인 및 재초기화
    // 1단계: localStorage에서 직접 API 키 확인
    let apiKeyFound = false;
    try {
      const currentUserRaw = localStorage.getItem('storyboard_current_user');
      const localKeysRaw = localStorage.getItem('user_api_keys');
      
      console.log('🔍 API 키 상태 확인:', {
        hasCurrentUser: !!currentUserRaw,
        hasLocalKeys: !!localKeysRaw,
        currentUser: currentUserRaw ? JSON.parse(currentUserRaw) : null
      });
      
      if (localKeysRaw) {
        const localKeys = JSON.parse(localKeysRaw);
        if (localKeys?.google && localKeys.google.trim() !== '') {
          apiKeyFound = true;
          console.log('✅ localStorage에서 Google API 키 발견');
        }
      }
      
      if (!apiKeyFound && currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        if (currentUser?.apiKeys?.google && currentUser.apiKeys.google.trim() !== '') {
          apiKeyFound = true;
          console.log('✅ 사용자 객체에서 Google API 키 발견');
        }
      }
    } catch (error) {
      console.error('❌ API 키 확인 중 오류:', error);
    }
    
    // 2단계: API 키가 없으면 사용자에게 안내
    if (!apiKeyFound) {
      console.warn('⚠️ Google AI API 키가 설정되지 않음. 패턴 매칭 번역으로 폴백');
      console.warn('💡 설정 → AI 설정에서 Google AI API 키를 입력해주세요.');
      return translateKoreanToEnglish(koreanText);
    }
    
    // 3단계: API 키 재초기화 시도 (최신 API 키 반영)
    const googleAIService = GoogleAIService.reinitializeInstance();
    
    // 4단계: API 키 초기화 확인
    if (!googleAIService.isInitialized()) {
      console.warn('⚠️ GoogleAIService 초기화 실패. API 키는 있지만 서비스 인스턴스 생성 실패');
      console.warn('💡 페이지를 새로고침하거나 다시 시도해주세요.');
      return translateKoreanToEnglish(koreanText);
    }
    
    const translationPrompt = `Translate the following Korean prompt to natural, descriptive English for image generation. Preserve all details and nuances. Do not omit any information.

Korean prompt: ${koreanText}

Translation requirements:
1. Natural, fluent English
2. Preserve all details and specific terms
3. Use professional photography terminology where appropriate
4. Maintain the original meaning and context
5. Do not add or remove information

Return only the English translation (no additional explanation):`;

    const translated = await googleAIService.generateText(translationPrompt, 'gemini-2.5-flash');
    return translated.trim();
  } catch (error) {
    console.error('❌ AI 번역 실패:', error);
    // 실패 시 패턴 매칭 번역으로 폴백
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('API 키')) {
      console.warn('⚠️ API 키 미설정으로 패턴 매칭 번역 사용');
    }
    return translateKoreanToEnglish(koreanText);
  }
};

