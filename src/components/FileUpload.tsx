
import React, { useRef } from 'react';
import { UploadIcon } from './IconComponents';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  title?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, currentFile, title }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset the input value to allow re-uploading the same file
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <div className="flex flex-col items-center justify-center">
        <div className="bg-indigo-100 text-indigo-600 rounded-full p-2 mb-2">
          <UploadIcon />
        </div>
        <p className="font-semibold text-slate-700 text-sm">{title || "فایل خود را انتخاب کنید"}</p>
        <p className="text-xs text-slate-500 mt-1">پشتیبانی از XLSX, XLS</p>
        {currentFile && (
          <p className="text-xs text-green-600 mt-2 font-medium bg-green-100 px-2 py-1 rounded-full">
            {currentFile.name}
          </p>
        )}
      </div>
    </div>
  );
};
