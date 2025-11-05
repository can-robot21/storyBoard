import React from 'react';
import {
  HelpCircle,
  FileText,
  Wrench,
  Film,
} from 'lucide-react';
import Button from '../common/Button';

interface ActionPanelProps {
  currentStep: string;
  onHelpClick?: () => void;
  onProjectReferenceClick?: () => void;
  onManagementToolsClick?: () => void;
  onStoryboardGeneratorClick?: () => void;
  // 단계별 액션 핸들러들
  projectHandlers?: any;
  imageHandlers?: any;
  videoHandlers?: any;
  // 상태 정보
  stepStatus?: any;
  canProceedToNext?: boolean;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  currentStep,
  onHelpClick,
  onProjectReferenceClick,
  onManagementToolsClick,
  onStoryboardGeneratorClick,
  projectHandlers,
  imageHandlers,
  videoHandlers,
  stepStatus,
  canProceedToNext = false,
  isAdmin = false,
  isLoggedIn = false
}) => {
  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* 메인 버튼 영역 */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-center">
          {/* 핵심 도구 버튼들만 중앙에 배치 */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onHelpClick}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <HelpCircle className="w-5 h-5" />
              도움말
            </Button>

            <Button
              onClick={onProjectReferenceClick}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              프로젝트 참조
            </Button>

            <Button
              onClick={onManagementToolsClick}
              variant="outline"
              size="lg"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Wrench className="w-5 h-5" />
              관리 도구
            </Button>

            {/* 스토리보드 생성 버튼 - 로그인 상관없이 항상 표시 */}
            {onStoryboardGeneratorClick && (
              <Button
                onClick={onStoryboardGeneratorClick}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
              >
                <Film className="w-5 h-5" />
                스토리보드 생성
              </Button>
            )}

            {/* 내보내기 버튼 제거 */}
          </div>
        </div>
      </div>
    </div>
  );
};