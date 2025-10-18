import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface PDFUploadProps {
  onPDFUpload: (file: File) => void;
  onPDFRemove: () => void;
  uploadedPDF?: File | null;
  label?: string;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  onPDFUpload,
  onPDFRemove,
  uploadedPDF,
  label = "PDF 파일 업로드"
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      onPDFUpload(file);
    } else {
      alert('PDF 파일만 업로드 가능합니다.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {uploadedPDF ? (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-800">{uploadedPDF.name}</span>
            <span className="text-xs text-blue-600">
              ({(uploadedPDF.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button
            onClick={onPDFRemove}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            PDF 파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-xs text-gray-500">
            최대 10MB까지 업로드 가능
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
