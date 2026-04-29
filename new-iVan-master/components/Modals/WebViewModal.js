'use client'
import { useState } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';

const WebViewModal = ({
    isOpen,
    onClose,
    url,
    title = "Mini App"
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!isOpen) return null;

    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setHasError(false);
        const iframe = document.getElementById('webview-iframe');
        if (iframe) {
            iframe.src = iframe.src;
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl relative z-[10000] animate-slideUp overflow-hidden flex flex-col"
                style={{ height: '90vh', maxHeight: '900px' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#00483D] text-white p-4 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">{title}</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                                title="Refresh"
                            >
                                <FiRefreshCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* WebView Content */}
                <div className="flex-1 relative bg-white overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00483D] mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading...</p>
                            </div>
                        </div>
                    )}
                    
                    {hasError ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                            <div className="text-center p-6">
                                <p className="text-red-600 mb-4">Failed to load the mini app</p>
                                <button
                                    onClick={handleRefresh}
                                    className="px-4 py-2 bg-[#00483D] text-white rounded-lg hover:bg-[#003a30] transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            id="webview-iframe"
                            src={url}
                            className="w-full h-full border-0"
                            onLoad={handleLoad}
                            onError={handleError}
                            title={title}
                            allow="camera; microphone; geolocation; payment"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebViewModal;

