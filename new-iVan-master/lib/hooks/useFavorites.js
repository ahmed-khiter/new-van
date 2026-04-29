"use client";
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export const useFavorites = () => {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const toggleFavorite = useCallback(async (productId, currentFavoriteStatus) => {
        if (!session?.user) {
            toast.error('Please login to add products to favorites');
            return { success: false, isFavorite: currentFavoriteStatus };
        }

        if (session.user.role !== 'visitor') {
            toast.error('Only visitors can add products to favorites');
            return { success: false, isFavorite: currentFavoriteStatus };
        }

        setIsLoading(true);
        
        try {
            const action = currentFavoriteStatus ? 'remove' : 'add';
            
            const response = await fetch('/api/favorites', {
                method: 'POST',
                body: JSON.stringify({
                    productId,
                    action
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update favorite');
            }

            const data = await response.json();
            
            // Show success message
            if (action === 'add') {
                toast.success('Added to favorites');
            } else {
                toast.success('Removed from favorites');
            }

            return { 
                success: true, 
                isFavorite: data.isFavorite,
                message: data.message 
            };

        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(error.message || 'Failed to update favorite');
            return { success: false, isFavorite: currentFavoriteStatus };
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const addToFavorites = useCallback(async (productId) => {
        return await toggleFavorite(productId, false);
    }, [toggleFavorite]);

    const removeFromFavorites = useCallback(async (productId) => {
        return await toggleFavorite(productId, true);
    }, [toggleFavorite]);

    const fetchFavorites = useCallback(async () => {
        if (!session?.user || session.user.role !== 'visitor') {
            return { success: false, favorites: [] };
        }

        setIsLoading(true);
        
        try {
            const response = await fetch('/api/favorites');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch favorites');
            }

            const data = await response.json();
            return { success: true, favorites: data.favorites };

        } catch (error) {
            console.error('Error fetching favorites:', error);
            toast.error(error.message || 'Failed to fetch favorites');
            return { success: false, favorites: [] };
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const toggleMenuItemFavorite = useCallback(async (menuItemId, currentFavoriteStatus) => {
        if (!session?.user) {
            toast.error('Please login to add menu items to favorites');
            return { success: false, isFavorite: currentFavoriteStatus };
        }

        if (session.user.role !== 'visitor') {
            toast.error('Only visitors can add menu items to favorites');
            return { success: false, isFavorite: currentFavoriteStatus };
        }

        setIsLoading(true);
        
        try {
            const action = currentFavoriteStatus ? 'remove' : 'add';
            
            const response = await fetch('/api/favorites/menu-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    menuItemId,
                    action
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update favorite');
            }

            const data = await response.json();
            
            // Show success message
            if (action === 'add') {
                toast.success('Added to favorites');
            } else {
                toast.success('Removed from favorites');
            }

            return { 
                success: true, 
                isFavorite: data.isFavorite,
                message: data.message 
            };

        } catch (error) {
            console.error('Error toggling menu item favorite:', error);
            toast.error(error.message || 'Failed to update favorite');
            return { success: false, isFavorite: currentFavoriteStatus };
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    return {
        toggleFavorite,
        toggleMenuItemFavorite,
        addToFavorites,
        removeFromFavorites,
        fetchFavorites,
        isLoading,
        isLoggedIn: !!session?.user,
        isVisitor: session?.user?.role === 'visitor'
    };
};
