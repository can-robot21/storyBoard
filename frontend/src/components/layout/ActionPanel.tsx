import React from 'react';
import {
  Settings,
  HelpCircle,
  FileText,
  Download,
  Wrench
} from 'lucide-react';
import Button from '../common/Button';

interface ActionPanelProps {
  currentStep: string;
  onHelpClick?: () => void;
  onProjectReferenceClick?: () => void;
  onExportClick?: () => void;
  onToggleSettings?: () => void;
  onManagementToolsClick?: () => void;
  // 단계별 액션 핸들러들
  projectHandlers?: any;
  imageHandlers?: any;
  videoHandlers?: any;
  // 상태 정보
  stepStatus?: any;
  canProceedToNext?: boolean;
  // ActionPanel 표시/숨김 상태
  isActionPanelVisible?: boolean;
  onToggleActionPanel?: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  currentStep,
  onHelpClick,
  onProjectReferenceClick,
  onExportClick,
  onToggleSettings,
  onManagementToolsClick,
  projectHandlers,
  imageHandlers,
  videoHandlers,
  stepStatus,
  canProceedToNext = false,
  isActionPanelVisible = true,
  onToggleActionPanel
}) => {

  return (
    <>
      {isActionPanelVisible && (
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-center">
              {/* 핵심 도구 버튼들만 중앙에 배치 */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={onToggleSettings}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  설정
                </Button>

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

                <Button
                  onClick={onExportClick}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  내보내기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};