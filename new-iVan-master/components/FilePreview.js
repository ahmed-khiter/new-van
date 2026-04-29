import React from 'react';
import { FiX, FiImage, FiFile } from 'react-icons/fi';
import { truncateFileName } from '@/utils/helper';

const FilePreview = ({ files, onRemove, isMessage = false }) => {
    if (!files || files.length === 0) return null;

    const AWS_BASE_URL = process.env.NEXT_PUBLIC_AWS_BASE_URL || "";

    const getFileIcon = (file) => {
        if (file.type && file.type.startsWith('image/')) {
            return <FiImage className="w-4 h-4" />;
        }
        return <FiFile className="w-4 h-4" />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileClick = (file) => {
        if (isMessage && file.fileName) {
            const fullUrl = `${AWS_BASE_URL}${file.fileName}`;
            window.open(fullUrl, '_blank');
        }
    };

    return (
        <div className="p-2 bg-gray-50">
          {!isMessage && <div className="text-sm text-gray-600 mb-2">
                Selected Files
            </div>}
            <div className="space-y-2">
                {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                        <div 
                            className="flex items-center space-x-3 flex-1 cursor-pointer"
                            onClick={() => handleFileClick(file)}
                        >
                            {isMessage && file.fileName ? (
                                file.type && file.type.startsWith('image/') ? (
                                    <img 
                                        src={`${AWS_BASE_URL}${file.fileName}`}
                                        alt={file.fileName || file.name}
                                        className="w-8 h-8 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                        {getFileIcon(file)}
                                    </div>
                                )
                            ) : (
                                file.type && file.type.startsWith('image/') ? (
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={file.name}
                                        className="w-8 h-8 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                        {getFileIcon(file)}
                                    </div>
                                )
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {truncateFileName(file.fileName || file.name)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {formatFileSize(file.fileSize || file.size)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!isMessage && onRemove && (
                                <button
                                    onClick={() => onRemove(index)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Remove"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FilePreview;
