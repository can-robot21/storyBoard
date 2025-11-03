import React, { useState, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Download, Trash2, Plus, Edit3 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { GoogleAIService } from '../../services/googleAIService';

interface Frame {
  id: string;
  prompt: string;
  image?: string;
  videoUrl?: string;
  duration: number;
  order: number;
}

interface FrameByFrameVideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const FrameByFrameVideoGenerator: React.FC<FrameByFrameVideoGeneratorProps> = ({
  onVideoGenerated
}) => {
  const { addNotification } = useUIStore();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingFrame, setEditingFrame] = useState<string | null>(null);
  const [newFramePrompt, setNewFramePrompt] = useState('');
  const [newFrameDuration, setNewFrameDuration] = useState(3);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 프레임 추가
  const addFrame = useCallback(() => {
    if (!newFramePrompt.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '프레임 설명을 입력해주세요.'
      });
      return;
    }

    const newFrame: Frame = {
      id: `frame_${Date.now()}`,
      prompt: newFramePrompt,
      duration: newFrameDuration,
      order: frames.length
    };

    setFrames(prev => [...prev, newFrame]);
    setNewFramePrompt('');
    setNewFrameDuration(3);
    
    addNotification({
      type: 'success',
      title: '프레임 추가',
      message: '새 프레임이 추가되었습니다.'
    });
  }, [newFramePrompt, newFrameDuration, frames.length, addNotification]);

  // 프레임 삭제
  const deleteFrame = useCallback((frameId: string) => {
    setFrames(prev => {
      const newFrames = prev.filter(frame => frame.id !== frameId);
      // 순서 재정렬
      return newFrames.map((frame, index) => ({
        ...frame,
        order: index
      }));
    });
    
    if (currentFrameIndex >= frames.length - 1) {
      setCurrentFrameIndex(Math.max(0, frames.length - 2));
    }
    
    addNotification({
      type: 'success',
      title: '프레임 삭제',
      message: '프레임이 삭제되었습니다.'
    });
  }, [frames.length, currentFrameIndex, addNotification]);

  // 프레임 편집
  const editFrame = useCallback((frameId: string, newPrompt: string, newDuration: number) => {
    setFrames(prev => prev.map(frame => 
      frame.id === frameId 
        ? { ...frame, prompt: newPrompt, duration: newDuration }
        : frame
    ));
    setEditingFrame(null);
    
    addNotification({
      type: 'success',
      title: '프레임 수정',
      message: '프레임이 수정되었습니다.'
    });
  }, [addNotification]);

  // 프레임 순서 변경
  const moveFrame = useCallback((frameId: string, direction: 'up' | 'down') => {
    setFrames(prev => {
      const frameIndex = prev.findIndex(frame => frame.id === frameId);
      if (frameIndex === -1) return prev;
      
      const newFrames = [...prev];
      const targetIndex = direction === 'up' ? frameIndex - 1 : frameIndex + 1;
      
      if (targetIndex >= 0 && targetIndex < newFrames.length) {
        [newFrames[frameIndex], newFrames[targetIndex]] = [newFrames[targetIndex], newFrames[frameIndex]];
        
        // 순서 재정렬
        return newFrames.map((frame, index) => ({
          ...frame,
          order: index
        }));
      }
      
      return prev;
    });
  }, []);

  // 영상 생성
  const generateVideo = useCallback(async () => {
    if (frames.length === 0) {
      addNotification({
        type: 'error',
        title: '프레임 없음',
        message: '최소 하나의 프레임이 필요합니다.'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const googleAI = GoogleAIService.getInstance();
      
      // 각 프레임별로 영상 생성
      const generatedFrames = [];
      
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        
        addNotification({
          type: 'info',
          title: '영상 생성 중',
          message: `프레임 ${i + 1}/${frames.length} 생성 중...`
        });

        try {
          const result = await googleAI.generateVideo({
            prompt: frame.prompt,
            ratio: '16:9',
            model: 'veo-3.0-generate-001',
            duration: frame.duration.toString(),
            referenceImages: frame.image ? [frame.image] : undefined
          });

          generatedFrames.push({
            ...frame,
            videoUrl: result.videoUrl
          });

          // 프레임 업데이트
          setFrames(prev => prev.map(f => 
            f.id === frame.id 
              ? { ...f, videoUrl: result.videoUrl }
              : f
          ));

        } catch (error) {
          console.error(`프레임 ${i + 1} 생성 오류:`, error);
          addNotification({
            type: 'error',
            title: '프레임 생성 실패',
            message: `프레임 ${i + 1} 생성에 실패했습니다.`
          });
        }
      }

      // 최종 영상 URL 생성 (첫 번째 프레임의 영상 URL 사용)
      if (generatedFrames.length > 0 && generatedFrames[0].videoUrl) {
        onVideoGenerated?.(generatedFrames[0].videoUrl);
        
        addNotification({
          type: 'success',
          title: '영상 생성 완료',
          message: '모든 프레임이 성공적으로 생성되었습니다.'
        });
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
    }
  }, [frames, addNotification, onVideoGenerated]);

  // 프레임 재생
  const playFrames = useCallback(() => {
    if (frames.length === 0) return;
    
    setIsPlaying(true);
    let currentIndex = 0;
    
    const playNextFrame = () => {
      if (currentIndex >= frames.length) {
        setIsPlaying(false);
        return;
      }
      
      setCurrentFrameIndex(currentIndex);
      currentIndex++;
      
      intervalRef.current = setTimeout(playNextFrame, frames[currentIndex - 1]?.duration * 1000 || 3000);
    };
    
    playNextFrame();
  }, [frames]);

  const pauseFrames = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
  }, []);

  const nextFrame = useCallback(() => {
    setCurrentFrameIndex(prev => Math.min(prev + 1, frames.length - 1));
  }, [frames.length]);

  const prevFrame = useCallback(() => {
    setCurrentFrameIndex(prev => Math.max(prev - 1, 0));
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">프레임별 영상 생성</h2>
        
        {/* 프레임 추가 폼 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">새 프레임 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프레임 설명
              </label>
              <input
                type="text"
                value={newFramePrompt}
                onChange={(e) => setNewFramePrompt(e.target.value)}
                placeholder="프레임의 내용을 설명해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지속 시간 (초)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={newFrameDuration}
                onChange={(e) => setNewFrameDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={addFrame}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            프레임 추가
          </button>
        </div>

        {/* 프레임 목록 */}
        {frames.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">프레임 목록</h3>
            <div className="space-y-3">
              {frames.map((frame, index) => (
                <div
                  key={frame.id}
                  className={`p-4 border rounded-lg ${
                    index === currentFrameIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          프레임 {index + 1}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({frame.duration}초)
                        </span>
                      </div>
                      <p className="text-gray-800">{frame.prompt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveFrame(frame.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFrame(frame.id, 'down')}
                        disabled={index === frames.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingFrame(frame.id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFrame(frame.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 재생 컨트롤 */}
        {frames.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">프레임 재생</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={prevFrame}
                disabled={currentFrameIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={isPlaying ? pauseFrames : playFrames}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={nextFrame}
                disabled={currentFrameIndex === frames.length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                {currentFrameIndex + 1} / {frames.length}
              </span>
            </div>
          </div>
        )}

        {/* 영상 생성 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={generateVideo}
            disabled={isGenerating || frames.length === 0}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                영상 생성 중...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                영상 생성
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameByFrameVideoGenerator;
