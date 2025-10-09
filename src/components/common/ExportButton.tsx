import React, { useState } from 'react';
import Button from './Button';
import AdvancedSettingsModal from './AdvancedSettingsModal';
import { exportProject, ExportOptions } from '../../utils/exportUtils';
import { GeneratedProjectData } from '../../types/project';

interface ExportButtonProps {
  projectData: GeneratedProjectData;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  projectData,
  className = '',
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const defaultOptions: ExportOptions = {
    includeMetadata: true,
    includeImages: true,
    includeVideos: true,
    format: 'txt',
    compression: false,
  };

  const handleQuickExport = () => {
    setIsExporting(true);
    try {
      exportProject(projectData, defaultOptions);
    } catch (error) {
      console.error('내보내기 실패:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdvancedExport = (options: ExportOptions) => {
    setIsExporting(true);
    try {
      exportProject(projectData, options);
    } catch (error) {
      console.error('내보내기 실패:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className={`flex space-x-2 ${className}`}>
        <Button
          onClick={handleQuickExport}
          disabled={isExporting}
          className="px-4 py-2"
        >
          {isExporting ? '내보내는 중...' : '📄 TXT 내보내기'}
        </Button>
        
        <Button
          onClick={() => setIsSettingsOpen(true)}
          disabled={isExporting}
          variant="secondary"
          className="px-4 py-2"
        >
          ⚙️ 고급 설정
        </Button>
      </div>

      <AdvancedSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => {
          const exportOptions: ExportOptions = {
            includeMetadata: settings.export.includeMetadata,
            includeImages: settings.export.includeImages,
            includeVideos: settings.export.includeVideos,
            format: settings.export.format,
            compression: settings.export.compression,
          };
          handleAdvancedExport(exportOptions);
        }}
        currentSettings={{
          video: {
            model: 'veo-3.0-generate-001',
            aspectRatio: '16:9',
            duration: 8,
            resolution: '720p',
            fps: 24,
            generateAudio: true,
            personGeneration: 'ALLOW_ALL',
          },
          image: {
            model: 'gemini-pro-vision',
            style: 'realistic',
            quality: 'standard',
            aspectRatio: '16:9',
            numberOfImages: 1,
          },
          text: {
            model: 'gemini-pro',
            temperature: 0.5,
            maxTokens: 2000,
            language: 'ko',
          },
          export: defaultOptions,
        }}
      />
    </>
  );
};

export default ExportButton;
