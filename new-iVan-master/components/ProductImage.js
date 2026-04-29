"use client";
import { useState } from "react";
import { getFileUrl } from "@/utils/helper";

const ProductImage = ({ 
  product, 
  className = "", 
  fallbackClassName = "",
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = (e) => {
    setImageError(true);
  };

  const handleImageLoad = (e) => {
    setImageError(false);
  };

  // If no image or image failed to load, show fallback
  if (!product.image || imageError) {
    return (
      <div
        className={`w-full h-full bg-gray-300 flex items-center justify-center ${fallbackClassName}`}
      >
        <i className="bi bi-image text-muted text-2xl"></i>
      </div>
    );
  }

  return (
    <img
      src={getFileUrl(product.image)}
      alt={product.name}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      {...props}
    />
  );
};

export default ProductImage;
