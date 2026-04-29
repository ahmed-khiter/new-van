"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { getFileUrl, formatAmountToCurrency } from "@/utils/helper";
import { useCart } from "@/lib/contexts/CartContext";
import FavoriteToggle from "@/components/FavoriteToggle";
import ImageLightbox from "@/components/ImageLightbox";

import LoginModal from "@/components/Modals/LoginModal";
import CartResetConfirmationModal from "@/components/Modals/CartResetConfirmationModal";

export default function MenuItemDetailPage() {
  const { menuItemId } = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const t = useTranslations('ProductDetailPage');
  const { updateCartProduct, removeProductFromCart, isProductInCart, isCartLoading } = useCart();
  const [menuItem, setMenuItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [pendingMenuItem, setPendingMenuItem] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (menuItemId && sessionStatus !== 'loading') {
      fetchMenuItem();
    }
  }, [menuItemId, session?.user?.id, sessionStatus]);

  const fetchMenuItem = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/public?id=${menuItemId}`);

      if (!response.ok) {
        throw new Error("Menu item not found");
      }

      const data = await response.json();
      setMenuItem(data.product);
    } catch (error) {
      console.error("Error fetching menu item:", error);
      toast.error(t('failed_load_product'));
      router.push("/restaurants");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCartToggle = async (product) => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    if (session?.user?.role !== "visitor") {
      toast.error(t('only_customers_manage_cart'));
      return;
    }

    if (!product.isAvailable) {
      toast.error(t('product_out_of_stock') || 'Product is not available');
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
      const result = await updateCartProduct(product.id, 1, "add");
      if (result.requireReset) {
        setResetData(result.data);
        setPendingMenuItem(product);
        setIsResetModalOpen(true);
      } else if (result.success) {
        toast.success(t('product_added_cart'));
      } else {
        toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
      }
    }
  };

  const handleResetConfirm = async () => {
    if (!pendingMenuItem) return;
    
    setIsResetModalOpen(false);
    
    const result = await updateCartProduct(pendingMenuItem.id, 1, "reset-add");
    if (result.success) {
      toast.success(t('product_added_cart'));
      setPendingMenuItem(null);
      setResetData(null);
    } else {
      toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
    }
  };

  const handleResetCancel = () => {
    setIsResetModalOpen(false);
    setPendingMenuItem(null);
    setResetData(null);
  };

  const handleLoginSuccess = () => {
    if (menuItem) {
      handleCartToggle(menuItem);
    }
  };

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#e5e7eb] border-t-[#1a1a2e]" />
      </div>
    );
  }

  if (!menuItem) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <span className="text-[64px]">🍽️</span>
          <h2 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-[#1a1a2e]">{t('product_not_found')}</h2>
          <p className="mt-2 max-w-[320px] text-[14px] leading-relaxed text-[#6b7280]">{t('product_not_exist')}</p>
          <button
            onClick={() => router.push("/restaurants")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a1a2e] px-6 py-3 text-[14px] font-semibold text-white transition hover:opacity-90"
          >
            {t('back_to_shops')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container py-6 lg:py-10">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] transition hover:border-[#9ca3af]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t('back')}
        </button>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Image */}
          <div className="w-full lg:w-1/2">
            {(() => {
              const allImages = (Array.isArray(menuItem.imageUrls) && menuItem.imageUrls.length > 0)
                ? menuItem.imageUrls
                : (Array.isArray(menuItem.images) && menuItem.images.length > 0)
                  ? menuItem.images.map(key => getFileUrl(key))
                  : (menuItem.image ? [getFileUrl(menuItem.image)] : []);

              return (
                <>
                  <div
                    className="relative"
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
                        alt={menuItem.name}
                        className="aspect-square w-full cursor-pointer rounded-[20px] object-cover transition-opacity duration-200"
                        onClick={() => setIsLightboxOpen(true)}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-[20px] bg-[#e5e7eb]">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#9ca3af" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke="#9ca3af" strokeWidth="1.5"/><path d="M3 16L8 11L13 16" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}

                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5">
                        {allImages.map((_, idx) => (
                          <button key={idx} type="button" onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                            className={`rounded-full border-none p-0 transition-all duration-200 ${idx === activeImageIndex ? 'h-2.5 w-2.5 bg-white' : 'h-[7px] w-[7px] bg-white/50'}`}
                            style={{ cursor: 'pointer' }} aria-label={`Image ${idx + 1}`} />
                        ))}
                      </div>
                    )}

                    {allImages.length > 1 && (
                      <>
                        {activeImageIndex > 0 && (
                          <button type="button" onClick={() => setActiveImageIndex(p => p - 1)}
                            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-none bg-white/85 shadow-md transition hover:bg-white md:flex">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                        {activeImageIndex < allImages.length - 1 && (
                          <button type="button" onClick={() => setActiveImageIndex(p => p + 1)}
                            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-none bg-white/85 shadow-md transition hover:bg-white md:flex">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                      </>
                    )}

                    <div className="absolute left-3 top-3">
                      <FavoriteToggle
                        menuItem={menuItem}
                        className=""
                        buttonClassName="!text-[#1a1a2e]"
                        iconClassName="!text-[24px]"
                        onToggle={(itemId, isFavorite) => { setMenuItem((prev) => ({ ...prev, isFavorite })); }}
                        onLoginRequired={() => setIsLoginModalOpen(true)}
                      />
                    </div>
                  </div>

                  {allImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {allImages.map((url, idx) => (
                        <img key={idx} src={url} alt={`${menuItem.name} ${idx + 1}`}
                          className={`h-[72px] w-[72px] flex-shrink-0 cursor-pointer rounded-[10px] object-cover transition-all duration-200 ${idx === activeImageIndex ? 'opacity-100 ring-2 ring-[#1a1a2e]' : 'opacity-60 hover:opacity-80'}`}
                          onClick={() => setActiveImageIndex(idx)} />
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Info */}
          <div className="w-full lg:w-1/2">
            <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[#1a1a2e]">{menuItem.name}</h1>

            <div className="mt-5 flex items-start justify-between">
              <span className="text-[28px] font-bold text-[#1a1a2e]">{formatAmountToCurrency(Number(menuItem.price))}</span>
              {session?.user && session?.user?.role === "visitor" && isProductInCart(menuItem.id) && (
                <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-[12px] font-semibold text-[#16a34a]">
                  <svg className="mb-px mr-1 inline-block" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>
                  {t('in_cart')}
                </span>
              )}
            </div>

            {menuItem.description && (
              <div className="mt-6">
                <h3 className="mb-2 text-[15px] font-semibold text-[#1a1a2e]">{t('description')}</h3>
                <p className="text-[14px] leading-relaxed text-[#6b7280]">{menuItem.description}</p>
              </div>
            )}

            {(menuItem.preparationTime || menuItem.calories || (menuItem.dietaryInfo?.length > 0) || (menuItem.allergens?.length > 0)) && (
              <div className="mt-6">
                <h3 className="mb-3 text-[15px] font-semibold text-[#1a1a2e]">{t('product_details')}</h3>
                <div className="grid grid-cols-1 gap-3 rounded-[14px] bg-[#f5f5f5] p-4 sm:grid-cols-2">
                  {menuItem.preparationTime && (
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#6b7280]"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>
                      <span className="text-[13px] text-[#6b7280]">{t('preparation_time')}:</span>
                      <span className="text-[13px] font-medium text-[#1a1a2e]">{menuItem.preparationTime} {t('minutes')}</span>
                    </div>
                  )}
                  {menuItem.calories && (
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#6b7280]"><path d="M12 2c1 3 4 5.5 4 8a4 4 0 11-8 0c0-2.5 3-5 4-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="text-[13px] text-[#6b7280]">{t('calories')}:</span>
                      <span className="text-[13px] font-medium text-[#1a1a2e]">{menuItem.calories} {t('kcal')}</span>
                    </div>
                  )}
                  {menuItem.dietaryInfo?.length > 0 && (
                    <div className="col-span-full flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-[#6b7280]">{t('dietary_info')}:</span>
                      {menuItem.dietaryInfo.map((info, idx) => (
                        <span key={idx} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-medium text-emerald-700">{info}</span>
                      ))}
                    </div>
                  )}
                  {menuItem.allergens?.length > 0 && (
                    <div className="col-span-full flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-[#6b7280]">{t('allergens')}:</span>
                      {menuItem.allergens.map((allergen, idx) => (
                        <span key={idx} className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-800">{allergen}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cart actions */}
            <div className="mt-8">
              {!menuItem.isAvailable ? (
                <button disabled className="h-[48px] w-full rounded-full border border-[#d1d5db] text-[14px] font-semibold text-[#9ca3af]">
                  {t('out_of_stock_btn')}
                </button>
              ) : session?.user && session?.user?.role === "visitor" && isProductInCart(menuItem.id) ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCartToggle(menuItem)}
                    disabled={isCartLoading}
                    className="flex h-[48px] flex-1 items-center justify-center rounded-full border border-[#d1d5db] text-[14px] font-semibold text-[#374151] transition hover:border-[#9ca3af] disabled:opacity-50"
                  >
                    {isCartLoading ? (
                      <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#374151]/30 border-t-[#374151]" />{t('removing')}</span>
                    ) : t('remove_from_cart')}
                  </button>
                  <button
                    onClick={() => router.push("/purchase")}
                    disabled={isCartLoading}
                    className="flex h-[48px] items-center justify-center rounded-full bg-[#1a1a2e] px-6 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {t('view_cart')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleCartToggle(menuItem)}
                  disabled={isCartLoading}
                  className="flex h-[48px] w-full items-center justify-center rounded-full bg-[#1a1a2e] text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isCartLoading ? (
                    <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{t('adding')}</span>
                  ) : t('add_to_cart')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

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

      {menuItem?.image && (
        <ImageLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={
            (Array.isArray(menuItem.imageUrls) && menuItem.imageUrls.length > 0)
              ? menuItem.imageUrls
              : (Array.isArray(menuItem.images) && menuItem.images.length > 0)
                ? menuItem.images.map(key => getFileUrl(key))
                : [getFileUrl(menuItem.image)]
          }
          currentIndex={activeImageIndex}
        />
      )}
    </>
  );
}

