/**
 * 단계별 상태 타입 정의
 * ImprovedMainLayout에서 사용하는 stepStatus의 타입 정의
 */

export interface StepStatus {
  // 프로젝트 개요 관련
  scenarioGenerated: boolean;
  aiReviewCompleted: boolean;
  jsonCardsGenerated: boolean;
  koreanCardDraftGenerated?: boolean; // projectOverview에서 사용
  projectOverviewSaved: boolean;
  
  // 이미지 생성 관련 (선택적)
  imagesGenerated?: boolean;
  charactersGenerated?: boolean;
  backgroundsGenerated?: boolean;
  settingCutsGenerated?: boolean;
  
  // 영상 생성 관련 (선택적)
  videosGenerated?: boolean;
  textCardsGenerated?: boolean;
}

