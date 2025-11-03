import React, { useState } from 'react';
import Button from '../Button';
import Modal from '../Modal';
import { 
  ImageRole, 
  ImageOutputSize, 
  ImageEditingStyle,
  DetailedSettings,
  ImageGenerationConfig
} from '../../../types/imageGeneration';
import { generateOptimizedPrompt } from '../../../utils/promptOptimizer';
import { translateKoreanToEnglish, translateKoreanToEnglishWithAI } from '../../../utils/translationUtils';
import { GoogleAIService } from '../../../services/googleAIService';

interface PromptOptimizationStepProps {
  prompt: string;
  imageRoles: ImageRole[];
  selectedOutputSize: ImageOutputSize | null;
  selectedEditingStyle: ImageEditingStyle | null;
  detailedSettings: DetailedSettings;
  isDetailedMode: boolean;
  config: ImageGenerationConfig;
  optimizationResult: {
    aiOptimizedKorean: string;
    translatedEnglish: string;
    geminiOptimized: string;
    model?: string;
    ratio?: string;
    upscale?: string;
    settings?: string;
  } | null;
  isTranslating: boolean;
  isOptimizing: boolean;
  onOptimizationResultChange: (result: {
    aiOptimizedKorean: string;
    translatedEnglish: string;
    geminiOptimized: string;
    model?: string;
    ratio?: string;
    upscale?: string;
    settings?: string;
  } | null) => void;
  onTranslatingChange: (isTranslating: boolean) => void;
  onOptimizingChange: (isOptimizing: boolean) => void;
  onResetOptimization: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * 프롬프트 최적화 및 확인 단계 컴포넌트
 */
export const PromptOptimizationStep: React.FC<PromptOptimizationStepProps> = ({
  prompt,
  imageRoles,
  selectedOutputSize,
  selectedEditingStyle,
  detailedSettings,
  isDetailedMode,
  config,
  optimizationResult,
  isTranslating,
  isOptimizing,
  onOptimizationResultChange,
  onTranslatingChange,
  onOptimizingChange,
  onResetOptimization,
  onPrev,
  onNext
}) => {
  const [showRatioPriorityModal, setShowRatioPriorityModal] = useState(false);
  // JSON 최적화 버튼 핸들러
  const handleJSONOptimization = async () => {
    const inputPrompt = prompt || '';
    if (!inputPrompt.trim()) {
      alert('최적화할 프롬프트가 없습니다.');
      return;
    }
    
    onTranslatingChange(true);
    onOptimizingChange(true);
    
    try {
      // 1. AI 번역 먼저 수행 (API 키 재초기화 포함)
      const translatedEnglish = await translateKoreanToEnglishWithAI(inputPrompt);
      
      // 번역 결과 확인 (한글이 남아있으면 패턴 매칭 번역으로 보완)
      let finalTranslated = translatedEnglish;
      if (!translatedEnglish || /[가-힣]/.test(translatedEnglish) || translatedEnglish.trim().length === 0) {
        console.warn('⚠️ AI 번역 결과가 불완전함. 패턴 매칭 번역으로 보완');
        finalTranslated = translateKoreanToEnglish(inputPrompt);
      }
      
      onTranslatingChange(false);
      
      // 2. 번역된 영문 프롬프트로 JSON 최적화
      const optimizedPromptData = generateOptimizedPrompt(
        finalTranslated,
        imageRoles,
        selectedOutputSize,
        selectedEditingStyle,
        detailedSettings,
        isDetailedMode,
        config
      );
      
      onOptimizationResultChange({
        aiOptimizedKorean: inputPrompt,
        translatedEnglish: finalTranslated,
        geminiOptimized: optimizedPromptData.prompt,
        model: optimizedPromptData.model,
        ratio: optimizedPromptData.ratio,
        upscale: optimizedPromptData.upscale,
        settings: optimizedPromptData.settings
      });
      
      onOptimizingChange(false);
      
      // 결과 표시
      const result = `✅ 최적화 완료!\n\n모델: ${optimizedPromptData.model}\n비율: ${optimizedPromptData.ratio}\n업스케일: ${optimizedPromptData.upscale}\n설정: ${optimizedPromptData.settings}\n\n최적화된 프롬프트:\n${optimizedPromptData.prompt}`;
      alert(result);
    } catch (error) {
      console.error('❌ 최적화 실패:', error);
      onTranslatingChange(false);
      onOptimizingChange(false);
      alert('최적화 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // AI 번역 통합 버튼 핸들러
  const handleAITranslationIntegration = async () => {
    const inputPrompt = prompt || '';
    if (!inputPrompt.trim()) {
      alert('최적화할 프롬프트가 없습니다.');
      return;
    }
    
    onTranslatingChange(true);
    
    try {
      // API 키 상태 사전 확인
      let apiKeyFound = false;
      try {
        const localKeysRaw = localStorage.getItem('user_api_keys');
        if (localKeysRaw) {
          const localKeys = JSON.parse(localKeysRaw);
          if (localKeys?.google && localKeys.google.trim() !== '' && localKeys.google !== 'your-gemini-api-key') {
            apiKeyFound = true;
          }
        }
        
        if (!apiKeyFound) {
          const currentUserRaw = localStorage.getItem('storyboard_current_user');
          if (currentUserRaw) {
            const currentUser = JSON.parse(currentUserRaw);
            if (currentUser?.apiKeys?.google && currentUser.apiKeys.google.trim() !== '' && currentUser.apiKeys.google !== 'your-gemini-api-key') {
              apiKeyFound = true;
            }
          }
        }
      } catch (error) {
        console.error('❌ API 키 확인 중 오류:', error);
      }
      
      if (!apiKeyFound) {
        alert('Google AI API 키가 설정되지 않았습니다.\n\n설정 → AI 설정에서 Google AI API 키를 입력해주세요.\n\n기본 번역으로 진행합니다.');
        onTranslatingChange(false);
        
        // 기본 번역 + JSON 최적화로 폴백
        const translatedEnglish = translateKoreanToEnglish(inputPrompt);
        const optimizedPromptData = generateOptimizedPrompt(
          translatedEnglish,
          imageRoles,
          selectedOutputSize,
          selectedEditingStyle,
          detailedSettings,
          isDetailedMode,
          config
        );
        
        onOptimizationResultChange({
          aiOptimizedKorean: inputPrompt,
          translatedEnglish: translatedEnglish,
          geminiOptimized: optimizedPromptData.prompt,
          model: optimizedPromptData.model,
          ratio: optimizedPromptData.ratio,
          upscale: optimizedPromptData.upscale,
          settings: optimizedPromptData.settings
        });
        return;
      }
      
      // API 키 재초기화 시도
      const googleAIService = GoogleAIService.reinitializeInstance();
      
      if (!googleAIService.isInitialized()) {
        console.error('⚠️ API 키는 있지만 서비스 초기화 실패');
        alert('Google AI 서비스 초기화에 실패했습니다.\n\n페이지를 새로고침하거나 다시 시도해주세요.\n\n기본 번역으로 진행합니다.');
        onTranslatingChange(false);
        
        // 기본 번역 + JSON 최적화로 폴백
        const translatedEnglish = translateKoreanToEnglish(inputPrompt);
        const optimizedPromptData = generateOptimizedPrompt(
          translatedEnglish,
          imageRoles,
          selectedOutputSize,
          selectedEditingStyle,
          detailedSettings,
          isDetailedMode,
          config
        );
        
        onOptimizationResultChange({
          aiOptimizedKorean: inputPrompt,
          translatedEnglish: translatedEnglish,
          geminiOptimized: optimizedPromptData.prompt,
          model: optimizedPromptData.model,
          ratio: optimizedPromptData.ratio,
          upscale: optimizedPromptData.upscale,
          settings: optimizedPromptData.settings
        });
        return;
      }
      
      // 화면 비율 정보
      const outputRatio = selectedOutputSize?.ratio || '4:3';
      console.log('📐 출력 사이즈:', outputRatio, selectedOutputSize);
      
      // 카메라 설정 문자열 생성
      const cameraInfo = isDetailedMode && detailedSettings?.camera
        ? `Camera settings:
- Position: ${detailedSettings.camera.position || 'front'}
- Distance: ${detailedSettings.camera.distance || 1}m
- Lens: ${detailedSettings.camera.lensType || 'standard'}
- Tilt angle: ${detailedSettings.camera.tiltAngle || 0}°
- Pan angle: ${detailedSettings.camera.panAngle || 0}°`
        : 'Camera settings: default';
      
      // 조명 설정 문자열 생성
      const lightingInfo = isDetailedMode && detailedSettings?.lighting
        ? `Lighting settings:
- Type: ${detailedSettings.lighting.type || 'natural'}
- Direction: ${detailedSettings.lighting.direction || 'front'}
- Intensity: ${detailedSettings.lighting.intensity || 'medium'}`
        : 'Lighting settings: default';
      
      // 통합 프롬프트 (번역 + 최적화 동시)
      const integratedPrompt = `Translate and optimize the following Korean prompt for image generation:

Original Korean prompt: ${inputPrompt}

${cameraInfo}

${lightingInfo}

Output size/aspect ratio: ${outputRatio}

Please:
1. Translate the Korean prompt to natural, descriptive English
2. Preserve all details and nuances from the original
3. Apply camera and lighting settings naturally
4. Optimize for nano-banana model with aspect ratio ${outputRatio}
5. Use professional photography terminology
6. Apply composition rules (rule of thirds, leading lines, etc.)
7. Enhance with cinematic and visual design principles
8. Consider the ${outputRatio} aspect ratio in framing and composition

Return only the optimized English prompt (no additional explanation):`;

      const optimizedEnglish = await googleAIService.generateText(integratedPrompt, 'gemini-2.5-flash');
      
      // 최적화된 프롬프트로 JSON 생성
      const optimizedPromptData = generateOptimizedPrompt(
        optimizedEnglish.trim(),
        imageRoles,
        selectedOutputSize,
        selectedEditingStyle,
        detailedSettings,
        isDetailedMode,
        config
      );
      
      // 기본 번역도 함께 저장 (비교용)
      let basicTranslation: string;
      try {
        basicTranslation = await translateKoreanToEnglishWithAI(inputPrompt);
      } catch (translationError) {
        console.warn('⚠️ 기본 번역 실패, 패턴 매칭 번역 사용');
        basicTranslation = translateKoreanToEnglish(inputPrompt);
      }
      
      onOptimizationResultChange({
        aiOptimizedKorean: inputPrompt,
        translatedEnglish: basicTranslation,
        geminiOptimized: optimizedPromptData.prompt,
        model: optimizedPromptData.model,
        ratio: optimizedPromptData.ratio,
        upscale: optimizedPromptData.upscale,
        settings: optimizedPromptData.settings
      });
      
      onTranslatingChange(false);
      
      // 결과 표시
      const result = `✅ AI 번역 통합 최적화 완료!\n\n모델: ${optimizedPromptData.model}\n비율: ${optimizedPromptData.ratio}\n업스케일: ${optimizedPromptData.upscale}\n설정: ${optimizedPromptData.settings}\n\n최적화된 프롬프트:\n${optimizedPromptData.prompt}`;
      alert(result);
    } catch (error) {
      console.error('❌ AI 번역 통합 최적화 실패:', error);
      onTranslatingChange(false);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('API 키')) {
        alert('Google AI API 키가 설정되지 않았습니다.\n\n설정 → AI 설정에서 Google AI API 키를 입력해주세요.\n\n기본 번역으로 진행합니다.');
        
        // 기본 번역 + JSON 최적화로 폴백
        const translatedEnglish = translateKoreanToEnglish(inputPrompt);
        const optimizedPromptData = generateOptimizedPrompt(
          translatedEnglish,
          imageRoles,
          selectedOutputSize,
          selectedEditingStyle,
          detailedSettings,
          isDetailedMode,
          config
        );
        
        onOptimizationResultChange({
          aiOptimizedKorean: inputPrompt,
          translatedEnglish: translatedEnglish,
          geminiOptimized: optimizedPromptData.prompt,
          model: optimizedPromptData.model,
          ratio: optimizedPromptData.ratio,
          upscale: optimizedPromptData.upscale,
          settings: optimizedPromptData.settings
        });
      } else {
        alert('최적화 중 오류가 발생했습니다. 다시 시도해주세요.\n\n에러: ' + errorMessage);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">프롬프트 최적화 및 확인</h3>
        <p className="text-sm text-gray-600">이미지 생성에 사용될 최종 프롬프트를 확인하세요.</p>
      </div>
      
      {/* 입력된 프롬프트와 추가옵션 미리보기 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">입력된 프롬프트 및 설정</h4>
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">기본 프롬프트</h5>
            <p className="text-sm text-gray-600 bg-white p-2 rounded border">
              {prompt || '프롬프트가 입력되지 않았습니다.'}
            </p>
          </div>
          
          {selectedOutputSize && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-sm font-medium text-gray-700">출력 사이즈</h5>
                <button
                  onClick={() => setShowRatioPriorityModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  title="비율 적용 우선순위 가이드"
                >
                  <span>ℹ️</span>
                  <span>비율적용 우선순위</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                {selectedOutputSize.displayName} ({selectedOutputSize.ratio})
              </p>
            </div>
          )}
          
          {selectedEditingStyle && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">편집 스타일</h5>
              <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                {selectedEditingStyle.displayName}
              </p>
            </div>
          )}
          
          {isDetailedMode && detailedSettings && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">상세 설정</h5>
              <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                <div>카메라: {detailedSettings.camera?.position || 'front'}, 거리: {detailedSettings.camera?.distance || 1}m</div>
                <div>렌즈: {detailedSettings.camera?.lensType || 'standard'}, 각도: {detailedSettings.camera?.tiltAngle || 0}°</div>
                <div>조명: {detailedSettings.lighting?.type || 'natural'}, 방향: {detailedSettings.lighting?.direction || 'front'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON 최적화 결과 표시 */}
      {optimizationResult && (
        <div className="space-y-4">
          {/* 영문 프롬프트 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3">영문 프롬프트</h4>
            <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {optimizationResult.translatedEnglish || translateKoreanToEnglish(prompt || '') || '프롬프트가 없습니다.'}
              </div>
            </div>
          </div>
          
          {/* 영문 JSON (최종 적용 버전) */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-3">영문 JSON (최종 적용 버전)</h4>
            <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
{JSON.stringify({
  "model": optimizationResult.model || "nano-banana",
  "prompt": optimizationResult.geminiOptimized,
  "ratio": optimizationResult.ratio || selectedOutputSize?.ratio || config.aspectRatio || "4:3",
  "upscale": optimizationResult.upscale || "Upscale photos to high resolution x2",
  "settings": optimizationResult.settings || `--no text --no logo --no watermark --no captions --no artifacts --ar ${optimizationResult.ratio || selectedOutputSize?.ratio || config.aspectRatio || "4:3"}`
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* JSON 최적화 버튼 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-green-800">프롬프트 최적화</h4>
          <div className="text-sm text-gray-500">
            카메라 앵글 및 상세 설정 반영
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* JSON 최적화 버튼 */}
          <Button
            onClick={handleJSONOptimization}
            disabled={isTranslating || isOptimizing}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2">
              {isTranslating ? '⏳' : isOptimizing ? '⚙️' : '🚀'}
            </span>
            {isTranslating ? 'AI 번역 중...' : isOptimizing ? '최적화 중...' : 'JSON 최적화 적용'}
          </Button>
          
          {/* AI 번역 통합 버튼 */}
          <Button
            onClick={handleAITranslationIntegration}
            disabled={isTranslating || isOptimizing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2">
              {isTranslating ? '⏳' : '🤖'}
            </span>
            {isTranslating ? '통합 최적화 중...' : 'AI 번역 통합'}
          </Button>
          
          <Button
            onClick={onResetOptimization}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
            title="번역 및 JSON 최적화 결과만 초기화합니다"
          >
            <span className="mr-2">🔄</span>
            초기화
          </Button>
        </div>
      </div>

      {/* 이전/다음 버튼 */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={onPrev}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
        >
          이전
        </Button>
        <Button
          onClick={onNext}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          다음
        </Button>
      </div>

      {/* 비율 적용 우선순위 모달 */}
      <Modal
        isOpen={showRatioPriorityModal}
        onClose={() => setShowRatioPriorityModal(false)}
        title="🎯 비율 적용 우선순위 가이드"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 기본 원리 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 기본 원리: "비율 우선순위 3단계"</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-3 py-2 text-left border border-gray-300">우선순위</th>
                    <th className="px-3 py-2 text-left border border-gray-300">적용 기준</th>
                    <th className="px-3 py-2 text-left border border-gray-300">설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-medium border border-gray-300">① 명시적 비율</td>
                    <td className="px-3 py-2 border border-gray-300">프롬프트에 ratio: "9:16" / --ar 9:16 명시 시</td>
                    <td className="px-3 py-2 border border-gray-300">
                      사용자가 지정한 비율이 최우선 적용됨. 단, 두 이미지의 프레임이 크게 다를 경우 자동 보정 발생 가능.
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 font-medium border border-gray-300">② 배경 이미지의 비율 (image 1)</td>
                    <td className="px-3 py-2 border border-gray-300">명시 비율이 없을 때</td>
                    <td className="px-3 py-2 border border-gray-300">
                      "1번 = 배경"으로 인식되므로, 배경 이미지의 원본 비율이 전체 합성 결과의 캔버스 비율로 설정됨.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium border border-gray-300">③ 다수 인물/오브젝트 이미지의 평균 비율</td>
                    <td className="px-3 py-2 border border-gray-300">배경 없이 2개 이상 인물/오브젝트 합성 시</td>
                    <td className="px-3 py-2 border border-gray-300">
                      각 입력 이미지의 비율 평균값(대개 4:5 또는 3:4 근처)을 자동 계산해 중립 캔버스 생성.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 구체적 적용 예시 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📘 구체적 적용 예시</h3>
            
            <div className="space-y-4">
              {/* 예시 1 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">✅ 예시 1</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700"><strong>입력:</strong> 1번 배경에 2번 인물 합성, 9:16 비율로</p>
                  <div className="bg-white p-2 rounded border border-blue-300">
                    <code className="text-xs">"ratio": "9:16"</code>
                  </div>
                  <p className="text-gray-600">
                    <strong>🔹 출력 비율 → 9:16 고정</strong><br />
                    단, 인물 팔·다리 잘림 방지를 위해 내부적으로 여백 크롭 보정(4:5→9:16 crop-safe framing)이 적용될 수 있음.
                  </p>
                </div>
              </div>

              {/* 예시 2 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ 예시 2</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700"><strong>입력:</strong> 1번과 2번 모두 인물이고 배경 따로 없음</p>
                  <p className="text-gray-600">
                    → 명시된 ratio가 없다면:<br />
                    AI는 두 인물의 원본 비율 평균(보통 3:4~4:5) 을 계산해 프레임을 잡음<br />
                    <strong>결과적으로 "자연스러운 인물 중심 구도(4:5형)"이 기본 출력.</strong>
                  </p>
                </div>
              </div>

              {/* 예시 3 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">✅ 예시 3</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700"><strong>입력:</strong> 1번 배경 (16:9 사진), 2번 인물 (1:1 사진)</p>
                  <p className="text-gray-600">
                    <strong>명시 비율 없음 → 배경(16:9) 기준으로 출력</strong><br />
                    인물은 자동 리스케일 및 중앙 배치 후, 배경 구도에 맞게 조명/색온도 보정.
                  </p>
                </div>
              </div>

              {/* 예시 4 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">✅ 예시 4</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700"><strong>입력:</strong> 1번 배경 + 2번 제품 + 3번 인물, 비율 지정 없음</p>
                  <p className="text-gray-600">
                    → 규칙:<br />
                    <strong>배경(1번)의 비율 = 전체 프레임 비율</strong><br />
                    나머지 피사체(2,3)는 배경의 원근과 비율에 맞게 자동 스케일링<br /><br />
                    즉, ratio 지시가 없는 경우 항상 "첫 번째 이미지(배경)"의 비율이 기준이 됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 특이 케이스 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">⚙️ 특이 케이스: 모델별 차이</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-3 py-2 text-left border border-gray-300">모델</th>
                    <th className="px-3 py-2 text-left border border-gray-300">다중 이미지 합성 시 기본 비율</th>
                    <th className="px-3 py-2 text-left border border-gray-300">비율 충돌 시 처리 방식</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-medium border border-gray-300">Imagen / nano-banana<br />(Google 계열)</td>
                    <td className="px-3 py-2 border border-gray-300">배경 이미지 비율</td>
                    <td className="px-3 py-2 border border-gray-300">배경 중심 자동 리컴포지션 (crop-safe, subject-centered)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 font-medium border border-gray-300">Midjourney v6+</td>
                    <td className="px-3 py-2 border border-gray-300">명시된 --ar 우선</td>
                    <td className="px-3 py-2 border border-gray-300">단, 두 참조 이미지 비율 차이 40% 이상이면 자동 중앙 크롭</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium border border-gray-300">Firefly / Leonardo AI</td>
                    <td className="px-3 py-2 border border-gray-300">배경 비율 우선</td>
                    <td className="px-3 py-2 border border-gray-300">인물/오브젝트 리스케일 후 안전구도 적용</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 font-medium border border-gray-300">Stable Diffusion / ComfyUI</td>
                    <td className="px-3 py-2 border border-gray-300">지정 비율 고정</td>
                    <td className="px-3 py-2 border border-gray-300">단, ControlNet이나 Depth 기반 합성 시 원본 비율을 일부 유지</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 현재 설정 정보 */}
          {imageRoles && imageRoles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📋 현재 설정 정보</h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>첨부된 이미지:</strong> {imageRoles.length}개
                  {selectedOutputSize && (
                    <><br /><strong>명시된 비율:</strong> {selectedOutputSize.ratio} ({selectedOutputSize.displayName})</>
                  )}
                </p>
                {imageRoles.length === 1 && (
                  <p className="text-blue-700">
                    💡 <strong>1개 이미지:</strong> 첨부 이미지의 비율이 우선 적용됩니다.
                  </p>
                )}
                {imageRoles.length >= 2 && (
                  <p className="text-blue-700">
                    💡 <strong>2개 이상 이미지:</strong> {selectedOutputSize 
                      ? `명시된 비율(${selectedOutputSize.ratio})이 최우선 적용됩니다. 비율이 지정되지 않은 경우, 첫 번째 이미지(배경)의 비율이 기준이 됩니다.`
                      : '첫 번째 이미지(배경으로 인식)의 비율이 전체 캔버스 비율로 설정됩니다.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 닫기 버튼 */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => setShowRatioPriorityModal(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

