'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ImageLightbox = ({ 
  isOpen, 
  onClose, 
  images = [], 
  currentIndex = 0,
  onIndexChange 
}) => {

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && images.length > 0) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && images.length > 0) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageUrl = currentImage?.imageUrl || currentImage?.image || currentImage;

  const handlePrevious = () => {
    if (onIndexChange) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      onIndexChange(newIndex);
    }
  };

  const handleNext = () => {
    if (onIndexChange) {
      const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      onIndexChange(newIndex);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const distance = touchStartX - touchEndX;

    // Swipe threshold
    if (distance > 50) {
      handleNext(); // Swipe Left → Next
    } else if (distance < -50) {
      handlePrevious(); // Swipe Right → Previous
    }
  };


  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-[10000] p-2 hover:bg-white/10 rounded-full"
        aria-label="Close"
      >
        <FaTimes className="w-6 h-6" />
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-[10000] p-3 hover:bg-white/10 rounded-full"
            aria-label="Previous image"
          >
            <FaChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-[10000] p-3 hover:bg-white/10 rounded-full"
            aria-label="Next image"
          >
            <FaChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm z-[10000] bg-black/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={currentImage?.caption || "Gallery image"}
            fill
            className="object-contain"
            unoptimized
            priority
          />
        </div>
      </div>

      {/* Caption */}
      {currentImage?.caption && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center z-[10000] bg-black/50 px-4 py-2 rounded-lg max-w-2xl">
          <p className="text-sm md:text-base">{currentImage.caption}</p>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;

