'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageLightbox from './ImageLightbox';

const Gallery = ({
  images = [],
  isLoading = false,
  emptyMessage = 'No gallery images available',
  showWrapper = true,
  className = '',
  renderItemActions = null,
  truncateCaption = false,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageClick = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const content = (
    <>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-[14px] bg-gray-100" />
          ))}
        </div>
      ) : !images || images.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 text-4xl">🖼️</div>
          <p className="text-[14px] text-[#6b7280]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((item, index) => (
            <div key={item.id || index} className="group relative">
              <div
                className="aspect-[4/3] cursor-pointer overflow-hidden rounded-[14px] bg-[#f5f5f5]"
                onClick={() => handleImageClick(index)}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || 'Gallery image'}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    style={{ position: 'absolute', inset: 0 }}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#d1d5db]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  </div>
                )}
              </div>
              {item.caption && (
                <p className={`mt-1.5 text-[12px] text-[#6b7280] ${truncateCaption ? 'truncate' : ''}`} title={item.caption}>
                  {item.caption}
                </p>
              )}
              {renderItemActions && renderItemActions(item, index)}
            </div>
          ))}
        </div>
      )}

      {images && images.length > 0 && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={images}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );

  if (showWrapper) {
    return <div className={className}>{content}</div>;
  }

  return content;
};

export default Gallery;
