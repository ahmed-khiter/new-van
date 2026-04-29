"use client";
import Pagination from "@/components/Pagination";
import CategoryFilter from "@/components/CategoryFilter";
import LoginModal from "@/components/Modals/LoginModal";
import CartResetConfirmationModal from "@/components/Modals/CartResetConfirmationModal";
import ShopHeaderCard from "@/components/ShopHeaderCard";
import AboutUsSection from "@/components/AboutUsSection";
import DeliveryInfoBanner from "@/components/DeliveryInfoBanner";
import FeedbackSection from "@/components/FeedbackSection";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/contexts/CartContext";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { getCurrencyByLocation, getAvailableCurrencies, getCurrencySymbol, getExchangeRates, convertPrice, getOpenStatusBadge, getShopTimeBadge, isShopClosed, formatAmountToCurrency, calculateDistance, calculateDeliveryTimeMinutes } from "@/utils/helper";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaPlus, FaMinus } from "react-icons/fa";
import ImageLightbox from "@/components/ImageLightbox";
import Gallery from "@/components/Gallery";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import { GoArrowLeft } from "react-icons/go";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ADD_TO_ORDER_CONTEXT_KEY = "addToOrderContext";

function ProductCard({ product, quantity, displayPrice, isOutOfStock, onIncrement, onDecrement, onNavigate, formatPrice }) {
  const imgSrc = product.imageUrls?.[0] || product.imageUrl;
  // Sale price detection
  const hasSale = product.variants?.enabled
    ? product.variants.items?.some(i => i.salePrice != null && i.salePrice < i.price)
    : (product.salePrice != null && product.salePrice < product.price);
  const originalPrice = product.variants?.enabled
    ? (product.variants.items?.[0]?.price ?? null)
    : (product.price ?? null);

  return (
    <div className="group w-full">
      <div className="relative mb-2.5">
        <div
          className="aspect-square cursor-pointer overflow-hidden rounded-[14px] bg-white"
          onClick={onNavigate}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={product.name}
              className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#d1d5db]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </div>
          )}
          {hasSale && (
            <span className="absolute left-2 top-2 rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[10px] font-bold text-white">SALE</span>
          )}
        </div>
        {!isOutOfStock ? (
          quantity > 0 ? (
            <div className="absolute -bottom-2 right-1.5 flex items-center gap-0 rounded-full bg-[#1a1a2e] shadow-md">
              <button onClick={(e) => { e.stopPropagation(); onDecrement(product); }} className="flex h-7 w-7 items-center justify-center text-white">
                <FaMinus size={8} />
              </button>
              <span className="min-w-[1.1rem] text-center text-[11px] font-bold text-white">{quantity}</span>
              <button onClick={(e) => { e.stopPropagation(); onIncrement(product); }} className="flex h-7 w-7 items-center justify-center text-white">
                <FaPlus size={8} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onIncrement(product); }}
              className="absolute -bottom-2 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a2e] text-white shadow-md transition hover:scale-110 active:scale-95"
            >
              <FaPlus size={10} />
            </button>
          )
        ) : (
          <span className="absolute -bottom-2 right-1.5 rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-semibold text-[#9ca3af]">Out of stock</span>
        )}
      </div>
      <h4 className="mb-0.5 cursor-pointer truncate text-[13px] font-semibold leading-snug text-[#1a1a2e]" onClick={onNavigate}>
        {product.name}
      </h4>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[13px] font-bold text-[#1a1a2e]">{formatPrice(displayPrice)}</span>
        {hasSale && originalPrice != null && (
          <span className="text-[11px] text-[#9ca3af] line-through">{formatPrice(Number(originalPrice))}</span>
        )}
      </div>
    </div>
  );
}

