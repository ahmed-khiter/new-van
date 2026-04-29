"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [cartProducts, setCartProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  // Fetch cart count and product IDs
  const fetchCartCount = async (skipLoading = false) => {
    if (session?.user?.role === "visitor") {
      if (!skipLoading) {
        setIsLoading(true);
      }
      try {
        const response = await fetch("/api/cart/count");
        if (response.ok) {
          const data = await response.json();
          setCartCount(data.count);
          setCartProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error fetching cart count:", error);
      } finally {
        if (!skipLoading) {
          setIsLoading(false);
        }
      }
    } else {
      setCartCount(0);
      setCartProducts([]);
    }
  };

  // Update cart product (single function for all cart operations)
  const updateCartProduct = async (productId, quantity = 1, action = "add", selectedVariant = null) => {
    setIsCartLoading(true);
    try {
      const payload = {
        productId: productId,
        quantity: quantity,
        action: action
      };
      if (selectedVariant) {
        payload.selectedVariant = selectedVariant;
      }
      const response = await fetch("/api/cart", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if requireReset is needed
        if (data.requireReset) {
          return { 
            success: false, 
            requireReset: true, 
            data: data 
          };
        }
        
        // Handle reset-add action: reset cart and add new product
        if (action === "reset-add") {
          // Refresh cart count after reset (skip loading state to avoid UI flicker)
          await fetchCartCount(true);
        } else {
          // Refresh cart count after any update to get accurate count (skip loading state)
          await fetchCartCount(true);
        }
        
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error("Error updating cart product:", error);
      return { success: false, error: "Failed to update cart product" };
    } finally {
      setIsCartLoading(false);
    }
  };


  // Remove product from cart (decrement count by 1)
  const removeProductFromCart = async (productId) => {
    setIsCartLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        body: JSON.stringify({
          productId: productId
        }),
      });

      if (response.ok) {
        // Refresh cart count after removal to get accurate count (skip loading state)
        await fetchCartCount(true);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error("Error removing product from cart:", error);
      return { success: false, error: "Failed to remove product from cart" };
    } finally {
      setIsCartLoading(false);
    }
  };

 const resetCart = async () => {
  setCartCount(0);
  setCartProducts([]);
  setCartMenuItems([]);
 };
 
  // Check if product is in cart
  const isProductInCart = (productId) => {
    return cartProducts.includes(productId);
  };

  // Update cart menu item (alias for products - for backward compatibility)
  const updateCartMenuItem = async (menuItemId, quantity = 1, action = "add") => {
    // Menu items are now products, so use the product function
    return updateCartProduct(menuItemId, quantity, action);
  };

  // Remove menu item from cart (alias for products - for backward compatibility)
  const removeMenuItemFromCart = async (menuItemId) => {
    // Menu items are now products, so use the product function
    return removeProductFromCart(menuItemId);
  };

  // Check if menu item is in cart (alias for products - for backward compatibility)
  const isMenuItemInCart = (menuItemId) => {
    // Menu items are now products, so use the product function
    return isProductInCart(menuItemId);
  };

  // Fetch cart count when session changes
  useEffect(() => {
    fetchCartCount();
  }, [session]);


  const value = {
    cartCount,
    cartProducts,
    isLoading,
    isCartLoading,
    updateCartProduct,
    removeProductFromCart,
    isProductInCart,
    updateCartMenuItem, // Alias for backward compatibility
    removeMenuItemFromCart, // Alias for backward compatibility
    isMenuItemInCart, // Alias for backward compatibility
    resetCart,
  };  

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
