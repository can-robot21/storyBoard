import React from 'react';

interface ImagenPromptSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImagenPromptSampleModal: React.FC<ImagenPromptSampleModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const promptCategories = [
    {
      title: "실사 사진",
      description: "사진 스타일의 사실적인 이미지",
      samples: [
        "주방의 목재 표면 위에 있는 커피 원두 사진",
        "주방 카운터에 있는 초콜릿 바 사진",
        "물을 배경으로 한 현대적인 건물 사진",
        "20대 여성의 클로즈업 사진, 거리 사진, 영화 스틸 컷, 차분하고 따뜻한 주황색 톤"
      ]
    },
    {
      title: "카메라 기법",
      description: "카메라 설정과 렌즈 효과",
      samples: [
        "커피 원두의 클로즈업 사진",
        "고층 빌딩이 있는 도시의 항공사진",
        "현대적인 안락의자의 스튜디오 사진, 자연광",
        "모션 블러 설정으로 차량 내부에서 찍은 초고층 빌딩이 있는 도시의 사진",
        "매크로 렌즈로 찍은 나뭇잎 사진",
        "어안 렌즈로 찍은 뉴욕 거리 사진"
      ]
    },
    {
      title: "아트 스타일",
      description: "다양한 예술적 표현 방식",
      samples: [
        "고층 빌딩 배경의 각진 스포티 전기 세단의 기술적 연필 드로잉",
        "고층 빌딩 배경의 각진 스포티 전기 세단의 목탄 드로잉",
        "고층 빌딩 배경의 각진 스포티 전기 세단의 색연필 드로잉",
        "고층 빌딩 배경의 각진 스포티 전기 세단의 파스텔 회화",
        "고층 빌딩 배경의 각진 스포티 전기 세단의 디지털 아트"
      ]
    },
    {
      title: "재료와 질감",
      description: "특별한 재료로 만든 이미지",
      samples: [
        "치즈로 만든 더플 백",
        "새 형태의 네온 튜브",
        "종이로 만든 안락의자, 스튜디오 사진, 종이접기 스타일"
      ]
    },
    {
      title: "역사적 아트 스타일",
      description: "특정 시대의 예술 운동",
      samples: [
        "인상주의 회화 스타일의 이미지 생성: 풍력 발전소",
        "르네상스 회화 스타일의 이미지 생성: 풍력 발전소",
        "팝아트 스타일의 이미지 생성: 풍력 발전소"
      ]
    },
    {
      title: "품질 수정자",
      description: "고품질 이미지를 위한 키워드",
      samples: [
        "전문 사진작가가 촬영한 옥수수대의 아름다운 4K HDR 사진",
        "고품질, 아름다운 스타일의 현대적 건물",
        "전문가 수준의 상세한 일러스트레이션"
      ]
    },
    {
      title: "텍스트 포함 이미지",
      description: "이미지에 텍스트가 포함된 예시",
      samples: [
        "'Summerland'라는 텍스트가 굵은 서체로 제목으로 표시된 포스터이며 이 텍스트 아래에 'Summer never felt so good'이라는 슬로건이 있습니다"
      ]
    },
    {
      title: "로고 디자인",
      description: "비즈니스 로고 생성",
      samples: [
        "A minimalist logo for a health care company on a solid color background. Include the text Journey.",
        "A modern logo for a software company on a solid color background. Include the text Silo.",
        "A traditional logo for a baking company on a solid color background. Include the text Seed."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">🎨 Imagen 프롬프트 샘플</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          {promptCategories.map((category, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {category.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {category.description}
              </p>
              <div className="space-y-2">
                {category.samples.map((sample, sampleIndex) => (
                  <div
                    key={sampleIndex}
                    className="bg-gray-50 p-3 rounded border text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(sample);
                      // 간단한 피드백 (실제로는 토스트나 알림을 사용하는 것이 좋음)
                      alert('프롬프트가 클립보드에 복사되었습니다!');
                    }}
                  >
                    {sample}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💡 프롬프트 작성 팁</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 최대 프롬프트 길이는 토큰 480개입니다</li>
            <li>• 주제, 컨텍스트, 스타일을 명확히 구분하여 작성하세요</li>
            <li>• 설명적인 언어와 구체적인 키워드를 사용하세요</li>
            <li>• 텍스트를 포함할 때는 25자(영문 기준) 이하로 제한하세요</li>
            <li>• 샘플을 클릭하면 클립보드에 복사됩니다</li>
          </ul>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