function CategoryCarousel({ title, count, onViewAll, items, onIncrement, onDecrement, onNavigate, formatPrice, getCartQuantity, getDisplayPrice, getVariantStock }) {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 640, behavior: "smooth" });
  };
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-[17px] font-black uppercase italic tracking-[-0.03em] text-[#1a1a2e]">
          {title}.
        </h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-[#6b7280] transition hover:text-[#1a1a2e]"
        >
          {count} items
          <FiChevronRight size={13} />
        </button>
      </div>
      <div className="group/carousel relative">
        <div
          ref={scrollRef}
          className="grid auto-cols-[calc(50%-8px)] grid-flow-col gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden sm:auto-cols-[calc(33.333%-11px)] md:auto-cols-[calc(25%-12px)]"
        >
          {items.map((product) => {
            const quantity = getCartQuantity(product.id);
            const displayPrice = getDisplayPrice(product);
            const variantStock = getVariantStock(product);
            const isOutOfStock = variantStock === 0;
            return (
              <ProductCard
                key={product.id}
                product={product}
                quantity={quantity}
                displayPrice={displayPrice}
                isOutOfStock={isOutOfStock}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onNavigate={() => onNavigate(product.id)}
                formatPrice={formatPrice}
              />
            );
          })}
        </div>
        <button
          onClick={() => scroll(-1)}
          className="absolute -left-3 top-[35%] z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-[#ebebeb] bg-white text-[#374151] shadow-md transition hover:shadow-lg group-hover/carousel:md:flex"
        >
          <FiChevronLeft size={15} />
        </button>
        <button
          onClick={() => scroll(1)}
          className="absolute -right-3 top-[35%] z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-[#ebebeb] bg-white text-[#374151] shadow-md transition hover:shadow-lg group-hover/carousel:md:flex"
        >
          <FiChevronRight size={15} />
        </button>
      </div>
    </section>
  );
}

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations('ShopProductsPage');
  const tReservation = useTranslations("ReservationPage");
  const { updateCartProduct, isProductInCart, removeProductFromCart } = useCart();
  const { toggleFavorite, isLoading: favoriteLoading, isVisitor } = useFavorites();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShopLoading, setIsShopLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
    sortBy: "name_asc",
    showFavorites: false,
  });
  const [selectedCurrency, setSelectedCurrency] = useState("GBP");
  const exchangeRates = getExchangeRates();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [addToOrderDeadline, setAddToOrderDeadline] = useState(null);
  const [addToOrderTimeRemaining, setAddToOrderTimeRemaining] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const deliveryTimeMinutes = useMemo(() => {
    if (!shop) return null;

    if (shop.distance !== null && shop.distance !== undefined) {
      return calculateDeliveryTimeMinutes(shop.distance);
    }

    const distance = calculateDistance(
      selectedLocation?.lat,
      selectedLocation?.lng,
      shop?.latitude,
      shop?.longitude
    );

    return distance !== null ? calculateDeliveryTimeMinutes(distance) : null;
  }, [shop, selectedLocation]);

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('link_copied'));
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(t('link_copied'));
      }
    } catch (err) {
      console.log('Error copying to clipboard:', err);
      toast.error(t('failed_copy_link'));
    }
  };

  const fetchShop = useCallback(async () => {
    if (!id) return;
    
    setIsShopLoading(true);
    try {
      const response = await fetch(`/api/shops/public/${id}?type=shop`);
      if (response.ok) {
        const data = await response.json();
        setShop(data);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch shop details");
      }
    } catch (error) {
      console.error("Error fetching shop:", error);
      toast.error("Failed to fetch shop details");
    } finally {
      setIsShopLoading(false);
    }
  }, [id]);

  const fetchProducts = async (page = 1, search = "", filterParams = {}) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search: search }),
        ...(filterParams.category && { category: filterParams.category }),
        ...(filterParams.subcategory && { subcategory: filterParams.subcategory }),
        ...(filterParams.minPrice && { minPrice: filterParams.minPrice }),
        ...(filterParams.maxPrice && { maxPrice: filterParams.maxPrice }),
        ...(filterParams.inStockOnly && {
          inStockOnly: filterParams.inStockOnly,
        }),
        ...(filterParams.sortBy && { sortBy: filterParams.sortBy }),
        ...(filterParams.showFavorites && { showFavorites: filterParams.showFavorites }),
        ...(id && { shopId: id }),
        ...(session?.user?.id && isVisitor && { userId: session.user.id }),
      });

      const response = await fetch(`/api/products/public?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Sample product categories:', data.products?.slice(0, 3).map(p => p.category) || []);
        setProducts(data.products || []);
        setPagination(data.pagination || pagination);
      } else {
        toast.error(t('failed_fetch_products'));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(t('error_fetching_products'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSubcategories = useCallback(async () => {
    if (!id) return;

    try {
      const params = new URLSearchParams({
        shopId: id,
        subcategoriesOnly: "true",
      });

      const response = await fetch(`/api/products/public?${params}`);
      if (!response.ok) return;

      const data = await response.json();
      const subcategoryNames = (data?.subcategories || [])
        .map((item) => item?.name)
        .filter(Boolean);

      setAvailableSubcategories(subcategoryNames);
    } catch (error) {
      console.error("Error fetching available subcategories:", error);
    }
  }, [id]);

  // Load location from localStorage and set appropriate currency
  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setSelectedLocation(location);
        const regionCurrency = getCurrencyByLocation(location);
        setSelectedCurrency(regionCurrency);
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    }
  }, []);

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
    fetchShop();
    fetchProducts();
    fetchCartItems();
    fetchAvailableSubcategories();
  }, [session, status, fetchCartItems, fetchShop, fetchAvailableSubcategories]);

  useEffect(() => {
    if (!filters.subcategory) return;
    if (availableSubcategories.includes(filters.subcategory)) return;

    handleFilterChange("subcategory", "");
  }, [filters.subcategory, availableSubcategories]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (searchTerm) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchProducts(1, searchTerm, filters);
        }, 500); // 500ms delay
      };
    })(),
    [filters]
  );

  const handlePageChange = (page) => {
    fetchProducts(page, searchQuery, filters);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    fetchProducts(1, searchQuery, newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: "",
      subcategory: "",
      minPrice: "",
      maxPrice: "",
      inStockOnly: false,
      sortBy: "name_asc",
      showFavorites: false,
    };
    setFilters(clearedFilters);
    fetchProducts(1, searchQuery, clearedFilters);
  };

  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleIncrementQuantity = async (product) => {
    if (status === "loading") return;

    if (isShopClosed(shop?.shop_metadata?.openingHours)) {
      toast.error(t('shop_closed_order'));
      return;
    }

    if (!session) {
      setPendingProduct(product);
      setIsLoginModalOpen(true);
      return;
    }

    if (session?.user?.role !== "visitor") {
      toast.error(t('only_customers_cart'));
      return;
    }

    const hasVariants = product.variants?.enabled && product.variants?.items?.length > 0;
    const effectiveStock = getVariantStock(product);

    if (effectiveStock === 0) {
      toast.error(t('product_out_of_stock') || 'Product is not available');
      return;
    }
    if (hasVariants && !selectedVariants[product.id]) {
      toast.error(t('please_select_size') || 'Please select a size first');
      return;
    }

    const currentQuantity = getCartQuantity(product.id);
    
    const variant = selectedVariants[product.id] || null;

    if (currentQuantity === 0) {
      const result = await updateCartProduct(product?.id, 1, "add", variant);
      if (result.requireReset) {
        setResetData(result.data);
        setPendingProduct(product);
        setIsResetModalOpen(true);
      } else if (result.success) {
        toast.success(t('product_added_cart'));
        fetchCartItems();
      } else {
        toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
      }
    } else {
      const result = await updateCartProduct(product?.id, 1, "increment");
      if (result.success) {
        fetchCartItems();
      } else {
        toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
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
        toast.success(t('product_removed_cart'));
        fetchCartItems();
      } else {
        toast.error(result.error || t('failed_remove_product'));
      }
    } else {
      // Decrement quantity
      const result = await updateCartProduct(product?.id, 1, "decrement");
      if (result.success) {
        fetchCartItems();
      } else {
        toast.error(result.error || t('failed_remove_product'));
      }
    }
  };

  const handleResetConfirm = async () => {
    if (!pendingProduct) return;
    setIsResetModalOpen(false);
    const variant = selectedVariants[pendingProduct.id] || null;
    const result = await updateCartProduct(pendingProduct.id, 1, "reset-add", variant);
    if (result.success) {
      toast.success(t('product_added_cart'));
      setPendingProduct(null);
      setResetData(null);
      fetchCartItems();
    } else {
      toast.error(result.error === "shop_closed" ? t('shop_closed_order') : (result.error || t('failed_add_product')));
    }
  };

  const handleResetCancel = () => {
    setIsResetModalOpen(false);
    setPendingProduct(null);
    setResetData(null);
  };

  const handleLoginSuccess = () => {
    if (pendingProduct) {
      handleIncrementQuantity(pendingProduct);
      setPendingProduct(null);
    }
    fetchCartItems();
  };

  const handleBack = () => {
    router.push(`/shops?category=all`);
  };

  const handleVariantSelect = (productId, variantValue) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: prev[productId] === variantValue ? null : variantValue
    }));
  };

  const getDisplayPrice = (product) => {
    const variants = product.variants;
    if (variants?.enabled && variants?.items?.length > 0) {
      const selectedVal = selectedVariants[product.id];
      if (selectedVal) {
        const item = variants.items.find(i => i.value === selectedVal);
        if (item) {
          return item.salePrice ?? item.price;
        }
      }
      return variants.items[0].salePrice ?? variants.items[0].price;
    }
    return Number(product.price);
  };

  const getVariantStock = (product) => {
    const variants = product.variants;
    if (variants?.enabled && variants?.items?.length > 0) {
      const selectedVal = selectedVariants[product.id];
      if (selectedVal) {
        const item = variants.items.find(i => i.value === selectedVal);
        if (item) return item.stock;
      }
      return variants.items.reduce((sum, i) => sum + (i.stock || 0), 0);
    }
    return product.stock;
  };

  const filteredProducts = products || [];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(ADD_TO_ORDER_CONTEXT_KEY);
    if (!raw) return;

    try {
      const context = JSON.parse(raw);
      const isSameShop = String(context?.shopId) === String(id);
      const isShopFlow = context?.shopType === "shop";
      const expiresAt = Number(context?.expiresAt || 0);

      if (!isSameShop || !isShopFlow || !expiresAt || expiresAt <= Date.now()) {
        localStorage.removeItem(ADD_TO_ORDER_CONTEXT_KEY);
        setAddToOrderDeadline(null);
        setAddToOrderTimeRemaining(null);
        return;
      }

      setAddToOrderDeadline(expiresAt);
    } catch (error) {
      console.error("Invalid add-to-order context:", error);
      localStorage.removeItem(ADD_TO_ORDER_CONTEXT_KEY);
      setAddToOrderDeadline(null);
      setAddToOrderTimeRemaining(null);
    }
  }, [id]);

  useEffect(() => {
    if (!addToOrderDeadline) return;

    const updateRemaining = () => {
      const remaining = addToOrderDeadline - Date.now();
      if (remaining <= 0) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(ADD_TO_ORDER_CONTEXT_KEY);
        }
        setAddToOrderDeadline(null);
        setAddToOrderTimeRemaining(0);
        return;
      }
      setAddToOrderTimeRemaining(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [addToOrderDeadline]);

  const activeFilterCount = [
    filters.category,
    filters.subcategory,
    filters.minPrice,
    filters.maxPrice,
    filters.inStockOnly,
  ].filter(Boolean).length;

  return (
    <>
      <div className="min-h-screen bg-white">
      <div className="container">
        {/* Header */}
        <div className="relative mt-4">
          <button
            onClick={handleBack}
            className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:hidden"
            aria-label="Go back"
          >
            <GoArrowLeft className="h-4 w-4" />
          </button>
          <ShopHeaderCard
            shop={shop}
            isLoading={isShopLoading}
            onShare={handleShare}
            type="shop"
            showReservationButton={false}
          />
        </div>
        {/* Delivery info */}
        <div className="mb-4 mt-4">
          <DeliveryInfoBanner deliveryTimeMinutes={deliveryTimeMinutes} />
        </div>

        {/* Add-to-order countdown */}
        {addToOrderTimeRemaining !== null && addToOrderTimeRemaining > 0 && (
          <div className="mb-4 rounded-[14px] bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-800 text-center">
            ⏱ Add to Order &nbsp;·&nbsp;
            {Math.floor(addToOrderTimeRemaining / 60000).toString().padStart(2, "0")}:
            {Math.floor((addToOrderTimeRemaining % 60000) / 1000).toString().padStart(2, "0")}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5">
          <div className="inline-flex gap-0.5 rounded-full bg-[#f0f0f0] p-1">
            {[
              { key: "products", label: t("products"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/></svg>
              )},
              { key: "about", label: tReservation("about_us"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              )},
              { key: "gallery", label: tReservation("gallery"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              )},
              { key: "feedback", label: tReservation("feedback"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              )},
            ].map(({ key, label, icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 rounded-full py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-white px-4 text-[#1a1a2e] shadow-sm"
                      : "px-2.5 text-[#9ca3af] hover:text-[#6b7280]"
                  }`}
                >
                  {icon}
                  {isActive && label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-10">
          {/* Products Tab */}
          {activeTab === "products" && (
            <div>
              {/* Subcategory pills */}
              {availableSubcategories.length > 0 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  {["", ...availableSubcategories].map((sub, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleFilterChange("subcategory", sub)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                        filters.subcategory === sub
                          ? "bg-[#1a1a2e] text-white"
                          : "border border-[#d1d5db] bg-white text-[#374151] hover:border-[#9ca3af]"
                      }`}
                    >
                      {sub === "" ? "All" : sub}
                    </button>
                  ))}
                </div>
              )}

              {/* Category heading */}
              {shop?.categoryname && (
                <h2 className="mb-3 text-[18px] font-black italic uppercase tracking-[-0.03em] text-[#1a1a2e]">
                  {shop.categoryname}.
                </h2>
              )}

              {/* Search + Filter button row */}
              <div className="mb-5 flex items-center gap-3">
                <div className="relative flex-1">
                  <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    type="text"
                    placeholder={t("search_placeholder")}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="h-[46px] w-full rounded-full border border-[#d1d5db] bg-white pl-11 pr-4 text-[14px] text-[#1a1a2e] outline-none placeholder:text-[#9ca3af] focus:border-[#1a1a2e] transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="relative flex h-[46px] shrink-0 items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-4 text-[14px] font-medium text-[#374151] transition hover:border-[#9ca3af]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                  {t("filters")}
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1a1a2e] text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Products — carousel by subcategory or grid when filtered */}
              <div>
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, si) => (
                      <div key={si}>
                        <div className="mb-3 h-5 w-40 rounded bg-gray-100 animate-pulse" />
                        <div className="flex gap-4 overflow-hidden">
                          {Array.from({ length: 4 }).map((_, pi) => (
                            <div key={pi} className="w-[160px] shrink-0 animate-pulse">
                              <div className="aspect-square rounded-[14px] bg-gray-100 mb-2" />
                              <div className="h-3 w-3/4 rounded bg-gray-100 mb-1" />
                              <div className="h-3 w-1/2 rounded bg-gray-100" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="mb-4 text-5xl">📦</div>
                    <h3 className="text-[16px] font-semibold text-[#1a1a2e]">{t("no_products_found")}</h3>
                    <p className="mt-1 text-[13px] text-[#6b7280]">Try adjusting your search or filters.</p>
                  </div>
                ) : (() => {
                  const grouped = {};
                  filteredProducts.forEach((p) => {
                    const cat = p.subcategory || p.category || "All Products";
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(p);
                  });
                  const sections = Object.entries(grouped);
                  // Grid list when: searching, filtering by subcategory, OR only 1 category
                  const showGrid = filters.subcategory || searchQuery || sections.length <= 1;

                  if (showGrid) {
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => {
                          const quantity = getCartQuantity(product.id);
                          const displayPrice = getDisplayPrice(product);
                          const variantStock = getVariantStock(product);
                          const isOutOfStock = variantStock === 0;
                          return (
                            <ProductCard
                              key={product.id}
                              product={product}
                              quantity={quantity}
                              displayPrice={displayPrice}
                              isOutOfStock={isOutOfStock}
                              onIncrement={handleIncrementQuantity}
                              onDecrement={handleDecrementQuantity}
                              onNavigate={() => router.push(`/shops/${id}/products/${product.id}`)}
                              formatPrice={formatAmountToCurrency}
                            />
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-10">
                      {sections.map(([catName, catItems]) => (
                        <CategoryCarousel
                          key={catName}
                          title={catName}
                          count={catItems.length}
                          items={catItems}
                          onViewAll={() => handleFilterChange("subcategory", catName)}
                          onIncrement={handleIncrementQuantity}
                          onDecrement={handleDecrementQuantity}
                          onNavigate={(productId) => router.push(`/shops/${id}/products/${productId}`)}
                          formatPrice={formatAmountToCurrency}
                          getCartQuantity={getCartQuantity}
                          getDisplayPrice={getDisplayPrice}
                          getVariantStock={getVariantStock}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
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
          )}

          {activeTab === "about" && <AboutUsSection shop={shop} />}
          {activeTab === "gallery" && <Gallery images={shop?.gallery || []} isLoading={!shop} />}
          {activeTab === "feedback" && <FeedbackSection shop={shop} />}
        </div>
      </div>
      </div> {/* end bg-white */}

      {/* Filter bottom sheet — shared for all screen sizes */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[1055] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsFilterModalOpen(false)} />
          <div className="relative max-h-[82dvh] overflow-y-auto rounded-t-[24px] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d1d5db]" />
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1a1a2e]">{t("filters")}</h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f5] text-[#6b7280] hover:bg-[#ebebeb]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Currency */}
            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-[#374151]">Currency</p>
              <select
                className="h-[44px] w-full rounded-[12px] border border-[#d1d5db] bg-white px-3 text-[14px] text-[#1a1a2e] outline-none focus:border-[#1a1a2e]"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                {getAvailableCurrencies(selectedLocation).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-[#374151]">{t("price_range")}</p>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder={t("min")}
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className="h-[44px] w-full rounded-[12px] border border-[#d1d5db] bg-white px-3 text-[14px] outline-none focus:border-[#1a1a2e]"
                />
                <input
                  type="number"
                  placeholder={t("max")}
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className="h-[44px] w-full rounded-[12px] border border-[#d1d5db] bg-white px-3 text-[14px] outline-none focus:border-[#1a1a2e]"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-[#374151]">{t("availability")}</p>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  id="inStockSheet"
                  checked={filters.inStockOnly}
                  onChange={(e) => handleFilterChange("inStockOnly", e.target.checked)}
                  className="h-4 w-4 rounded border-[#d1d5db] accent-[#1a1a2e]"
                />
                <span className="text-[14px] text-[#374151]">{t("in_stock_only")}</span>
              </label>
            </div>

            {/* Sort */}
            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-[#374151]">{t("sort_by")}</p>
              <select
                className="h-[44px] w-full rounded-[12px] border border-[#d1d5db] bg-white px-3 text-[14px] text-[#1a1a2e] outline-none focus:border-[#1a1a2e]"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="name_asc">{t("name_asc")}</option>
                <option value="name_desc">{t("name_desc")}</option>
                <option value="price_asc">{t("price_asc")}</option>
                <option value="price_desc">{t("price_desc")}</option>
                <option value="created_desc">{t("newest_first")}</option>
                <option value="created_asc">{t("oldest_first")}</option>
              </select>
            </div>

            {/* Category */}
            <div className="mb-6">
              <p className="mb-2 text-[13px] font-semibold text-[#374151]">{t("category")}</p>
              <CategoryFilter
                selectedCategory={filters.category}
                onCategoryChange={(category) => handleFilterChange("category", category)}
                showAllOption={true}
                variant="cards"
                className="w-full"
                type="shop"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClearFilters}
                className="flex h-[48px] flex-1 items-center justify-center rounded-full border border-[#d1d5db] text-[14px] font-semibold text-[#374151] transition hover:border-[#9ca3af]"
              >
                {t("clear_all")}
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex h-[48px] flex-1 items-center justify-center rounded-full bg-[#1a1a2e] text-[14px] font-semibold text-white transition hover:opacity-90"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingProduct(null);
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
