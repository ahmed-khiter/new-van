'use client'
import { useState, useEffect } from 'react';
import { FiStar, FiX } from 'react-icons/fi';

const StarRatingModal = ({
    isOpen,
    onClose,
    title = "Rate Your Experience",
    subtitle = "How would you rate your experience?",
    onRatingSubmit,
    rating: staticRating = null, // Static rating prop
    isStatic = false, // If true, rating is read-only
}) => {
    const [rating, setRating] = useState(staticRating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);

    // Update rating when staticRating prop changes
    useEffect(() => {
        if (staticRating !== null) {
            setRating(staticRating);
        }
    }, [staticRating]);

    if (!isOpen) return null;

    const handleStarClick = (starRating) => {
        if (!isStatic) {
            setRating(starRating);
            if (onRatingSubmit) {
                onRatingSubmit(starRating);
            }
        }
    };

    const handleStarHover = (starRating) => {
        if (!isStatic) {
            setHoveredRating(starRating);
        }
    };

    const handleStarLeave = () => {
        if (!isStatic) {
            setHoveredRating(0);
        }
    };

    // Calculate filled stars for decimal ratings (e.g., 4.5)
    const getStarFill = (starIndex) => {
        const currentRating = hoveredRating || rating;
        if (starIndex <= Math.floor(currentRating)) {
            return 'full';
        } else if (starIndex === Math.ceil(currentRating) && currentRating % 1 !== 0) {
            return 'half';
        }
        return 'empty';
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative z-[10000] animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#00483D] text-white p-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <FiStar className="w-5 h-5 text-white flex-shrink-0" />
                            <h3 className="text-lg font-bold leading-none mt-2">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 pb-6">
                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-gray-600 text-center mb-6">
                            {subtitle}
                        </p>
                    )}

                    {/* Star Rating */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="flex justify-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const fillType = getStarFill(star);
                                const isFilled = fillType === 'full' || fillType === 'half';
                                const isHalf = fillType === 'half';
                                
                                const starContent = (
                                    <div className="relative w-12 h-12 inline-block">
                                        {/* Empty star background */}
                                        <FiStar className="w-12 h-12 text-gray-300" />
                                        {/* Filled star overlay */}
                                        {isFilled && (
                                            <div 
                                                className="absolute top-0 left-0 overflow-hidden"
                                                style={{ 
                                                    width: isHalf ? '50%' : '100%',
                                                    height: '100%'
                                                }}
                                            >
                                                <FiStar className="w-12 h-12 text-yellow-400 fill-current" />
                                            </div>
                                        )}
                                    </div>
                                );

                                if (isStatic) {
                                    return (
                                        <div key={star} className="transition-all duration-200">
                                            {starContent}
                                        </div>
                                    );
                                }

                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleStarClick(star)}
                                        onMouseEnter={() => handleStarHover(star)}
                                        onMouseLeave={handleStarLeave}
                                        className="focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
                                        aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                    >
                                        {starContent}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Rating Score */}
                        {rating > 0 && (
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-800">
                                    {rating.toFixed(1)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StarRatingModal;

