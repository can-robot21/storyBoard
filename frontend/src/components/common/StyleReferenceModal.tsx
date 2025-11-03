import React from 'react';
import { X } from 'lucide-react';

interface StyleReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StyleReferenceModal: React.FC<StyleReferenceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const styleExamples = {
    photorealistic: {
      title: "사실적 사진 스타일",
      description: "실제 사진과 같은 고품질 이미지 생성",
      examples: [
        "A photorealistic portrait of a young woman with curly hair, natural lighting, professional photography style",
        "High-resolution product photograph of a ceramic coffee mug on a white background, studio lighting",
        "Realistic landscape photo of a mountain range at sunset, golden hour lighting, wide-angle shot"
      ]
    },
    illustration: {
      title: "일러스트레이션",
      description: "예술적이고 창의적인 일러스트레이션 스타일",
      examples: [
        "Digital illustration of a fantasy character, detailed character design, vibrant colors",
        "Watercolor illustration of a peaceful garden scene, soft brushstrokes, pastel colors",
        "Vector illustration of a modern city skyline, clean lines, minimalist style"
      ]
    },
    sticker: {
      title: "스티커/아이콘",
      description: "투명 배경의 스티커나 아이콘 스타일",
      examples: [
        "A cute sticker of a happy red panda, kawaii style, transparent background",
        "Minimalist icon of a coffee cup, simple design, transparent background",
        "Fun sticker of a smiling sun with sunglasses, cartoon style, transparent background"
      ]
    },
    logo: {
      title: "로고/텍스트 렌더링",
      description: "텍스트가 포함된 로고나 디자인",
      examples: [
        "Modern minimalist logo for 'The Daily Grind' coffee shop, clean typography, solid background",
        "Creative logo design with the text 'Summerland' in bold font, poster style",
        "Professional logo for a tech company, geometric design, modern typography"
      ]
    },
    product: {
      title: "제품 모형",
      description: "전자상거래용 전문적인 제품 사진",
      examples: [
        "High-resolution product photograph of wireless headphones, studio lighting, white background",
        "Professional product shot of a smartphone, three-point lighting setup, clean composition",
        "E-commerce product photo of a leather handbag, premium lighting, neutral background"
      ]
    },
    minimalist: {
      title: "미니멀리스트",
      description: "단순하고 깔끔한 미니멀 디자인",
      examples: [
        "Minimalist composition featuring a single leaf in the bottom-right corner, vast empty white space",
        "Simple geometric shapes on a clean background, negative space design, monochrome palette",
        "Minimalist poster design with subtle typography, lots of white space, elegant composition"
      ]
    },
    comic: {
      title: "만화/스토리보드",
      description: "만화나 스토리보드 패널 스타일",
      examples: [
        "Single comic book panel in noir art style, dramatic lighting, dialogue box with text",
        "Manga-style illustration panel, dynamic action scene, speech bubble included",
        "Storyboard panel showing character interaction, cinematic composition, clear visual storytelling"
      ]
    },
    balanced: {
      title: "균형잡힌 스타일",
      description: "다양한 스타일의 균형을 맞춘 범용적 접근",
      examples: [
        "A balanced composition featuring both realistic elements and artistic interpretation",
        "Versatile image style that adapts to the content, maintaining visual harmony",
        "Well-composed image with good balance of detail and simplicity, universal appeal"
      ]
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">🎨 스타일별 참조 프롬프트 예시</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Gemini 2.5 Flash Image의 각 스타일별 프롬프트 예시입니다. 원하는 스타일에 맞는 프롬프트를 참조하여 사용하세요.
            </p>
          </div>
          
          <div className="space-y-6">
            {Object.entries(styleExamples).map(([key, style]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-800 mb-1">{style.title}</h3>
                  <p className="text-sm text-gray-600">{style.description}</p>
                </div>
                
                <div className="space-y-3">
                  {style.examples.map((example, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-gray-700 font-mono leading-relaxed">
                        "{example}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 프롬프트 작성 팁</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 구체적이고 상세한 설명을 사용하세요</li>
              <li>• 카메라 각도, 조명, 색상 등을 명시하세요</li>
              <li>• 스타일 키워드를 프롬프트에 포함하세요</li>
              <li>• 원하는 결과에 따라 프롬프트를 조정하세요</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
