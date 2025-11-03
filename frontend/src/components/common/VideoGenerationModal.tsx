import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, Image, Video, Play, Pause, SkipForward, SkipBack, Download, Plus, Trash2, Edit3, Zap, Camera, Layers, Expand } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { GoogleAIService } from '../../services/googleAIService';

interface VideoGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoGenerated?: (videoUrl: string) => void;
  generatedImages?: Array<{ id: string; url: string; prompt: string }>;
}

type GenerationMode = 'text-to-video' | 'image-to-video' | 'frame-interpolation' | 'image-reference' | 'video-extension';
type VeoModel = 'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.0-generate-001' | 'veo-3.0-fast-generate-001';

interface Frame {
  id: string;
  prompt: string;
  image?: string;
  duration: number;
  order: number;
}

const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({
  isOpen,
  onClose,
  onVideoGenerated,
  generatedImages = []
}) => {
  const { addNotification } = useUIStore();
  
  // 모달 상태
  const [generationMode, setGenerationMode] = useState<GenerationMode>('text-to-video');
  const [veoModel, setVeoModel] = useState<VeoModel>('veo-3.1-generate-preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  
  // 공통 설정
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState('8');
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  
  // 이미지-영상 변환
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  // 프레임 보간
  const [firstFrame, setFirstFrame] = useState<string>('');
  const [lastFrame, setLastFrame] = useState<string>('');
  
  // 이미지 참조 영상
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  
  // 영상 확장
  const [extensionVideo, setExtensionVideo] = useState<string>('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 모달 닫기
  const handleClose = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
    onClose();
  }, [onClose]);

  // Veo 모델별 기능 지원 여부 확인
  const getSupportedFeatures = useCallback((model: VeoModel) => {
    const features = {
      'veo-3.1-generate-preview': {
        audio: true,
        imageToVideo: true,
        frameInterpolation: true,
        imageReference: true,
        videoExtension: true,
        resolutions: ['720p', '1080p'],
        durations: ['4', '6', '8'],
        ratios: ['16:9', '9:16']
      },
      'veo-3.1-fast-generate-preview': {
        audio: true,
        imageToVideo: true,
        frameInterpolation: true,
        imageReference: true,
        videoExtension: true,
        resolutions: ['720p', '1080p'],
        durations: ['4', '6', '8'],
        ratios: ['16:9', '9:16']
      },
      'veo-3.0-generate-001': {
        audio: true,
        imageToVideo: true,
        frameInterpolation: false,
        imageReference: false,
        videoExtension: false,
        resolutions: ['720p', '1080p'],
        durations: ['4', '6', '8'],
        ratios: ['16:9', '9:16']
      },
      'veo-3.0-fast-generate-001': {
        audio: true,
        imageToVideo: true,
        frameInterpolation: false,
        imageReference: false,
        videoExtension: false,
        resolutions: ['720p', '1080p'],
        durations: ['4', '6', '8'],
        ratios: ['16:9', '9:16']
      }
    };
    return features[model];
  }, []);

  // 모델 변경 시 지원되지 않는 기능 비활성화
  const handleModelChange = useCallback((model: VeoModel) => {
    setVeoModel(model);
    const features = getSupportedFeatures(model);
    
    if (!features.imageReference && generationMode === 'image-reference') {
      setGenerationMode('text-to-video');
    }
    if (!features.frameInterpolation && generationMode === 'frame-interpolation') {
      setGenerationMode('text-to-video');
    }
    if (!features.videoExtension && generationMode === 'video-extension') {
      setGenerationMode('text-to-video');
    }
  }, [generationMode, getSupportedFeatures]);

  // 영상 생성
  const generateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      addNotification({
        type: 'error',
        title: '프롬프트 필요',
        message: '영상 설명을 입력해주세요.'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const googleAI = GoogleAIService.getInstance();
      const features = getSupportedFeatures(veoModel);
      let result: { videoUrl: string; thumbnail?: string; duration?: string } | null = null;

      switch (generationMode) {
        case 'text-to-video':
          setGenerationProgress('텍스트로 영상 생성 중...');
          result = await googleAI.generateVideo({
            prompt: prompt,
            ratio: videoRatio,
            model: veoModel,
            duration: videoDuration,
            negativePrompt: negativePrompt || undefined
          });
          break;

        case 'image-to-video':
          if (!selectedImage) {
            addNotification({
              type: 'error',
              title: '이미지 선택 필요',
              message: '변환할 이미지를 선택해주세요.'
            });
            return;
          }
          
          setGenerationProgress('이미지를 영상으로 변환 중...');
          result = await googleAI.generateVideo({
            prompt: prompt,
            ratio: videoRatio,
            model: veoModel,
            duration: videoDuration,
            referenceImages: [selectedImage],
            negativePrompt: negativePrompt || undefined
          });
          break;

        case 'frame-interpolation':
          if (!firstFrame || !lastFrame) {
            addNotification({
              type: 'error',
              title: '프레임 필요',
              message: '첫 번째와 마지막 프레임을 모두 선택해주세요.'
            });
            return;
          }
          
          setGenerationProgress('프레임 보간으로 영상 생성 중...');
          result = await googleAI.generateVideo({
            prompt: prompt,
            ratio: videoRatio,
            model: veoModel,
            duration: videoDuration,
            referenceImages: [firstFrame],
            lastFrame: lastFrame,
            negativePrompt: negativePrompt || undefined
          });
          break;

        case 'image-reference':
          if (referenceImages.length === 0) {
            addNotification({
              type: 'error',
              title: '참조 이미지 필요',
              message: '참조할 이미지를 선택해주세요.'
            });
            return;
          }
          
          setGenerationProgress('참조 이미지 기반 영상 생성 중...');
          result = await googleAI.generateVideo({
            prompt: prompt,
            ratio: videoRatio,
            model: veoModel,
            duration: '8', // 참조 이미지는 8초만 지원
            referenceImages: referenceImages,
            negativePrompt: negativePrompt || undefined
          });
          break;

        case 'video-extension':
          if (!extensionVideo) {
            addNotification({
              type: 'error',
              title: '확장할 영상 필요',
              message: '확장할 영상을 업로드해주세요.'
            });
            return;
          }
          
          setGenerationProgress('영상 확장 중...');
          result = await googleAI.generateVideo({
            prompt: prompt,
            ratio: videoRatio,
            model: veoModel,
            duration: videoDuration,
            referenceImages: [extensionVideo],
            negativePrompt: negativePrompt || undefined
          });
          break;
      }

      if (result?.videoUrl) {
        onVideoGenerated?.(result.videoUrl);
        
        addNotification({
          type: 'success',
          title: '영상 생성 완료',
          message: '영상이 성공적으로 생성되었습니다.'
        });
        
        handleClose();
      }

    } catch (error) {
      console.error('영상 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '영상 생성 실패',
        message: '영상 생성 중 오류가 발생했습니다.'
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  }, [
    prompt,
    negativePrompt,
    generationMode,
    selectedImage,
    firstFrame,
    lastFrame,
    referenceImages,
    extensionVideo,
    videoDuration,
    videoRatio,
    veoModel,
    getSupportedFeatures,
    addNotification,
    onVideoGenerated,
    handleClose
  ]);

  if (!isOpen) return null;

  const features = getSupportedFeatures(veoModel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎬 Veo 영상 생성</h2>
            <p className="text-sm text-gray-600 mt-1">
              Veo 3.0/3.1 모델로 고품질 영상을 생성합니다
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Veo 모델 선택 */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Veo 모델 선택</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleModelChange('veo-3.1-generate-preview')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                veoModel === 'veo-3.1-generate-preview'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Veo 3.1</div>
              <div className="text-xs text-gray-500 mt-1">최신 기능</div>
              <div className="text-xs text-gray-500">오디오 포함</div>
            </button>
            <button
              onClick={() => handleModelChange('veo-3.1-fast-generate-preview')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                veoModel === 'veo-3.1-fast-generate-preview'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Veo 3.1 Fast</div>
              <div className="text-xs text-gray-500 mt-1">빠른 생성</div>
              <div className="text-xs text-gray-500">오디오 포함</div>
            </button>
            <button
              onClick={() => handleModelChange('veo-3.0-generate-001')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                veoModel === 'veo-3.0-generate-001'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Veo 3.0</div>
              <div className="text-xs text-gray-500 mt-1">안정화</div>
              <div className="text-xs text-gray-500">오디오 포함</div>
            </button>
            <button
              onClick={() => handleModelChange('veo-3.0-fast-generate-001')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                veoModel === 'veo-3.0-fast-generate-001'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Veo 3.0 Fast</div>
              <div className="text-xs text-gray-500 mt-1">빠른 생성</div>
              <div className="text-xs text-gray-500">오디오 포함</div>
            </button>
          </div>
        </div>

        {/* 생성 모드 선택 */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">생성 모드</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={() => setGenerationMode('text-to-video')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                generationMode === 'text-to-video'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Video className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">텍스트→영상</div>
            </button>
            <button
              onClick={() => setGenerationMode('image-to-video')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                generationMode === 'image-to-video'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">이미지→영상</div>
            </button>
            <button
              onClick={() => setGenerationMode('frame-interpolation')}
              disabled={!features.frameInterpolation}
              className={`p-3 rounded-lg border-2 transition-colors ${
                generationMode === 'frame-interpolation'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : features.frameInterpolation
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Camera className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">프레임 보간</div>
              {!features.frameInterpolation && (
                <div className="text-xs text-gray-400">Veo 3.1만 지원</div>
              )}
            </button>
            <button
              onClick={() => setGenerationMode('image-reference')}
              disabled={!features.imageReference}
              className={`p-3 rounded-lg border-2 transition-colors ${
                generationMode === 'image-reference'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : features.imageReference
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Layers className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">이미지 참조</div>
              {!features.imageReference && (
                <div className="text-xs text-gray-400">Veo 3.1만 지원</div>
              )}
            </button>
            <button
              onClick={() => setGenerationMode('video-extension')}
              disabled={!features.videoExtension}
              className={`p-3 rounded-lg border-2 transition-colors ${
                generationMode === 'video-extension'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : features.videoExtension
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Expand className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">영상 확장</div>
              {!features.videoExtension && (
                <div className="text-xs text-gray-400">Veo 3.1만 지원</div>
              )}
            </button>
          </div>
        </div>

        {/* 공통 설정 */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">영상 설정</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                영상 비율
              </label>
              <select
                value={videoRatio}
                onChange={(e) => setVideoRatio(e.target.value as '16:9' | '9:16')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="16:9">16:9 (가로)</option>
                <option value="9:16">9:16 (세로)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                해상도
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="720p">720p</option>
                {features.resolutions.includes('1080p') && (
                  <option value="1080p">1080p (8초만 지원)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                영상 길이 (초)
              </label>
              <select
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {features.durations.map(duration => (
                  <option key={duration} value={duration}>{duration}초</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 프롬프트 입력 */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">영상 설명</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                영상 프롬프트 *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="생성할 영상의 내용을 자세히 설명해주세요..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부정 프롬프트 (선택사항)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="포함하지 않을 내용을 설명해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 모드별 설정 */}
        <div className="p-6">
          {generationMode === 'image-to-video' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">이미지 선택</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {generatedImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(image.url)}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      selectedImage === image.url
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-20 object-cover rounded"
                    />
                    <p className="text-xs mt-1 truncate">{image.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {generationMode === 'frame-interpolation' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">프레임 보간 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    첫 번째 프레임
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {generatedImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setFirstFrame(image.url)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          firstFrame === image.url
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-16 object-cover rounded"
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    마지막 프레임
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {generatedImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setLastFrame(image.url)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          lastFrame === image.url
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-16 object-cover rounded"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {generationMode === 'image-reference' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">참조 이미지 선택 (최대 3개)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {generatedImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      setReferenceImages(prev => 
                        prev.includes(image.url)
                          ? prev.filter(url => url !== image.url)
                          : prev.length < 3 ? [...prev, image.url] : prev
                      );
                    }}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      referenceImages.includes(image.url)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-20 object-cover rounded"
                    />
                    <p className="text-xs mt-1 truncate">{image.prompt}</p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                선택된 참조 이미지: {referenceImages.length}/3
              </p>
            </div>
          )}

          {generationMode === 'video-extension' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">영상 확장</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Veo로 생성된 영상 파일을 업로드하세요</p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setExtensionVideo(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* 생성 버튼 */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {generationProgress && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    {generationProgress}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={generateVideo}
                disabled={isGenerating}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    생성 중...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    영상 생성
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationModal;