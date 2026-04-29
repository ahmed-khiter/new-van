'use client'

const InfoModal = ({
    isOpen,
    onClose,
    title,
    message,
    icon = "fa-info-circle",
    showComingSoonIcon = false,
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl relative z-[10000] animate-slideUp max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-[#00483D] text-white p-4 rounded-t-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold flex items-start gap-2 min-w-0 flex-1 text-left">
                            <i className={`fa ${icon} text-white shrink-0 mt-0.5`} aria-hidden="true"></i>
                            <span className="block">{(title || "Information").replace(/\s*\n\s*/g, " ").trim()}</span>
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full shrink-0 mt-0.5"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 pb-6 overflow-y-auto flex-1">
                    {typeof message === 'string' ? (
                        <p className="text-gray-600 leading-relaxed text-left">
                            {message}
                        </p>
                    ) : (
                        <div className="text-gray-600 leading-relaxed text-left">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InfoModal;

