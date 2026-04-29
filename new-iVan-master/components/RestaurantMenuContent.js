"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { FaPlus, FaMinus } from 'react-icons/fa';
import { getFileUrl, formatAmountToCurrency, isShopClosed } from "@/utils/helper";
import MenuCategoryFilter from "@/components/MenuCategoryFilter";
import Pagination from "@/components/Pagination";
import LoginModal from "@/components/Modals/LoginModal";
import CartResetConfirmationModal from "@/components/Modals/CartResetConfirmationModal";
import ImageLightbox from "@/components/ImageLightbox";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import { useCart } from "@/lib/contexts/CartContext";

export default function RestaurantMenuContent({ restaurantId, hideHeader = false, type = "restaurant", shopData = null }) {
  const { id: routeId } = useParams();
  const id = restaurantId || routeId;
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations('RestaurantMenuPage');
  const { updateCartProduct, isProductInCart, removeProductFromCart } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    cuisine: "",
    menuCategory: "",
    sortBy: "name_asc",
    showFavorites: false,
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [pendingMenuItem, setPendingMenuItem] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const isReservationView = type === "reservation";
  const isRestaurantShop = (shopData?.type || "").toLowerCase() === "restaurant";
  const categoryFilterType = isRestaurantShop ? "restaurant" : "shop";

  const fetchMenuItems = useCallback(async (page = 1, search = "", filterParams = {}) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(search && { search: search }),
        ...(filterParams.category && { category: filterParams.category }),
        ...(filterParams.cuisine && { cuisine: filterParams.cuisine }),
        ...(filterParams.menuCategory && { menuCategory: filterParams.menuCategory }),
      });

      const response = await fetch(`/api/products/public?${params.toString()}&shopId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.products || []);
        setPagination(prev => data.pagination || prev);
      } else {
        toast.error(t('failed_fetch_menu'));
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error(t('error_fetching_menu'));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  // Fetch cart items to get quantities
  const fetchCartItems = useCallback(async () => {
    if (status === "loading" || !session?.user || session?.user?.role !== "visitor") {
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
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") return;
    fetchMenuItems();
    fetchCartItems();
  }, [session, status, id, fetchMenuItems, fetchCartItems]);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (searchTerm) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchMenuItems(1, searchTerm, filters);
        }, 500);
      };
    })(),
    [filters, fetchMenuItems]
  );

  const handlePageChange = (page) => {
    fetchMenuItems(page, searchQuery, filters);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    fetchMenuItems(1, searchQuery, newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: "",
      cuisine: "",
      menuCategory: "",
      sortBy: "name_asc",
      showFavorites: false,
    };
    setFilters(clearedFilters);
    fetchMenuItems(1, searchQuery, clearedFilters);
  };

  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleIncrementQuantity = async (product) => {
    if (status === "loading") return;

    if (isShopClosed(shopData?.shop_metadata?.openingHours)) {
      toast.error(t('shop_closed_order'));
      return;
    }

    if (!session) {
      setPendingMenuItem(product);
      setIsLoginModalOpen(true);
      return;
    }

    if (session?.user?.role !== "visitor") {
      toast.error(t('only_customers_cart'));
      return;
    }

    if (!product.isAvailable) {
      toast.error(t('item_unavailable'));
      return;
    }

    const currentQuantity = getCartQuantity(product.id);
    
    if (currentQuantity === 0) {
      // First time adding to cart
      const result = await updateCartProduct(product?.id, 1, "add");
      if (result.requireReset) {
        setResetData(result.data);
        setPendingMenuItem(product);
        setIsResetModalOpen(true);
      } else if (result.success) {
        toast.success(t('item_added_cart'));
        fetchCartItems();
      } else {
        toast.error(result.error === "shop_closed" ? t('shop_closed_order') : t('failed_add_item'));
      }
    } else {
      const result = await updateCartProduct(product?.id, 1, "increment");
      if (result.success) {
        fetchCartItems();
      } else {
        toast.error(result.error === "shop_closed" ? t('shop_closed_order') : t('failed_add_item'));
      }
    }
  };

  const handleDecrementQuantity = async (product) => {
    if (status === "loading") return;

    if (!session) {
      return;
    }

    if (session?.user?.role !== "visitor") {
      toast.error(t('only_customers_cart'));
      return;
    }

    const currentQuantity = getCartQuantity(product.id);
    
    if (currentQuantity <= 1) {
      // Remove from cart if quantity is 1 or less
      const result = await removeProductFromCart(product.id);
      if (result.success) {
        toast.success(t('item_removed_cart'));
        fetchCartItems();
      } else {
        toast.error(t('failed_remove_item'));
      }
    } else {
      // Decrement quantity
      const result = await updateCartProduct(product?.id, 1, "decrement");
      if (result.success) {
        fetchCartItems();
      } else {
        toast.error(t('failed_remove_item'));
      }
    }
  };

  const handleResetConfirm = async () => {
    if (!pendingMenuItem) return;
    setIsResetModalOpen(false);
    const result = await updateCartProduct(pendingMenuItem.id, 1, "reset-add");
    if (result.success) {
      toast.success(t('item_added_cart'));
      setPendingMenuItem(null);
      setResetData(null);
      fetchCartItems();
    } else {
      toast.error(result.error === "shop_closed" ? t('shop_closed_order') : t('failed_add_item'));
    }
  };

  const handleResetCancel = () => {
    setIsResetModalOpen(false);
    setPendingMenuItem(null);
    setResetData(null);
  };

  const handleLoginSuccess = () => {
    if (pendingMenuItem) {
      handleIncrementQuantity(pendingMenuItem);
      setPendingMenuItem(null);
    }
    fetchCartItems();
  };

  const filteredMenuItems = menuItems || [];



  // Regular restaurant layout
  return (
    <>
      <div className="services_detail_header">
        {/* Search Bar */}
        {!hideHeader && (
          <div className="row mb-4 mt-2 d-none d-md-flex">
            <div className="col-12">
              <div className="position-relative">
                <div className="input-group" style={{ borderRadius: "50px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  <span className="input-group-text bg-white border-end-0 border-0" style={{ borderRadius: "50px 0 0 50px", paddingLeft: "20px" }}>
                    <i className="bi bi-search text-muted" style={{ fontSize: "18px" }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 border-0 main_search_filed shadow-none"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ borderRadius: "0 50px 50px 0", padding: "12px 20px", fontSize: "16px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="row g-4">
          {/* Sidebar - Filter Section */}
          <div className="d-none d-md-block col-lg-3 col-md-4">
            <div className="bg-white rounded-3 p-4 shadow-sm h-100" style={{ border: "1px solid #e5e7eb", position: "sticky", top: "20px" }}>
              <h5 className="fw-semibold mb-4 text-dark" style={{ fontSize: "20px", color: "#1f2937" }}>{t('filters')}</h5>

              {/* Category Filter */}
              <div className="mb-4">
                <h6 className="text-muted mb-3 fw-semibold" style={{ fontSize: "14px", color: "#6b7280" }}>{t('category')}</h6>
                <MenuCategoryFilter
                  menuItems={menuItems}
                  selectedCategory={filters.category}
                  onCategoryChange={(category) => handleFilterChange("category", category)}
                  showAllOption={true}
                  variant="dropdown"
                  type={categoryFilterType}
                />
              </div>

              {/* Cuisine Filter */}
              {isRestaurantShop && (
                <div className="mb-4">
                  <h6 className="text-muted mb-3 fw-semibold" style={{ fontSize: "14px", color: "#6b7280" }}>{t('cuisine')}</h6>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={t('filter_by_cuisine')}
                    value={filters.cuisine}
                    onChange={(e) => handleFilterChange("cuisine", e.target.value)}
                    style={{ borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* Menu Category Filter */}
              {isRestaurantShop && (
                <div className="mb-4">
                  <h6 className="text-muted mb-3 fw-semibold" style={{ fontSize: "14px", color: "#6b7280" }}>{t('menu_category')}</h6>
                  <select
                    className="form-select form-select-sm"
                    style={{ borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: "14px" }}
                    value={filters.menuCategory}
                    onChange={(e) => handleFilterChange("menuCategory", e.target.value)}
                  >
                    <option value="">{t('all_categories')}</option>
                    {isReservationView ? (
                      <>
                        <option value="Starters">Starters</option>
                        <option value="Mains">Mains</option>
                        <option value="Sides">Sides</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Drinks">Drinks</option>
                      </>
                    ) : (
                      <>
                        <option value="Starters">Starters</option>
                        <option value="Main Dishes">Main Dishes</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Drinks">Drinks</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Sort By */}
              <div className="mb-4">
                <h6 className="text-muted mb-3 fw-semibold" style={{ fontSize: "14px", color: "#6b7280" }}>{t('sort_by')}</h6>
                <select
                  className="form-select form-select-sm"
                  style={{ borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: "14px" }}
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  <option value="name_asc">{t('name_asc')}</option>
                  <option value="name_desc">{t('name_desc')}</option>
                  <option value="price_asc">{t('price_asc')}</option>
                  <option value="price_desc">{t('price_desc')}</option>
                </select>
              </div>

              <button
                className="custom_btn_outline--small btn-sm w-100 rounded-pill mt-3"
                onClick={handleClearFilters}
                style={{ padding: "10px", fontWeight: "500", border: "1px solid #d1d5db" }}
              >
                {t('clear_all_filters')}
              </button>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="col-lg-9 col-md-8">
            {/* Mobile Menu Category Filter - Only for reservation type */}
            {isRestaurantShop && (
              <div className="d-md-none mb-2">
                <div className="row mb-3 ">
                  <div className="col-12">
                    <div className="position-relative">
                      <div className="input-group" style={{ borderRadius: "50px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                        <span className="input-group-text bg-white border-end-0 border-0" style={{ borderRadius: "50px 0 0 50px", paddingLeft: "20px" }}>
                          <i className="bi bi-search text-muted" style={{ fontSize: "18px" }}></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 border-0 main_search_filed shadow-none"
                          placeholder={t('search_placeholder')}
                          value={searchQuery}
                          onChange={handleSearchChange}
                          style={{ borderRadius: "0 50px 50px 0", padding: "12px 20px", fontSize: "16px" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => handleFilterChange("menuCategory", "")}
                      className={`px-3 py-2 rounded-pill text-nowrap border transition-all ${
                        filters.menuCategory === ""
                          ? "bg_red text-white border-red-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap" }}
                    >
                      {t('all')}
                    </button>
                    {["Starters", "Mains", "Sides", "Desserts", "Drinks"].map((category) => (
                      <button
                        key={category}
                        onClick={() => handleFilterChange("menuCategory", category)}
                        className={`px-3 py-2 rounded-pill text-nowrap border transition-all ${
                          filters.menuCategory === category
                            ? "bg_red text-white border-red-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap" }}
                      >
                        {category}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* <div className="d-flex justify-content-between items-start mb-4 gap-3 flex-wrap">
              <h6 className="text-muted mb-0 fw-semibold" style={{ fontSize: "16px", color: "#6b7280" }}>
                {t('showing_items', { count: filteredMenuItems.length })}
              </h6>
            </div> */}

            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm animate-pulse" style={{ borderRadius: "16px" }}>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredMenuItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3 shadow-sm" style={{ borderRadius: "16px" }}>
                  <i className="bi bi-menu-button-wide display-1 text-muted"></i>
                  <h3 className="mt-3 text-gray-600">{t('no_items_found')}</h3>
                </div>
              ) : (
                filteredMenuItems.map((item, idx) => {
                  const quantity = getCartQuantity(item.id);
                  const itemImages = Array.isArray(item.imageUrls) && item.imageUrls.length > 0
                    ? item.imageUrls
                    : (item.image ? [getFileUrl(item.image)] : []);
                  const canOpenDetail = isRestaurantShop;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col p-3 border border-gray-200 rounded-2xl hover:border-blue-300 transition-colors bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {itemImages.length > 0 ? (
                            <img
                              src={itemImages[0]}
                              alt={item.name}
                              className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 ${canOpenDetail ? "cursor-pointer" : ""}`}
                              onClick={() => canOpenDetail && router.push(`/restaurants/${id}/menu/${item.id}`)}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div 
                              className={`w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 ${canOpenDetail ? "cursor-pointer" : ""}`}
                              onClick={() => canOpenDetail && router.push(`/restaurants/${id}/menu/${item.id}`)}
                            >
                              <i className="bi bi-image text-gray-400 text-2xl"></i>
                            </div>
                          )}
                         
                          <div className="flex-1">
                            <h3
                              className={`font-semibold text-lg text-gray-900 mb-1 ${canOpenDetail ? "cursor-pointer hover:underline" : ""}`}
                              onClick={() => canOpenDetail && router.push(`/restaurants/${id}/menu/${item.id}`)}
                            >
                              {item.name}
                            </h3>
                            {item.menuCategory && (
                              <span className="inline-block px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md mb-1">
                                {item.menuCategory}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 text-lg font-semibold">
                          {formatAmountToCurrency(Number(item.price))}
                        </p>
                      </div>

                 
                          <div className="border-t border-gray-300 my-2" ></div>
                          <div className="flex items-center justify-between pt-2">
                            {item.description && (
                              <p 
                                className="text-gray-600 text-sm mr-3 flex-1 line-clamp-3 md:line-clamp-2"
                                style={{
                                  lineHeight: '1.4'
                                }}
                              >
                                {item.description}
                              </p>
                            )}
                    {!isReservationView && (
                        <>
                            <div className="flex items-center border-t border-b border-gray-200 rounded-full">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecrementQuantity(item);
                                }}
                                className="w-6 h-6 bg_red flex items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!item.isAvailable || quantity === 0}
                              >
                                <FaMinus className="text-[12px]" />
                              </button>

                              <span className="px-1 bg-white rounded-full text-center font-bold text-base text-gray-900 min-w-[1.5rem]">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIncrementQuantity(item);
                                }}
                                className="w-6 h-6 flex bg_red items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!item.isAvailable}
                              >
                                <FaPlus className="text-[12px]" />
                              </button>
                            </div>
                            </>
                          )}
                          </div>
                        
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="d-flex justify-content-center mt-5">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingMenuItem(null);
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
      <ImageLightbox
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        images={lightboxImage ? [lightboxImage] : []}
        currentIndex={0}
      />
    </>
  );
}

