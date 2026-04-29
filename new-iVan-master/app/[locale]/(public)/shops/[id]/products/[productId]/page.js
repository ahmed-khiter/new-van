"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { getFileUrl, formatAmountToCurrency } from "@/utils/helper";
import { useCart } from "@/lib/contexts/CartContext";
import FavoriteToggle from "@/components/FavoriteToggle";
import ProductImage from "@/components/ProductImage";
import ImageLightbox from "@/components/ImageLightbox";
import { useRef, useCallback } from "react";
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import LoginModal from "@/components/Modals/LoginModal";
import CartResetConfirmationModal from "@/components/Modals/CartResetConfirmationModal";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const t = useTranslations('ProductDetailPage');
  const { updateCartProduct, removeProductFromCart, isProductInCart, isCartLoading } = useCart();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [pendingVariant, setPendingVariant] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (productId && sessionStatus !== 'loading') {
      fetchProduct();
      fetchCartItems();
    }
  }, [productId, session?.user?.id, sessionStatus]);

  useEffect(() => {
    if (
      product?.variants?.enabled &&
      Array.isArray(product.variants.values) &&
      product.variants.values.length > 0
    ) {
      setSelectedVariant(product.variants.values[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ id: productId });

      if (session?.user?.id && session?.user?.role === "visitor") {
        params.append("userId", session.user.id);
      }

      const response = await fetch(`/api/products/public?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Product not found");
      }

      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error(t('failed_load_product'));
      router.push("/shops");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCartItems = useCallback(async () => {
    if (sessionStatus === "loading" || !session?.user || session?.user?.role !== "visitor") {
      setCartItems([]);
      return;
    }

    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cartItems || []);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  }, [session, sessionStatus]);

  const getCartQuantity = useCallback((id) => {
    const cartItem = cartItems.find((item) => item.productId === id);
    return cartItem ? cartItem.quantity : 0;
  }, [cartItems]);

  const findVariantItemByValue = useCallback((value) => {
    if (!product?.variants?.items || value === null || value === undefined) {
      return null;
    }

    return (
      product.variants.items.find((item) => item.value === value) ||
      product.variants.items.find(
        (item) => String(item.value) === String(value)
      ) ||
      null
    );
  }, [product]);

  const getCurrentVariantStock = useCallback((item) => {
    if (!item) return 0;
    if (selectedVariant && item.variants?.items) {
      const variantItem = findVariantItemByValue(selectedVariant);
      if (variantItem) return variantItem.stock || 0;
    }
    return item.stock || 0;
  }, [selectedVariant, findVariantItemByValue]);

  const handleIncrementQuantity = async (item) => {
    if (!item) return;
    if (sessionStatus === "loading") return;

    if (!session) {
      setPendingProduct(item);
      setPendingVariant(selectedVariant);
      setIsLoginModalOpen(true);
      return;
    }

    if (session?.user?.role !== "visitor") {
      toast.error(t('only_customers_manage_cart'));
      return;
    }

    const currentStock = getCurrentVariantStock(item);
    if (currentStock === 0) {
      toast.error(t('product_out_of_stock'));
      return;
    }

    const hasVariants = item.variants?.enabled && item.variants?.items?.length > 0;
    if (hasVariants && !selectedVariant) {
      toast.error(t('please_select_size') || 'Please select a size first');
      return;
    }

    const result = await updateCartProduct(item.id, 1, "increment", selectedVariant);
    if (result.requireReset) {
      setResetData(result.data);
      setPendingProduct(item);
      setPendingVariant(selectedVariant);
      setIsResetModalOpen(true);
    } else if (result.success) {
      await fetchCartItems();
    } else {
      toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
    }
  };

  const handleDecrementQuantity = async (item) => {
    if (!item || !session || session?.user?.role !== "visitor") return;

    const quantity = getCartQuantity(item.id);
    if (quantity <= 0) return;

    if (quantity <= 1) {
      const result = await removeProductFromCart(item.id);
      if (result.success) {
        toast.success(t('product_removed_cart'));
        await fetchCartItems();
      } else {
        toast.error(result.error || t('failed_remove_product'));
      }
      return;
    }

    const result = await updateCartProduct(item.id, 1, "decrement", selectedVariant);
    if (result.success) {
      await fetchCartItems();
    } else {
      toast.error(result.error || t('failed_remove_product'));
    }
  };

  const handleCartToggle = async (product) => {
    if (!session) {
      setPendingProduct(product);
      setPendingVariant(selectedVariant);
      setIsLoginModalOpen(true);
      return;
    }

    if (session?.user?.role !== "visitor") {
      toast.error(t('only_customers_manage_cart'));
      return;
    }

    if (product.stock === 0) {
      toast.error(t('product_out_of_stock'));
      return;
    }

    const isInCart = isProductInCart(product.id);
    
    if (isInCart) {
      const result = await removeProductFromCart(product.id);
      if (result.success) {
        toast.success(t('product_removed_cart'));
      } else {
        toast.error(result.error || t('failed_remove_product'));
      }
    } else {
      const result = await updateCartProduct(product.id, 1, "add", selectedVariant);
      if (result.requireReset) {
        setResetData(result.data);
        setPendingProduct(product);
        setIsResetModalOpen(true);
      } else if (result.success) {
        toast.success(t('product_added_cart'));
      } else {
        toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
      }
    }
  };

  const handleResetConfirm = async () => {
    if (!pendingProduct) return;
    
    setIsResetModalOpen(false);
    
    const result = await updateCartProduct(pendingProduct.id, 1, "reset-add", selectedVariant);
    if (result.success) {
      toast.success(t('product_added_cart'));
      setPendingProduct(null);
      setResetData(null);
    } else {
      toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
    }
  };

  const handleResetCancel = () => {
    setIsResetModalOpen(false);
    setPendingProduct(null);
    setResetData(null);
  };

  const formatPrice = (price) => {
    return formatAmountToCurrency(Number(price) || 0);
  };

  const handleLoginSuccess = async () => {
    if (!pendingProduct) return;

    const result = await updateCartProduct(
      pendingProduct.id,
      1,
      "add",
      pendingVariant
    );

    if (result.requireReset) {
      setResetData(result.data);
      setIsResetModalOpen(true);
    } else if (result.success) {
      toast.success(t('product_added_cart'));
      await fetchCartItems();
    } else {
      toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
    }

    setPendingProduct(null);
    setPendingVariant(null);
  };

  if (sessionStatus === 'loading' || isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <span className="text-[64px]">📦</span>
          <h2 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-[#1a1a2e]">
            {t('product_not_found')}
          </h2>
          <p className="mt-2 max-w-[320px] text-[14px] leading-relaxed text-[#6b7280]">
            {t('product_not_exist')}
          </p>
          <button
            onClick={() => router.push("/shops")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a1a2e] px-6 py-3 text-[14px] font-semibold text-white transition hover:opacity-90"
          >
            {t('back_to_shops')}
          </button>
        </div>
      </div>
    );
  }

  const quantity = getCartQuantity(product.id);
  const variantStock = getCurrentVariantStock(product);
  const hasVariants = product.variants?.enabled && product.variants?.items?.length > 0;

  const hasWeight =
    product.weight !== null &&
    product.weight !== undefined &&
    String(product.weight).trim() !== "";

  const hasDimensions =
    product.dimensions &&
    typeof product.dimensions === "object" &&
    ["length", "width", "height"].every(
      (key) =>
        product.dimensions[key] !== null &&
        product.dimensions[key] !== undefined &&
        String(product.dimensions[key]).trim() !== ""
    );

  return (
    <>
      <div className="min-h-screen bg-white">

        {/* ── Layout wrapper ── */}
        <div className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-6 lg:pb-16 lg:pt-12">

          {/* Two-column on desktop, stacked on mobile */}
          <div className="flex flex-col lg:flex-row lg:gap-16">

            {/* ── LEFT: Image panel ── */}
            <div className="w-full sm:mx-auto sm:max-w-[480px] lg:mx-0 lg:sticky lg:top-12 lg:w-[460px] lg:shrink-0 lg:self-start">
              {(() => {
                const allImages = (Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
                  ? product.imageUrls
                  : (Array.isArray(product.images) && product.images.length > 0)
                    ? product.images.map(key => getFileUrl(key))
                    : (product.image ? [getFileUrl(product.image)] : []);

                return (
                  <>
                    {/* Back button — overlaid on image, mobile only */}
                    <div className="relative">
                      <button
                        onClick={() => router.back()}
                        className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white lg:hidden"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>

                      {/* Favourite */}
                      <div className="absolute right-3 top-3 z-10">
                        <FavoriteToggle product={product} className=""
                          buttonClassName="!bg-white/80 !backdrop-blur-sm !rounded-full !shadow-sm !h-8 !w-8 !flex !items-center !justify-center"
                          iconClassName="!text-[18px] !text-[#1a1a2e]"
                          onToggle={(pid, isFav) => setProduct(prev => ({ ...prev, isFavorite: isFav }))}
                          onLoginRequired={() => setIsLoginModalOpen(true)}
                        />
                      </div>

                      {/* Main image */}
                      <div
                        className="relative aspect-square w-full overflow-hidden rounded-none bg-[#f5f5f7] lg:rounded-[24px]"
                        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                        onTouchEnd={(e) => {
                          if (touchStartX.current === null || allImages.length <= 1) return;
                          const diff = touchStartX.current - e.changedTouches[0].clientX;
                          if (Math.abs(diff) > 40) {
                            if (diff > 0 && activeImageIndex < allImages.length - 1) setActiveImageIndex(p => p + 1);
                            else if (diff < 0 && activeImageIndex > 0) setActiveImageIndex(p => p - 1);
                          }
                          touchStartX.current = null;
                        }}
                      >
                        {allImages.length > 0 ? (
                          <img
                            src={allImages[activeImageIndex] || allImages[0]}
                            alt={product.name}
                            className="h-full w-full cursor-zoom-in object-contain p-6 transition-opacity duration-200"
                            onClick={() => setIsLightboxOpen(true)}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke="#d1d5db" strokeWidth="1.5"/><path d="M3 16L8 11L13 16" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        )}

                        {/* Stock pill */}
                        {(() => {
                          let stockVal = product.stock;
                          if (selectedVariant && product.variants?.items) {
                            const vi = findVariantItemByValue(selectedVariant);
                            if (vi) stockVal = vi.stock;
                          }
                          return (
                            <span className={`absolute bottom-3 right-3 rounded-full px-3 py-1 text-[11px] font-bold text-white ${stockVal > 0 ? 'bg-[#1a1a2e]' : 'bg-[#ef4444]'}`}>
                              {stockVal > 0 ? t('in_stock', { count: stockVal }) : t('out_of_stock')}
                            </span>
                          );
                        })()}

                        {/* Dots */}
                        {allImages.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                            {allImages.map((_, idx) => (
                              <button key={idx} onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                                className={`rounded-full transition-all ${idx === activeImageIndex ? 'h-2 w-5 bg-[#1a1a2e]' : 'h-2 w-2 bg-[#1a1a2e]/20'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Thumbnails */}
                      {allImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:px-0 [&::-webkit-scrollbar]:hidden">
                          {allImages.map((url, idx) => (
                            <img key={idx} src={url} alt=""
                              className={`h-16 w-16 shrink-0 cursor-pointer rounded-[12px] bg-[#f5f5f7] object-contain p-1.5 transition-all ${idx === activeImageIndex ? 'ring-2 ring-[#1a1a2e]' : 'opacity-50 hover:opacity-80'}`}
                              onClick={() => setActiveImageIndex(idx)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ── RIGHT: Info panel ── */}
            <div className="flex-1 px-4 pb-6 pt-5 sm:px-0 lg:pt-10">

              {/* Back — desktop only */}
              <button
                onClick={() => router.back()}
                className="mb-6 hidden items-center gap-1.5 text-[13px] font-medium text-[#6b7280] transition hover:text-[#1a1a2e] lg:inline-flex"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t('back')}
              </button>

              {/* Name */}
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.03em] text-[#1a1a2e] sm:text-[28px]">
                {product.name}
              </h1>

              {/* Delivery badge */}
              <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#16a34a]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>
                {t('delivered_within_60_minutes')}
              </p>

              {/* Divider */}
              <div className="my-5 border-t border-[#f0f0f0]" />

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-bold tracking-[-0.03em] text-[#1a1a2e]">
                  {(() => {
                    if (selectedVariant && product.variants?.items) {
                      const vi = findVariantItemByValue(selectedVariant);
                      if (vi) return formatPrice(vi.salePrice ?? vi.price);
                    }
                    return formatPrice(Number(product.price));
                  })()}
                </span>
                {session?.user?.role === "visitor" && isProductInCart(product.id) && (
                  <span className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[12px] font-semibold text-[#16a34a]">✓ In cart</span>
                )}
              </div>

              {/* Variants */}
              {product.variants?.enabled && product.variants?.values?.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                    {product.variants.optionName || 'Option'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.values.map((val) => {
                      const isSelected = selectedVariant === val;
                      const variantItem = findVariantItemByValue(val);
                      const outOfStock = variantItem && variantItem.stock === 0;
                      return (
                        <button key={val} type="button"
                          onClick={() => setSelectedVariant(isSelected ? null : val)}
                          disabled={outOfStock}
                          className={`h-[40px] min-w-[52px] rounded-[10px] border px-4 text-[14px] font-medium transition ${
                            isSelected
                              ? 'border-[#1a1a2e] bg-[#1a1a2e] text-white'
                              : outOfStock
                                ? 'border-[#f0f0f0] text-[#d1d5db] line-through'
                                : 'border-[#e5e7eb] bg-white text-[#374151] hover:border-[#1a1a2e]'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add to cart — desktop */}
              <div className="mt-6 hidden lg:block">
                {variantStock === 0 ? (
                  <button disabled className="h-[52px] w-full rounded-full bg-[#f0f0f0] text-[15px] font-semibold text-[#9ca3af]">
                    {t('out_of_stock_btn')}
                  </button>
                ) : quantity === 0 ? (
                  <button type="button"
                    onClick={() => handleIncrementQuantity(product)}
                    disabled={isCartLoading || (hasVariants && !selectedVariant)}
                    className="h-[52px] w-full rounded-full bg-[#1a1a2e] text-[15px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div className="flex h-[52px] items-center justify-between rounded-full bg-[#1a1a2e] px-2">
                    <button type="button" onClick={() => handleDecrementQuantity(product)} disabled={isCartLoading}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                    <span className="text-[15px] font-bold text-white">{quantity} in cart</span>
                    <button type="button" onClick={() => handleIncrementQuantity(product)} disabled={isCartLoading}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <>
                  <div className="my-6 border-t border-[#f0f0f0]" />
                  <div>
                    <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af]">{t('description')}</p>
                    <p className="text-[15px] leading-relaxed text-[#374151]">{product.description}</p>
                  </div>
                </>
              )}

              {/* Weight / dimensions */}
              {(hasWeight || hasDimensions) && (
                <>
                  <div className="my-6 border-t border-[#f0f0f0]" />
                  <div>
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af]">{t('product_details')}</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-2">
                      {hasWeight && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-[#9ca3af]">{t('weight')}</p>
                          <p className="text-[15px] font-semibold text-[#1a1a2e]">{product.weight} kg</p>
                        </div>
                      )}
                      {hasDimensions && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-[#9ca3af]">{t('dimensions')}</p>
                          <p className="text-[15px] font-semibold text-[#1a1a2e]">{product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile sticky footer ── */}
        <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md lg:hidden" style={{ borderTop: '1px solid #f0f0f0' }}>
          <div className="px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
            {variantStock === 0 ? (
              <button disabled className="h-[52px] w-full rounded-full bg-[#f0f0f0] text-[15px] font-semibold text-[#9ca3af]">
                {t('out_of_stock_btn')}
              </button>
            ) : quantity === 0 ? (
              <button type="button"
                onClick={() => handleIncrementQuantity(product)}
                disabled={isCartLoading || (hasVariants && !selectedVariant)}
                className="h-[52px] w-full rounded-full bg-[#1a1a2e] text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                Add to Cart
              </button>
            ) : (
              <div className="flex h-[52px] items-center justify-between rounded-full bg-[#1a1a2e] px-2">
                <button type="button" onClick={() => handleDecrementQuantity(product)} disabled={isCartLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <span className="text-[15px] font-bold text-white">{quantity} in cart</span>
                <button type="button" onClick={() => handleIncrementQuantity(product)} disabled={isCartLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingProduct(null);
          setPendingVariant(null);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Cart Reset Confirmation Modal */}
      {resetData && (
        <CartResetConfirmationModal
          isOpen={isResetModalOpen}
          onClose={handleResetCancel}
          onConfirm={handleResetConfirm}
          existingShop={resetData.existingShop}
          existingCartItems={resetData.existingCartItems}
          newProduct={resetData.newProduct}
          newShop={resetData.newShop}
        />
      )}

      {/* Image Lightbox */}
      {product?.image && (
        <ImageLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={
            (Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
              ? product.imageUrls
              : (Array.isArray(product.images) && product.images.length > 0)
                ? product.images.map(key => getFileUrl(key))
                : [getFileUrl(product.image)]
          }
          currentIndex={activeImageIndex}
        />
      )}
    </>
  );
}
