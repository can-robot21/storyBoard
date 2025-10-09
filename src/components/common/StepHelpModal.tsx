import React from 'react';
import { X, HelpCircle, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';

interface StepHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: string;
}

interface StepGuide {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    tips?: string[];
  }[];
  requirements: string[];
  tips: string[];
}

const stepGuides: Record<string, StepGuide> = {
  "프로젝트 개요": {
    title: "프로젝트 개요 설정",
    description: "스토리보드 제작을 위한 기본 설정을 진행합니다.",
    steps: [
      {
        title: "1. 스토리 입력",
        description: "만들고자 하는 영상의 기본 스토리를 입력하세요.",
        tips: [
          "구체적인 상황과 배경을 포함하세요",
          "주인공과 주요 사건을 명확히 하세요",
          "100-300자 정도가 적당합니다"
        ]
      },
      {
        title: "2. 캐릭터 설정",
        description: "등장인물들의 특징과 역할을 정의하세요.",
        tips: [
          "외모, 성격, 역할을 구체적으로 기술하세요",
          "캐릭터 간의 관계도 포함하면 좋습니다"
        ]
      },
      {
        title: "3. 시나리오 생성",
        description: "AI가 스토리와 캐릭터를 바탕으로 시나리오를 생성합니다.",
        tips: [
          "생성된 시나리오를 검토하고 수정하세요",
          "필요시 재생성할 수 있습니다"
        ]
      },
      {
        title: "4. AI 검토 및 JSON 카드 생성",
        description: "시나리오를 AI가 검토하고 구조화된 카드로 변환합니다."
      }
    ],
    requirements: [
      "스토리 텍스트 입력 (필수)",
      "최소 1개 이상의 캐릭터 설정 (필수)",
      "AI 서비스 설정 완료 (필수)"
    ],
    tips: [
      "명확하고 구체적인 스토리일수록 좋은 결과를 얻을 수 있습니다",
      "캐릭터 설명이 자세할수록 일관성 있는 이미지를 생성할 수 있습니다",
      "프롬프트 길이를 조정하여 원하는 수준의 세부사항을 얻으세요"
    ]
  },
  "이미지 생성": {
    title: "이미지 생성",
    description: "프로젝트에 필요한 캐릭터, 배경, 설정컷 이미지를 생성합니다.",
    steps: [
      {
        title: "1. 캐릭터 이미지 생성",
        description: "설정한 캐릭터들의 이미지를 생성합니다.",
        tips: [
          "일관된 스타일을 위해 일괄 생성을 권장합니다",
          "마음에 들지 않는 이미지는 개별 재생성 가능합니다"
        ]
      },
      {
        title: "2. 배경 이미지 생성",
        description: "스토리의 배경이 되는 환경 이미지를 생성합니다.",
        tips: [
          "시간대, 날씨, 분위기를 구체적으로 설정하세요",
          "캐릭터와 어울리는 스타일로 생성하세요"
        ]
      },
      {
        title: "3. 설정컷 생성",
        description: "특정 장면이나 소품의 이미지를 생성합니다.",
        tips: [
          "스토리의 핵심 요소들을 중심으로 생성하세요",
          "근접 촬영이나 세부 묘사가 필요한 요소들을 포함하세요"
        ]
      }
    ],
    requirements: [
      "프로젝트 개요 단계 완료 (필수)",
      "생성된 프로젝트 데이터 존재 (필수)",
      "AI 이미지 생성 서비스 활성화 (필수)"
    ],
    tips: [
      "이미지 품질과 비율을 미리 설정하세요",
      "일괄 생성을 통해 시간을 절약할 수 있습니다",
      "생성된 이미지는 다음 단계에서 영상 생성에 활용됩니다"
    ]
  },
  "이미지 생성/나노 바나나": {
    title: "나노 바나나 이미지 생성",
    description: "Nano Banana 서비스를 통해 고품질 이미지를 생성합니다.",
    steps: [
      {
        title: "1. 프롬프트 최적화",
        description: "Nano Banana에 맞는 프롬프트로 최적화합니다.",
        tips: [
          "영어 프롬프트가 더 좋은 결과를 제공할 수 있습니다",
          "스타일 키워드를 활용하세요"
        ]
      },
      {
        title: "2. 고품질 이미지 생성",
        description: "향상된 품질의 이미지를 생성합니다.",
        tips: [
          "생성 시간이 더 오래 걸릴 수 있습니다",
          "결과물의 품질은 더 뛰어납니다"
        ]
      }
    ],
    requirements: [
      "Nano Banana API 키 설정 (필수)",
      "프로젝트 데이터 존재 (필수)"
    ],
    tips: [
      "Google AI 생성 결과와 비교해보세요",
      "특별한 품질이 필요한 이미지에 활용하세요"
    ]
  },
  "영상 생성": {
    title: "영상 생성",
    description: "생성된 이미지들을 바탕으로 최종 영상을 제작합니다.",
    steps: [
      {
        title: "1. 텍스트 카드 생성",
        description: "각 씬별로 영상 생성을 위한 텍스트 카드를 만듭니다.",
        tips: [
          "씬의 내용과 분위기를 구체적으로 기술하세요",
          "카메라 움직임이나 연출 방향을 포함하세요"
        ]
      },
      {
        title: "2. 캐릭터 이미지 준비",
        description: "영상에 사용할 캐릭터 이미지들을 선택하고 준비합니다.",
        tips: [
          "씬에 맞는 캐릭터 표정이나 포즈를 선택하세요",
          "여러 캐릭터가 등장하는 경우 모두 준비하세요"
        ]
      },
      {
        title: "3. 배경 영상 생성",
        description: "동적인 배경이나 환경 영상을 생성합니다.",
        tips: [
          "캐릭터와 조화를 이루는 배경을 선택하세요",
          "영상의 전체적인 톤을 고려하세요"
        ]
      },
      {
        title: "4. 최종 영상 합성",
        description: "모든 요소를 조합하여 최종 영상을 생성합니다.",
        tips: [
          "품질과 길이 설정을 확인하세요",
          "여러 씬을 선택하여 연속된 영상을 만들 수 있습니다"
        ]
      }
    ],
    requirements: [
      "이미지 생성 단계 완료 (필수)",
      "최소 1개 이상의 생성된 이미지 (필수)",
      "영상 생성 서비스 활성화 (필수)"
    ],
    tips: [
      "영상 품질과 길이를 미리 설정하세요",
      "선택한 요소들이 서로 조화를 이루는지 확인하세요",
      "생성 시간이 오래 걸릴 수 있으니 인내심을 가지세요"
    ]
  }
};

export const StepHelpModal: React.FC<StepHelpModalProps> = ({
  isOpen,
  onClose,
  currentStep
}) => {
  if (!isOpen) return null;

  const guide = stepGuides[currentStep];

  if (!guide) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">{guide.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 설명 */}
          <p className="text-gray-600 mb-6">{guide.description}</p>

          {/* 단계별 가이드 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              진행 단계
            </h3>
            <div className="space-y-4">
              {guide.steps.map((step, index) => (
                <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{step.title}</h4>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    {step.tips && (
                      <div className="space-y-1">
                        {step.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="flex items-start gap-2 text-sm text-gray-500">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 요구사항 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              요구사항
            </h3>
            <div className="space-y-2">
              {guide.requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 팁 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              유용한 팁
            </h3>
            <div className="space-y-2">
              {guide.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 text-gray-700">
                  <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};