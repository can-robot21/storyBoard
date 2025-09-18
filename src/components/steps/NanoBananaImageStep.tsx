import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import ImageUpload from '../common/ImageUpload';
import { NanoBananaService } from '../../services/ai/NanoBananaService';

interface GeneratedItem {
  id: number;
  description: string;
  image: string;
  attachedImages: File[];
  timestamp: string;
}

interface NanoBananaImageStepProps {
  generatedCharacters: GeneratedItem[];
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  generatedBackgrounds: GeneratedItem[];
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  generatedSettingCuts: GeneratedItem[];
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  // 고급 이미지 생성 props
  generatedAdvancedImages: GeneratedItem[];
  setGeneratedAdvancedImages: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  generatedProjectData: any;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  // 프로젝트 개요 데이터
  story: string;
  characterList: any[];
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  onNext: () => void;
  canProceedToNext?: () => boolean;
}

export const NanoBananaImageStep: React.FC<NanoBananaImageStepProps> = ({
  generatedCharacters,
  setGeneratedCharacters,
  generatedBackgrounds,
  setGeneratedBackgrounds,
  generatedSettingCuts,
  setGeneratedSettingCuts,
  // 고급 이미지 생성 props
  generatedAdvancedImages,
  setGeneratedAdvancedImages,
  generatedProjectData,
  showTextResults,
  setShowTextResults,
  story,
  characterList,
  scenarioPrompt,
  storySummary,
  finalScenario,
  onNext,
  canProceedToNext
}) => {
  
  // 캐릭터 관련 상태
  const [characterInput, setCharacterInput] = useState('');
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  
  // 배경 관련 상태
  const [backgroundInput, setBackgroundInput] = useState('');
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  
  // 설정 컷 관련 상태
  const [settingCut, setSettingCut] = useState('');
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);

  // 나노 바나나 전용 옵션
  const [customSize, setCustomSize] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<'realistic' | 'cartoon' | 'anime' | '3d' | 'watercolor' | 'oil_painting'>('realistic');
  const [imageQuality, setImageQuality] = useState<'high' | 'standard' | 'ultra'>('high');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');

  // 고급 이미지 생성 모달 상태
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(1);
  const [advancedPrompt, setAdvancedPrompt] = useState('');
  const [advancedImages, setAdvancedImages] = useState<File[]>([]);
  const [advancedStyle, setAdvancedStyle] = useState<'realistic' | 'cartoon' | 'anime' | '3d' | 'watercolor' | 'oil_painting'>('realistic');
  const [advancedQuality, setAdvancedQuality] = useState<'high' | 'standard' | 'ultra'>('high');
  const [advancedAspectRatio, setAdvancedAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [advancedCustomSize, setAdvancedCustomSize] = useState('');
  const [advancedAdditionalPrompt, setAdvancedAdditionalPrompt] = useState('');
  const [generatedAdvancedImage, setGeneratedAdvancedImage] = useState<string>('');
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string>('');
  const [editablePrompt, setEditablePrompt] = useState<string>('');
  const [showAnalysisResult, setShowAnalysisResult] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // 나노 바나나 서비스 직접 인스턴스화
  const nanoBananaService = useMemo(() => {
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        console.error('❌ REACT_APP_GEMINI_API_KEY가 설정되지 않았습니다.');
        return null;
      }
      return new NanoBananaService({ apiKey });
    } catch (error) {
      console.error('❌ 나노 바나나 서비스 초기화 실패:', error);
      return null;
    }
  }, []);

  // 나노 바나나 전용으로 직접 서비스 사용

  // 캐릭터 생성
  const handleGenerateCharacter = async () => {
    try {
      console.log('🍌 나노 바나나 캐릭터 생성 시작:', { characterInput, attachedCharacterImages });
      
      if (!nanoBananaService) {
        console.error('❌ 나노 바나나 서비스를 사용할 수 없습니다.');
        return;
      }
      
      // 프롬프트 구성
      let finalPrompt = characterInput;
      if (additionalPrompt.trim()) {
        finalPrompt = `${finalPrompt}\n\n추가 요청사항: ${additionalPrompt}`;
      }
      if (customSize.trim()) {
        finalPrompt = `${finalPrompt}\n\n사이즈 요청사항: ${customSize}`;
      }
      
      // 스타일과 품질 추가
      finalPrompt = `${finalPrompt}\n\n스타일: ${imageStyle}, 품질: ${imageQuality}, 비율: ${aspectRatio}`;
      
      console.log('🔄 최종 프롬프트:', finalPrompt);
      
      let imageResult;
      if (attachedCharacterImages.length > 0) {
        // 이미지와 함께 생성
        imageResult = await nanoBananaService.generateImageWithReference(
          finalPrompt, 
          attachedCharacterImages[0], 
          customSize
        );
      } else {
        // 텍스트만으로 생성
        const result = await nanoBananaService.generateImage({
          prompt: finalPrompt,
          provider: 'nano-banana',
          model: 'gemini-2.5-flash-image-preview',
          aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16',
          quality: imageQuality as 'high' | 'standard' | 'ultra'
        });
        imageResult = result.images[0] || '';
      }
      
      if (imageResult) {
        const newCharacter = {
          id: Date.now(),
          description: characterInput,
          image: imageResult,
          attachedImages: attachedCharacterImages,
          timestamp: new Date().toISOString(),
        };
        
        console.log('💾 나노 바나나 캐릭터 상태 업데이트:', newCharacter);
        setGeneratedCharacters(prev => [...prev, newCharacter]);
        
        setCharacterInput("");
        setAttachedCharacterImages([]);
      }
    } catch (error) {
      console.error('❌ 나노 바나나 캐릭터 생성 오류:', error);
    }
  };

  // 배경 생성
  const handleGenerateBackground = async () => {
    try {
      console.log('🍌 나노 바나나 배경 생성 시작:', { backgroundInput, attachedBackgroundImages });
      
      if (!nanoBananaService) {
        console.error('❌ 나노 바나나 서비스를 사용할 수 없습니다.');
        return;
      }
      
      // 프롬프트 구성
      let finalPrompt = backgroundInput;
      if (additionalPrompt.trim()) {
        finalPrompt = `${finalPrompt}\n\n추가 요청사항: ${additionalPrompt}`;
      }
      if (customSize.trim()) {
        finalPrompt = `${finalPrompt}\n\n사이즈 요청사항: ${customSize}`;
      }
      
      // 스타일과 품질 추가
      finalPrompt = `${finalPrompt}\n\n스타일: ${imageStyle}, 품질: ${imageQuality}, 비율: ${aspectRatio}`;
      
      console.log('🔄 최종 프롬프트:', finalPrompt);
      
      let imageResult;
      if (attachedBackgroundImages.length > 0) {
        // 이미지와 함께 생성
        imageResult = await nanoBananaService.generateImageWithReference(
          finalPrompt, 
          attachedBackgroundImages[0], 
          customSize
        );
      } else {
        // 텍스트만으로 생성
        const result = await nanoBananaService.generateImage({
          prompt: finalPrompt,
          provider: 'nano-banana',
          model: 'gemini-2.5-flash-image-preview',
          aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16',
          quality: imageQuality as 'high' | 'standard' | 'ultra'
        });
        imageResult = result.images[0] || '';
      }
      
      if (imageResult) {
        const newBackground = {
          id: Date.now(),
          description: backgroundInput,
          image: imageResult,
          attachedImages: attachedBackgroundImages,
          timestamp: new Date().toISOString(),
        };
        
        console.log('💾 나노 바나나 배경 상태 업데이트:', newBackground);
        setGeneratedBackgrounds(prev => [...prev, newBackground]);
        
        setBackgroundInput("");
        setAttachedBackgroundImages([]);
      }
    } catch (error) {
      console.error('❌ 나노 바나나 배경 생성 오류:', error);
    }
  };

  // 설정 컷 생성
  const handleGenerateSettingCut = async () => {
    try {
      console.log('🍌 나노 바나나 설정 컷 생성 시작:', { settingCut, attachedSettingImages });
      
      if (!nanoBananaService) {
        console.error('❌ 나노 바나나 서비스를 사용할 수 없습니다.');
        return;
      }
      
      // 프롬프트 구성
      let finalPrompt = settingCut;
      if (additionalPrompt.trim()) {
        finalPrompt = `${finalPrompt}\n\n추가 요청사항: ${additionalPrompt}`;
      }
      if (customSize.trim()) {
        finalPrompt = `${finalPrompt}\n\n사이즈 요청사항: ${customSize}`;
      }
      
      // 스타일과 품질 추가
      finalPrompt = `${finalPrompt}\n\n스타일: ${imageStyle}, 품질: ${imageQuality}, 비율: ${aspectRatio}`;
      
      console.log('🔄 최종 프롬프트:', finalPrompt);
      
      let imageResult;
      if (attachedSettingImages.length > 0) {
        // 이미지와 함께 생성
        imageResult = await nanoBananaService.generateImageWithReference(
          finalPrompt, 
          attachedSettingImages[0], 
          customSize
        );
      } else {
        // 텍스트만으로 생성
        const result = await nanoBananaService.generateImage({
          prompt: finalPrompt,
          provider: 'nano-banana',
          model: 'gemini-2.5-flash-image-preview',
          aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16',
          quality: imageQuality as 'high' | 'standard' | 'ultra'
        });
        imageResult = result.images[0] || '';
      }
      
      if (imageResult) {
        const newSettingCut = {
          id: Date.now(),
          description: settingCut,
          image: imageResult,
          attachedImages: attachedSettingImages,
          timestamp: new Date().toISOString(),
        };
        
        console.log('💾 나노 바나나 설정 컷 상태 업데이트:', newSettingCut);
        setGeneratedSettingCuts(prev => [...prev, newSettingCut]);
        
        setSettingCut("");
        setAttachedSettingImages([]);
      }
    } catch (error) {
      console.error('❌ 나노 바나나 설정 컷 생성 오류:', error);
    }
  };

  // 이미지 분석 함수
  const handleImageAnalysis = async () => {
    if (advancedImages.length === 0) {
      console.log('⚠️ 분석할 이미지가 없습니다.');
      return;
    }

    if (!nanoBananaService) {
      console.error('❌ 나노 바나나 서비스를 사용할 수 없습니다.');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('🔍 이미지 분석 시작...');
      
      const analysisResponse = await nanoBananaService!.analyzeImage(advancedImages[0]);
      
      console.log('📊 분석 응답 원본:', analysisResponse);
      console.log('📊 분석 응답 타입:', typeof analysisResponse);
      console.log('📊 분석 응답 길이:', analysisResponse?.length || 0);
      
      // 분석 결과를 상세하게 저장 (줄바꿈 처리)
      const rawAnalysis = analysisResponse || '분석 결과를 가져올 수 없습니다.';
      console.log('📝 원본 분석 텍스트:', rawAnalysis);
      
      // 분석 결과가 유효한지 확인
      if (rawAnalysis === '분석 결과를 가져올 수 없습니다.' || rawAnalysis.length < 10) {
        throw new Error('이미지 분석 결과가 유효하지 않습니다. 다시 시도해주세요.');
      }
      
      const formattedAnalysis = rawAnalysis
        .replace(/\n/g, '\n\n') // 단일 줄바꿈을 이중 줄바꿈으로 변경
        .replace(/\s+/g, ' ') // 연속된 공백을 단일 공백으로 변경
        .trim();
      
      const detailedResult = `이미지 분석이 완료되었습니다. 아래 분석 결과를 참고하여 프롬프트를 수정할 수 있습니다.

📊 상세 분석 결과:
${formattedAnalysis}

💡 프롬프트 작성 팁:
- 위 분석 결과의 키워드를 프롬프트에 포함시키세요
- 색상, 조명, 구도 등의 기술적 세부사항을 활용하세요
- 스타일과 분위기 키워드를 적극 활용하세요`;

      setImageAnalysisResult(detailedResult);
      setShowAnalysisResult(true);
      console.log('✅ 이미지 분석 완료');
    } catch (error) {
      console.error('❌ 이미지 분석 실패:', error);
      const errorResult = `이미지 분석에 실패했습니다. 원본 프롬프트를 사용하세요.

❌ 오류 정보:
${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}

💡 대안 방법:
- 첨부 이미지의 품질을 확인해주세요
- 다른 이미지로 다시 시도해보세요
- 텍스트 프롬프트만으로도 충분한 결과를 얻을 수 있습니다`;
      
      setImageAnalysisResult(errorResult);
      setShowAnalysisResult(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 고급 이미지 생성
  const handleAdvancedImageGeneration = async () => {
    try {
      console.log('🍌 고급 이미지 생성 시작:', { 
        advancedPrompt, 
        advancedImages: advancedImages.length,
        advancedStyle,
        advancedQuality,
        advancedAspectRatio,
        advancedCustomSize,
        advancedAdditionalPrompt
      });
      
      if (!nanoBananaService) {
        console.error('❌ 나노 바나나 서비스를 사용할 수 없습니다.');
        return;
      }
      
      // 프롬프트 구성
      let finalPrompt = advancedPrompt;
      
      // 이미지 분석 결과가 있으면 프롬프트에 반영
      if (imageAnalysisResult && imageAnalysisResult.length > 50) {
        console.log('📊 이미지 분석 결과를 프롬프트에 반영...');
        
        // 분석 결과에서 핵심 키워드 추출 (불필요한 텍스트 제거)
        const analysisKeywords = imageAnalysisResult
          .replace(/이미지 분석이 완료되었습니다\./g, '')
          .replace(/📊 상세 분석 결과:/g, '')
          .replace(/💡 프롬프트 작성 팁:.*$/g, '')
          .replace(/참고 이미지 분석 결과:/g, '')
          .replace(/\n+/g, ' ')
          .trim();
        
        if (analysisKeywords.length > 20) {
          finalPrompt = `${finalPrompt}\n\n${analysisKeywords}`;
          console.log('✅ 분석 결과 반영됨:', analysisKeywords.substring(0, 100) + '...');
        }
      }
      
      if (advancedAdditionalPrompt.trim()) {
        finalPrompt = `${finalPrompt}\n\n추가 요청사항: ${advancedAdditionalPrompt}`;
      }
      if (advancedCustomSize.trim()) {
        finalPrompt = `${finalPrompt}\n\n사이즈 요청사항: ${advancedCustomSize}`;
      }
      
      // 스타일과 품질 추가
      finalPrompt = `${finalPrompt}\n\n스타일: ${advancedStyle}, 품질: ${advancedQuality}, 비율: ${advancedAspectRatio}`;
      
      // 이미지 비율 정보를 최종 요약에 추가
      if (advancedImages.length > 0) {
        const imageInfo = advancedImages.map((img, index) => {
          return `이미지 ${index + 1}: ${img.name || '첨부파일'} (원본 비율 유지)`;
        }).join(', ');
        finalPrompt = `${finalPrompt}\n\n첨부 이미지: ${imageInfo}`;
      }
      
      console.log('🔄 고급 최종 프롬프트:', finalPrompt);
      
      let imageResult;
      
      if (advancedImages.length > 0) {
        // 이미지와 함께 생성
        console.log('🖼️ 첨부 이미지와 함께 이미지 생성 중...');
        imageResult = await nanoBananaService.generateImageWithReference(
          finalPrompt, 
          advancedImages[0], 
          advancedCustomSize
        );
      } else {
        // 텍스트만으로 생성
        const result = await nanoBananaService.generateImage({
          prompt: finalPrompt,
          provider: 'nano-banana',
          model: 'gemini-2.5-flash-image-preview',
          aspectRatio: advancedAspectRatio,
          quality: advancedQuality
        });
        imageResult = result.images[0] || '';
      }
      
      if (imageResult) {
        // 생성된 이미지를 상태에 저장
        setGeneratedAdvancedImage(imageResult);
        setEditablePrompt(finalPrompt);
        console.log('💾 고급 이미지 생성 완료:', imageResult);
        
        // 6단계로 이동 (이미지 확인 단계)
        setAdvancedStep(6);
      }
    } catch (error) {
      console.error('❌ 고급 이미지 생성 오류:', error);
    }
  };

  // 재생성 함수
  const handleRegenerateAdvancedImage = () => {
    setAdvancedStep(1); // 1단계로 돌아가기
  };

  // 다운로드 함수
  const handleDownloadAdvancedImage = () => {
    if (generatedAdvancedImage) {
      const link = document.createElement('a');
      link.href = generatedAdvancedImage;
      link.download = `advanced-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 완료 함수
  const handleCompleteAdvancedImage = () => {
    if (generatedAdvancedImage) {
      const newImage = {
        id: Date.now(),
        description: advancedPrompt,
        image: generatedAdvancedImage,
        attachedImages: advancedImages,
        timestamp: new Date().toISOString(),
      };
      
      console.log('💾 고급 이미지 최종 저장:', newImage);
      
      // 고급 이미지 항목에 추가
      setGeneratedAdvancedImages(prev => [...prev, newImage]);
      
      // 모달 닫기 및 상태 초기화
      setShowAdvancedModal(false);
      setAdvancedStep(1);
      setAdvancedPrompt('');
      setAdvancedImages([]);
      setGeneratedAdvancedImage('');
      // 고급 이미지 생성 완료
    }
  };

  return (
    <div className="space-y-6">
      {/* 나노 바나나 전용 헤더 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-4">
        <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <span className="text-xl">🍌</span>
          나노 바나나 이미지 생성
        </h3>
        <p className="text-sm text-yellow-700">
          Google Gemini 2.5 Flash Image Preview를 사용한 고급 이미지 생성
        </p>
        <div className="mt-3">
          <Button 
            onClick={() => setShowAdvancedModal(true)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            🎨 고급 이미지 생성
          </Button>
        </div>
      </div>

      {/* 고급 옵션 설정 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-800 mb-3">고급 옵션</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 이미지 스타일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이미지 스타일</label>
            <select
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="realistic">사실적 (Realistic)</option>
              <option value="cartoon">만화 (Cartoon)</option>
              <option value="anime">애니메이션 (Anime)</option>
              <option value="3d">3D 렌더링</option>
              <option value="watercolor">수채화</option>
              <option value="oil_painting">유화</option>
            </select>
          </div>

          {/* 이미지 품질 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이미지 품질</label>
            <select
              value={imageQuality}
              onChange={(e) => setImageQuality(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="high">고품질 (High)</option>
              <option value="medium">중품질 (Medium)</option>
              <option value="low">저품질 (Low)</option>
            </select>
          </div>

          {/* 화면 비율 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">화면 비율</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="1:1">정사각형 (1:1)</option>
              <option value="16:9">와이드 (16:9)</option>
              <option value="9:16">세로 (9:16)</option>
              <option value="4:3">표준 (4:3)</option>
              <option value="3:4">세로 표준 (3:4)</option>
            </select>
          </div>

          {/* 커스텀 사이즈 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">커스텀 사이즈</label>
            <input
              type="text"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              placeholder="예: 1920x1080, 4K, 세로형 등"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* 추가 프롬프트 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">추가 프롬프트</label>
          <textarea
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder="추가로 원하는 스타일이나 요구사항을 입력하세요"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* 캐릭터 생성 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">캐릭터 생성</h3>
        <textarea
          value={characterInput}
          onChange={(e) => setCharacterInput(e.target.value)}
          placeholder="캐릭터 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        
        <ImageUpload
          onImagesChange={setAttachedCharacterImages}
          attachedImages={attachedCharacterImages}
          maxImages={5}
          className="mt-3"
        />
        
        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" onClick={handleGenerateCharacter}>
          🍌 캐릭터 생성
        </Button>
      </div>
      
      {/* 배경 설정 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">배경 설정</h3>
        <textarea
          value={backgroundInput}
          onChange={(e) => setBackgroundInput(e.target.value)}
          placeholder="배경 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        
        <ImageUpload
          onImagesChange={setAttachedBackgroundImages}
          attachedImages={attachedBackgroundImages}
          maxImages={5}
          className="mt-3"
        />
        
        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" onClick={handleGenerateBackground}>
          🍌 배경 생성
        </Button>
      </div>
      
      {/* 설정 컷 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">설정 컷</h3>
        <textarea
          value={settingCut}
          onChange={(e) => setSettingCut(e.target.value)}
          placeholder="설정 컷 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        
        <ImageUpload
          onImagesChange={setAttachedSettingImages}
          attachedImages={attachedSettingImages}
          maxImages={5}
          className="mt-3"
        />
        
        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" onClick={handleGenerateSettingCut}>
          🍌 설정 컷 생성
        </Button>
      </div>

      {/* 다음 버튼 */}
      {(generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0) && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium mb-2">나노 바나나 이미지 생성 완료</h3>
              <p className="text-sm text-gray-600">
                생성된 항목: 캐릭터 {generatedCharacters.length}개, 
                배경 {generatedBackgrounds.length}개, 
                설정컷 {generatedSettingCuts.length}개
              </p>
              <p className="text-xs text-gray-500 mt-1">
                생성된 이미지는 오른쪽 본문에서 확인할 수 있습니다.
              </p>
            </div>
            <Button 
              onClick={onNext}
              className="bg-green-600 hover:bg-green-700"
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 고급 이미지 생성 모달 */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">🎨</span>
                  고급 이미지 생성
                </h2>
                <button
                  onClick={() => setShowAdvancedModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 단계별 진행 표시 */}
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= advancedStep 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      {step < 6 && (
                        <div className={`w-8 h-1 mx-2 ${
                          step < advancedStep ? 'bg-yellow-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center mt-2 text-sm text-gray-600">
                  {advancedStep === 1 && '프롬프트 입력'}
                  {advancedStep === 2 && '이미지 첨부'}
                  {advancedStep === 3 && '스타일 설정'}
                  {advancedStep === 4 && '고급 옵션'}
                  {advancedStep === 5 && '이미지 생성'}
                  {advancedStep === 6 && '이미지 확인'}
                </div>
              </div>

              {/* 단계별 콘텐츠 */}
              <div className="space-y-6">
                {/* 1단계: 프롬프트 입력 */}
                {advancedStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">1. 이미지 설명 입력</h3>
                    <textarea
                      value={advancedPrompt}
                      onChange={(e) => setAdvancedPrompt(e.target.value)}
                      placeholder="생성하고 싶은 이미지에 대해 자세히 설명해주세요..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setAdvancedStep(2)}
                        disabled={!advancedPrompt.trim()}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}

                {/* 2단계: 이미지 첨부 */}
                {advancedStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">2. 참고 이미지 첨부 (선택사항)</h3>
                    <ImageUpload
                      onImagesChange={setAdvancedImages}
                      attachedImages={advancedImages}
                      maxImages={3}
                    />
                    <div className="flex justify-between">
                      <Button
                        onClick={() => setAdvancedStep(1)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                      >
                        이전
                      </Button>
                      <Button
                        onClick={() => setAdvancedStep(3)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}

                {/* 3단계: 스타일 설정 */}
                {advancedStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">3. 이미지 스타일 설정</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">이미지 스타일</label>
                        <select
                          value={advancedStyle}
                          onChange={(e) => setAdvancedStyle(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="realistic">사실적 (Realistic)</option>
                          <option value="cartoon">만화 (Cartoon)</option>
                          <option value="anime">애니메이션 (Anime)</option>
                          <option value="3d">3D 렌더링</option>
                          <option value="watercolor">수채화</option>
                          <option value="oil_painting">유화</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">이미지 품질</label>
                        <select
                          value={advancedQuality}
                          onChange={(e) => setAdvancedQuality(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="high">고품질 (High)</option>
                          <option value="standard">중품질 (Standard)</option>
                          <option value="ultra">최고품질 (Ultra)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">화면 비율</label>
                        <select
                          value={advancedAspectRatio}
                          onChange={(e) => setAdvancedAspectRatio(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="1:1">정사각형 (1:1)</option>
                          <option value="16:9">와이드 (16:9)</option>
                          <option value="9:16">세로 (9:16)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        onClick={() => setAdvancedStep(2)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                      >
                        이전
                      </Button>
                      <Button
                        onClick={() => setAdvancedStep(4)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}

                {/* 4단계: 고급 옵션 */}
                {advancedStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">4. 고급 옵션 설정</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">커스텀 사이즈</label>
                        <input
                          type="text"
                          value={advancedCustomSize}
                          onChange={(e) => setAdvancedCustomSize(e.target.value)}
                          placeholder="예: 1920x1080, 4K, 세로형 등"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">추가 프롬프트</label>
                        <textarea
                          value={advancedAdditionalPrompt}
                          onChange={(e) => setAdvancedAdditionalPrompt(e.target.value)}
                          placeholder="추가로 원하는 스타일이나 요구사항을 입력하세요"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        onClick={() => setAdvancedStep(3)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                      >
                        이전
                      </Button>
                      <Button
                        onClick={() => setAdvancedStep(5)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}

                {/* 5단계: 이미지 생성 */}
                {advancedStep === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">5. 이미지 생성</h3>
                    
                    {/* 첨부된 이미지 미리보기 */}
                    {advancedImages.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-700 mb-3">📷 첨부된 이미지</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {advancedImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`첨부 이미지 ${index + 1}`}
                                className="w-full h-32 object-contain rounded-lg border border-gray-200 bg-white"
                                style={{ aspectRatio: 'auto' }}
                              />
                              <button
                                onClick={() => {
                                  const newImages = advancedImages.filter((_, i) => i !== index);
                                  setAdvancedImages(newImages);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 이미지 분석 버튼 (첨부 이미지가 있을 때만) */}
                    {advancedImages.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-700 mb-3">🔍 이미지 분석</h4>
                        <p className="text-sm text-blue-600 mb-3">
                          첨부된 이미지를 분석하여 프롬프트 작성에 도움을 받을 수 있습니다.
                        </p>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleImageAnalysis}
                            disabled={isAnalyzing}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg"
                          >
                            {isAnalyzing ? '🔄 분석 중...' : '🔍 이미지 분석하기'}
                          </Button>
                          {imageAnalysisResult && (
                            <Button
                              onClick={() => setShowAnalysisResult(!showAnalysisResult)}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                              {showAnalysisResult ? '📋 분석 결과 숨기기' : '📋 분석 결과 더보기'}
                            </Button>
                          )}
                        </div>
                        
                        {/* 분석 결과 표시 (더보기 클릭 시) */}
                        {showAnalysisResult && imageAnalysisResult && (
                          <div className="mt-4 bg-white rounded-lg border border-blue-200 overflow-hidden">
                            <div className="bg-blue-100 px-4 py-2 border-b border-blue-200">
                              <h5 className="font-medium text-blue-800 flex items-center gap-2">
                                <span className="text-lg">📊</span>
                                상세 분석 결과
                              </h5>
                            </div>
                            <div className="max-h-80 overflow-y-auto overflow-x-hidden p-4">
                              <div className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                {imageAnalysisResult}
                              </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span>💡</span>
                                분석 결과를 참고하여 아래 프롬프트를 수정하세요
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* 디버깅 정보 */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs max-h-32 overflow-y-auto">
                            <p><strong>디버깅:</strong> showAnalysisResult: {showAnalysisResult.toString()}</p>
                            <p><strong>분석 결과 길이:</strong> {imageAnalysisResult.length}</p>
                            <p><strong>분석 결과 미리보기:</strong> {imageAnalysisResult.substring(0, 200)}...</p>
                            <p><strong>상태 확인:</strong> 이미지 분석 결과가 정상적으로 표시되는지 확인하세요.</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 편집 가능한 프롬프트 */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-700 mb-2">✏️ 최종 프롬프트 (수정 가능)</h4>
                      <textarea
                        value={editablePrompt || advancedPrompt}
                        onChange={(e) => setEditablePrompt(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        placeholder="프롬프트를 수정할 수 있습니다..."
                      />
                      <p className="text-xs text-yellow-600 mt-1">
                        💡 위의 이미지 분석 결과를 참고하여 프롬프트를 수정할 수 있습니다.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">⚙️ 생성 설정 요약</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>스타일:</strong> {advancedStyle}</p>
                        <p><strong>품질:</strong> {advancedQuality}</p>
                        <p><strong>비율:</strong> {advancedAspectRatio}</p>
                        {advancedCustomSize && <p><strong>커스텀 사이즈:</strong> {advancedCustomSize}</p>}
                        {advancedImages.length > 0 && <p><strong>참고 이미지:</strong> {advancedImages.length}개</p>}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        onClick={() => setAdvancedStep(4)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                      >
                        이전
                      </Button>
                      <Button
                        onClick={handleAdvancedImageGeneration}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                      >
                        🍌 이미지 생성
                      </Button>
                    </div>
                  </div>
                )}

                {/* 6단계: 이미지 확인 */}
                {advancedStep === 6 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">6. 생성된 이미지 확인</h3>
                    
                    {/* 생성된 이미지 표시 */}
                    {generatedAdvancedImage && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-3">생성된 이미지</h4>
                        <div className="flex justify-center">
                          <img 
                            src={generatedAdvancedImage} 
                            alt="Generated Advanced Image"
                            className="max-w-full max-h-96 rounded-lg shadow-md"
                          />
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <p><strong>설명:</strong> {advancedPrompt}</p>
                          <p><strong>스타일:</strong> {advancedStyle} | <strong>품질:</strong> {advancedQuality} | <strong>비율:</strong> {advancedAspectRatio}</p>
                        </div>
                      </div>
                    )}

                    {/* 액션 버튼들 */}
                    <div className="flex justify-center space-x-4">
                      <Button
                        onClick={handleRegenerateAdvancedImage}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
                      >
                        🔄 재생성
                      </Button>
                      <Button
                        onClick={handleDownloadAdvancedImage}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                      >
                        💾 다운로드
                      </Button>
                      <Button
                        onClick={handleCompleteAdvancedImage}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                      >
                        ✅ 완료
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
