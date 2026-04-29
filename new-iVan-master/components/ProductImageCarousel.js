'use client';

import { useState, useRef, useCallback } from 'react';

const ProductImageCarousel = ({ images = [], alt = 'Product', size = 'w-16 h-16', className = '', onImageClick }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStartX = useRef(null);

    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback((e) => {
        if (touchStartX.current === null || images.length <= 1) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 30) {
            if (diff > 0 && activeIndex < images.length - 1) {
                setActiveIndex(prev => prev + 1);
            } else if (diff < 0 && activeIndex > 0) {
                setActiveIndex(prev => prev - 1);
            }
        }
        touchStartX.current = null;
    }, [activeIndex, images.length]);

    if (!images || images.length === 0) return null;

    if (images.length === 1) {
        return (
            <img
                src={images[0]}
                alt={alt}
                className={`${size} rounded-xl object-cover flex-shrink-0 ${onImageClick ? 'cursor-pointer' : ''} ${className}`}
                onClick={() => onImageClick?.(images[0])}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    }

    return (
        <div className={`${size} flex-shrink-0 ${className}`} style={{ position: 'relative' }}>
            <div
                style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '0.75rem', position: 'relative' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={images[activeIndex]}
                    alt={`${alt} ${activeIndex + 1}`}
                    className={`${onImageClick ? 'cursor-pointer' : ''}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
                    onClick={() => onImageClick?.(images[activeIndex])}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
            {images.length > 1 && (
                <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '3px',
                    alignItems: 'center',
                }}>
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex(idx);
                            }}
                            style={{
                                width: idx === activeIndex ? '8px' : '5px',
                                height: idx === activeIndex ? '8px' : '5px',
                                borderRadius: '50%',
                                border: 'none',
                                padding: 0,
                                background: idx === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            aria-label={`Image ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductImageCarousel;
