'use client'

const AppDownloadModal = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    // App store URLs
    const appStoreUrl = "https://apps.apple.com/us/app/swipped/id6753069241";
    const googlePlayUrl = "https://play.google.com/store/apps/details?id=com.swipped.app"; // Update with actual Google Play URL if available

    const handleAppStoreClick = () => {
        window.open(appStoreUrl, '_blank');
    };

    const handleGooglePlayClick = () => {
        window.open(googlePlayUrl, '_blank');
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative z-[10000] animate-slideUp overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* App Bar / Header */}
                <div className="bg-[#00483D] text-white p-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <i className="fa fa-download text-white text-xl" aria-hidden="true"></i>
                            Download Our App
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-2 pb-2 flex flex-col items-center justify-center gap-2">
                    <p className="text-gray-600 text-center mb-2 font-bold">
                        Available on the
                    </p>
                    
                    {/* iOS App Store Button */}
                    <button
                        onClick={handleAppStoreClick}
                        className=" cursor-pointer border-0 outline-none"
                    >
                        <img 
                            src="/assets/img/appstore.png" 
                            alt="Download on the App Store" 
                            className="h-8 w-auto object-contain"
                        />
                    </button>

                    {/* Google Play Button */}
                    <button
                        onClick={handleGooglePlayClick}
                        className=" cursor-pointer border-0 outline-none mb-4"
                    >
                        <img 
                            src="/assets/img/googleplay.png" 
                            alt="GET IT ON Google Play" 
                            className="h-8 w-auto object-contain"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppDownloadModal;

