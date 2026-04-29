"use client";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useSession } from "next-auth/react";

const FavoriteToggle = ({ product, menuItem, className = "", position = "relative", onToggle, buttonClassName = "", iconClassName = "", onLoginRequired }) => {
  const { toggleFavorite, toggleMenuItemFavorite, isLoading: favoriteLoading, isVisitor } = useFavorites();
  const { data: session } = useSession();

  // Support both product and menuItem props
  const item = product || menuItem;
  const isFavorite = item?.isFavorite ?? false;
  const itemId = item?.id;

  const handleFavoriteToggle = async (item) => {
    if (!session?.user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    let result;
    if (menuItem) {
      // Handle menu item favorites
      result = await toggleMenuItemFavorite(item.id, item.isFavorite ?? false);
    } else {
      // Handle product favorites
      result = await toggleFavorite(item.id, item.isFavorite ?? false);
    }
    
    if (result.success && onToggle) {
      // Call the parent's callback to update state
      onToggle(item.id, result.isFavorite);
    }
  };

  if (!item || !itemId) {
    return null;
  }

  return (
    <div className={`${position} ${className}`}>
      <button
        className={`favorite-btn ${buttonClassName} ${isFavorite ? 'favorite-btn--active' : 'favorite-btn--inactive'}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFavoriteToggle(item);
        }}
        disabled={favoriteLoading}
        title={
          !isFavorite 
            ? "Add to favorites" 
            : "Remove from favorites"
        }
      >
        <i className={`bi ${iconClassName} ${
          isFavorite 
            ? "bi-heart-fill" 
            : "bi-heart"
        }`}></i>
      </button>
    </div>
  );
};

export default FavoriteToggle;
