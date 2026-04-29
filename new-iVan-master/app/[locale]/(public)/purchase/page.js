"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  getFileUrl,
  calculateDistance,
  formatAmountToCurrency,
} from "@/utils/helper";
import AddressInput from "@/components/Fields/AddressInput";
import { useCart } from "@/lib/contexts/CartContext";
import AddCardModal from "@/components/Modals/AddCardModal";
import { FiMapPin, FiPhone, FiCreditCard, FiChevronRight, FiChevronDown, FiEdit2, FiArrowLeft, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { IoLogoApple } from "react-icons/io5";
import dynamic from "next/dynamic";

const MapboxDeliveryMap = dynamic(() => import("@/components/MapboxDeliveryMap"), {
  ssr: false,
  loading: () => <div style={{ height: "100%", width: "100%", background: "#e8e8e4", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 14 }}>Loading map…</div>,
});

const ADD_TO_ORDER_CONTEXT_KEY = "addToOrderContext";

function getPaymentBadge(method, paymentType) {
  if (paymentType === "apple_pay") {
    return (
      <span style={{ width: 40, height: 40, borderRadius: 12, background: "#111", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <IoLogoApple size={20} />
      </span>
    );
  }

  const brand = String(method?.cardBrand || "").toLowerCase();
  if (brand === "mastercard") {
    return (
      <span style={{ width: 40, height: 40, borderRadius: 12, background: "#101e82", display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ff5f00", position: "absolute", left: 11 }} />
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#eb001b", position: "absolute", left: 7, opacity: 0.96 }} />
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#f79e1b", position: "absolute", right: 7, opacity: 0.96 }} />
      </span>
    );
  }

  if (brand === "visa") {
    return (
      <span style={{ width: 40, height: 40, borderRadius: 12, background: "#f4f7ff", color: "#1434cb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
        Visa
      </span>
    );
  }

  return (
    <span style={{ width: 40, height: 40, borderRadius: 12, background: "#f5f5f5", color: "#666", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <FiCreditCard size={18} />
    </span>
  );
}

function DrawerOrModal({ open, onClose, title, children }) {
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), 240);
    return () => window.clearTimeout(timeout);
  }, [open]);
  useEffect(() => {
    document.body.style.overflow = shouldRender ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [shouldRender]);
  if (!shouldRender) return null;

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontSize: 17, fontWeight: 700, color: "#222" }}>{title}</span>
      <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: 0, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#555", flexShrink: 0 }}>×</button>
    </div>
  );

  if (isMobile) {
    return (
      <div ref={ref} onClick={(e) => { if (e.target === ref.current) onClose(); }}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: `rgba(0,0,0,${isVisible ? 0.45 : 0})`, display: "flex", flexDirection: "column", justifyContent: "flex-end", transition: "background 220ms ease" }}>
        <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "88dvh", display: "flex", flexDirection: "column", transform: isVisible ? "translateY(0)" : "translateY(100%)", transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>
          <div style={{ padding: "14px 24px 12px" }}>{header}</div>
          <div style={{ overflowY: "auto", flex: 1, padding: "0 24px 40px" }}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} onClick={(e) => { if (e.target === ref.current) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: `rgba(0,0,0,${isVisible ? 0.45 : 0})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, transition: "background 220ms ease" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, padding: "24px 24px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0) scale(1)" : "translateY(18px) scale(0.98)", transition: "opacity 180ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {header}
        {children}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PurchasePage() {
  const t = useTranslations("PurchasePage");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const { updateCartProduct, removeProductFromCart } = useCart();
  const [vanSize, setVanSize] = useState("small_van");
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    deliveryCity: "",
    deliveryPostCode: "",
    deliveryLat: null,
    deliveryLng: null,
    customerPhone: "",
    handoffPreference: "hand_to_me",
    specialInstructions: "",
  });
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState("card");
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [addToOrderContext, setAddToOrderContext] = useState(null);
  const [addToOrderTimeRemaining, setAddToOrderTimeRemaining] = useState(null);
  const [sheet, setSheet] = useState(null); // "address" | "phone" | "notes" | "payment"
  const [draftPhone, setDraftPhone] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const cartEditorRef = useRef(null);

  const openSheet = (name) => {
    if (name === "phone") setDraftPhone(formData.customerPhone);
    if (name === "notes") setDraftNotes(formData.specialInstructions);
    setSheet(name);
  };
  const closeSheet = () => setSheet(null);

  const setField = useCallback((field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  }, []);

  const applyLocation = useCallback((loc) => {
    if (!loc) return;
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lng);
    const next = {
      ...loc,
      address: loc.address || "",
      city: loc.city || "",
      postcode: loc.postcode || loc.postCode || "",
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
    setDeliveryLocation(next);
    setFormData((p) => ({
      ...p,
      deliveryAddress: next.address,
      deliveryCity: next.city,
      deliveryPostCode: next.postcode,
      deliveryLat: next.lat,
      deliveryLng: next.lng,
    }));
  }, []);

  const clearAddToOrder = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(ADD_TO_ORDER_CONTEXT_KEY);
    setAddToOrderContext(null);
    setAddToOrderTimeRemaining(null);
  }, []);

  const isAddToOrderActive =
    !!addToOrderContext && addToOrderTimeRemaining !== null && addToOrderTimeRemaining > 0;

  // ── hydrate location from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || formData.deliveryAddress || deliveryLocation) return;
    try {
      const raw = localStorage.getItem("locationFilter");
      if (raw) {
        const loc = JSON.parse(raw)?.location;
        const lat = parseFloat(loc?.lat), lng = parseFloat(loc?.lng);
        if (loc?.address && Number.isFinite(lat) && Number.isFinite(lng)) {
          applyLocation({ address: loc.address, lat, lng, postcode: loc.postCode || loc.postcode || "", city: loc.city || "" });
          return;
        }
      }
      const raw2 = localStorage.getItem("selectedLocation");
      if (raw2) {
        const loc = JSON.parse(raw2);
        const lat = parseFloat(loc?.lat), lng = parseFloat(loc?.lng);
        if (loc?.address && Number.isFinite(lat) && Number.isFinite(lng)) {
          applyLocation({ address: loc.address, lat, lng, postcode: loc.postCode || loc.postcode || "", city: loc.city || "" });
        }
      }
    } catch (err) {
      console.error("Failed to restore checkout location from localStorage:", err);
    }
  }, [formData.deliveryAddress, deliveryLocation, applyLocation]);

  // ── add-to-order context
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ctx = JSON.parse(localStorage.getItem(ADD_TO_ORDER_CONTEXT_KEY) || "null");
      const exp = Number(ctx?.expiresAt || 0);
      if (!ctx?.sourceOrderId || !exp || exp <= Date.now()) { clearAddToOrder(); return; }
      setAddToOrderContext(ctx);
    } catch (err) {
      console.error("Failed to parse add-to-order context:", err);
      clearAddToOrder();
    }
  }, [clearAddToOrder]);

  useEffect(() => {
    if (!addToOrderContext?.expiresAt) return;
    const deadline = Number(addToOrderContext.expiresAt);
    const tick = () => {
      const r = deadline - Date.now();
      if (r <= 0) { clearAddToOrder(); return; }
      setAddToOrderTimeRemaining(r);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [addToOrderContext, clearAddToOrder]);

  // ── session guard + fetch cart
  useEffect(() => {
    if (status === "loading") return;
    if (!session) { toast.error(t("please_login")); router.push("/login"); return; }
    if (session?.user?.role !== "visitor") { router.push("/"); return; }
    fetchCartItems();
  }, [session?.user?.id, status]);

  // ── prefill phone from session
  useEffect(() => {
    const phone = session?.user?.phone || session?.user?.phoneNumber || session?.user?.mobileNumber || "";
    if (!phone || formData.customerPhone) return;
    setField("customerPhone", phone);
  }, [session?.user?.phone, session?.user?.phoneNumber, session?.user?.mobileNumber]);

  // ── prefill address from add-to-order
  useEffect(() => {
    if (!isAddToOrderActive || !session?.user?.id || !addToOrderContext?.sourceOrderId) return;
    (async () => {
      try {
        const res = await fetch(`/api/customer/orders/${addToOrderContext.sourceOrderId}`, {
          headers: { "user-id": session.user.id },
        });
        if (!res.ok) return;
        const order = (await res.json())?.order;
        if (!order?.deliveryAddress || !order?.deliveryLat || !order?.deliveryLng) return;
        applyLocation({ address: order.deliveryAddress, city: order.deliveryCity || "", postcode: order.deliveryPostCode || "", lat: parseFloat(order.deliveryLat), lng: parseFloat(order.deliveryLng) });
      } catch (err) {
        console.error("Failed to prefill address from existing order:", err);
      }
    })();
  }, [isAddToOrderActive, session?.user?.id, addToOrderContext?.sourceOrderId]);

  // ── shop mismatch guard
  useEffect(() => {
    if (!addToOrderContext || !cartItems.length) return;
    if (String(cartItems[0]?.product?.shopId) !== String(addToOrderContext.shopId)) clearAddToOrder();
  }, [addToOrderContext, cartItems]);

  // ── helpers
  const getItemData = (item) => item.product || item.menuItem;
  const getItemId = (item) => item.productId || item.menuItemId;
  const isProduct = (item) => !!item.productId;
  const getItemVariant = (item) => item.metadata?.selectedVariant || null;
  const getEffectivePrice = (item) => {
    const d = getItemData(item);
    if (!d) return 0;
    const v = getItemVariant(item);
    if (v && d.variants?.items) {
      const vi = d.variants.items.find((i) => i.value === v);
      if (vi) return Number(vi.salePrice ?? vi.price);
    }
    return Number(d.price);
  };
  const fmt = (p) => formatAmountToCurrency(p);
  const formatCardBrand = (brand) => {
    const raw = String(brand || "Card").trim();
    if (!raw) return "Card";
    return raw.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };
  const formatCardLabel = (method) => {
    if (!method) return "Select payment method";
    const brand = formatCardBrand(method.cardBrand);
    return `${brand} \u25cf\u25cf\u25cf\u25cf ${method.lastFourDigit}`;
  };

  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.cartItems || []);
      } else toast.error(t("failed_fetch_cart"));
    } catch { toast.error(t("failed_fetch_cart")); }
    finally { setIsLoading(false); }
  };

  const handleIncrement = async (item) => {
    const id = item.itemId;
    setCartItems((p) => p.map((i) => getItemId(i) === id ? { ...i, quantity: i.quantity + 1 } : i));
    const r = await updateCartProduct(id, 1, "increment");
    if (!r?.success) { toast.error(t("failed_update_cart")); fetchCartItems(); }
  };
  const handleDecrement = async (item) => {
    if (item.quantity <= 1) return;
    const id = item.itemId;
    setCartItems((p) => p.map((i) => getItemId(i) === id ? { ...i, quantity: i.quantity - 1 } : i));
    const r = await updateCartProduct(id, 1, "decrement");
    if (!r?.success) { toast.error(t("failed_update_cart")); fetchCartItems(); }
  };
  const handleRemove = async (item) => {
    const id = item.itemId;
    setCartItems((p) => p.filter((i) => getItemId(i) !== id));
    const r = await removeProductFromCart(id);
    if (!r?.success) { toast.error(t("failed_remove_item")); fetchCartItems(); }
  };

  const calcDeliveryPrice = async (lat, lng) => {
    if (!cartItems.length || !lat || !lng) return;
    setIsCalculatingDelivery(true);
    try {
      const first = cartItems[0];
      const d = getItemData(first);
      if (!d || !isProduct(first) || !d.pickupLat || !d.pickupLng) return;
      const distance = calculateDistance(d.pickupLat, d.pickupLng, lat, lng);
      const res = await fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "Van",
          jobDetails: { distance },
          cartItems: cartItems.map((i) => ({ name: i.product.name, quantity: i.quantity, weight: i.product.weight, dimensions: i.product.dimensions })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalculatedDistance(distance);
        setDeliveryPrice(data.price);
        setVanSize(data.vanSize || "small_van");
      }
    } catch (err) {
      console.error("Failed to calculate delivery price:", err);
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  const handleAddressSelect = (loc) => {
    applyLocation(loc);
    const lat = parseFloat(loc.lat), lng = parseFloat(loc.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) calcDeliveryPrice(lat, lng);
    closeSheet();
  };

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoadingMethods(true);
    try {
      const response = await fetch("/api/stripe-profile");
      const result = await response.json();
      if (result.success && result.data) {
        const validCards = Array.isArray(result.data) ? result.data.filter((c) => c && c.id) : [];
        setPaymentMethods(validCards);
        const defaultCard = validCards.find((c) => c.default === true || c.default === 1);
        setSelectedPaymentMethod(defaultCard || validCards[0] || null);
        if (validCards.length > 0) setSelectedPaymentType("card");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handlePlaceOrder = async () => {
    if (!formData.deliveryAddress) { toast.error(t("delivery_address_required")); return; }
    if ((formData.customerPhone || "").replace(/\D/g, "").length < 7) { toast.error("Enter a valid mobile number"); return; }
    if (!cartItems.length) { toast.error(t("cart_empty_error")); return; }
    if (selectedPaymentType === "card" && !selectedPaymentMethod) { toast.error("Select a payment method to continue"); return; }

    setIsSubmitting(true);
    try {
      const checkoutRes = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAddress: formData.deliveryAddress,
          deliveryCity: formData.deliveryCity,
          deliveryPostCode: formData.deliveryPostCode,
          deliveryLat: formData.deliveryLat,
          deliveryLng: formData.deliveryLng,
          specialInstructions: formData.specialInstructions,
          deliveryPrice: isAddToOrderActive ? 0 : deliveryPrice,
          calculatedDistance,
          vanSize,
          addToOrder: isAddToOrderActive,
          sourceOrderId: isAddToOrderActive ? addToOrderContext?.sourceOrderId : null,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        toast.error(checkoutData.error || t("failed_create_order"));
        return;
      }
      if (!checkoutData.requiresPayment) {
        toast.success(t("order_created_successfully"));
        router.push("/");
        return;
      }

      const payRes = await fetch("/api/orders/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: checkoutData.orderId,
          jobId: checkoutData.jobId,
          paymentMethodId: selectedPaymentType === "apple_pay" ? null : selectedPaymentMethod?.paymentMethodId,
          paymentType: selectedPaymentType,
        }),
      });
      const payResult = await payRes.json();
      if (payRes.ok && payResult.success) {
        localStorage.removeItem("pendingCheckoutState");
        toast.success(payResult.message || "Order placed!");
        router.push("/customer/jobs");
      } else {
        toast.error(payResult.error || "Payment failed");
      }
    } catch {
      toast.error(t("failed_create_order"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived from cart — must be declared before any callback that references it
  const shopData = cartItems[0]?.product?.shop;

  const handleAddCard = () => { closeSheet(); setShowAddCardModal(true); };
  const handleAddCardSuccess = (newCard) => {
    setPaymentMethods((p) => [...p, newCard]);
    setSelectedPaymentMethod(newCard);
    setSelectedPaymentType("card");
    setShowAddCardModal(false);
  };
  const handleBackToShop = useCallback(() => {
    const currentShopId = shopData?.id || cartItems[0]?.product?.shopId;
    if (currentShopId) {
      router.push(`/shops/${currentShopId}/products`);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/shops");
  }, [router, shopData?.id, cartItems]);
  const openCartEditor = useCallback(() => {
    setIsCartExpanded(true);
    window.setTimeout(() => {
      cartEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  // ── derived display values
  const handoffOptions = [
    { id: "hand_to_me", label: "Hand it to me" },
    { id: "leave_at_door", label: "Leave it at my door" },
  ];
  const subtotal = cartItems.reduce((s, i) => s + getEffectivePrice(i) * i.quantity, 0);
  const total = subtotal + (isAddToOrderActive ? 0 : deliveryPrice);
  const etaLabel = calculatedDistance > 0 ? `${Math.max(12, Math.round(calculatedDistance * 9))} min` : null;
  const etaBadgeLabel = etaLabel ? etaLabel.replace("min", "Mins") : "24 Mins";
  const distanceBadgeLabel = calculatedDistance > 0 ? `${calculatedDistance.toFixed(1)} miles` : "2.1 miles";
  const accentColor = "#e61e4d";

  const normalizedItems = cartItems.map((item) => {
    const d = getItemData(item);
    if (!d) return null;
    const itemId = getItemId(item);
    const isProductItem = isProduct(item);
    const variant = getItemVariant(item);
    let incrementDisabled = false;
    if (isProductItem) {
      if (variant && d.variants?.items) {
        const mv = d.variants.items.find((e) => e.value === variant);
        if (mv) incrementDisabled = item.quantity >= mv.stock;
      } else { incrementDisabled = item.quantity >= d.stock; }
    }
    return { id: item.id, itemId, isProductItem, name: d.name, image: d.image ? getFileUrl(d.image) : "", variant, variantOptionName: d.variants?.optionName || null, quantity: item.quantity, linePrice: getEffectivePrice(item) * item.quantity, unitPrice: getEffectivePrice(item), incrementDisabled };
  }).filter(Boolean);

  const hasValidPayment = selectedPaymentType === "apple_pay" || !!selectedPaymentMethod;
  const canPlace = !!deliveryLocation && (formData.customerPhone || "").replace(/\D/g, "").length >= 7 && hasValidPayment && !isSubmitting && !isCalculatingDelivery;

  const LABEL = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999", margin: "0 0 14px" };
  const gradientCTA = "linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)";
  const selectedPaymentTitle = selectedPaymentType === "apple_pay" ? "Apple Pay" : formatCardLabel(selectedPaymentMethod);
  const selectedPaymentSubtitle = selectedPaymentType === "apple_pay" ? "Tap to pay with Apple Pay" : "Saved payment method";
  const receiptRippleStyle = (index) => ({ animationDelay: `${index * 55}ms` });
  const dropoffReceiptNote = formData.specialInstructions.trim();
  const hasDropoffReceiptNote = !!dropoffReceiptNote;

  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <p style={{ color: "#999", fontSize: 15 }}>{t("loading_cart")}</p>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#fff", padding: 24 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: "#222" }}>{t("cart_empty")}</p>
        <p style={{ fontSize: 14, color: "#888" }}>{t("add_products_to_cart")}</p>
        <button onClick={() => router.push("/shops")} style={{ marginTop: 12, padding: "14px 40px", background: gradientCTA, color: "#fff", border: 0, borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          {t("browse_products")}
        </button>
      </div>
    );
  }

  const pillInput = {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "14px 16px", border: "1.5px solid #e8e8e8", borderRadius: 999,
    background: "#fff", cursor: "pointer", textAlign: "left", boxSizing: "border-box",
  };

  return (
    <>
      <div style={{ minHeight: "100dvh", background: "#fff", paddingBottom: 108 }}>
        <div className="purchase-page-layout">

          {/* ── Left column ── */}
          <div>
            <div className="checkout-card checkout-card--delay-0" style={{ paddingTop: 32, paddingBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 29, fontWeight: 900, color: "#161616", letterSpacing: "0.02em", textTransform: "uppercase", fontStyle: "italic", fontFamily: "Avenir Next, Avenir, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
                ORDER DETAILS
              </h1>
              <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", height: 30, borderRadius: 999, background: "#151515", color: "#fff", padding: "0 14px", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Arrival: {etaBadgeLabel}
              </div>
            </div>

            {/* Map */}
            <div className="checkout-card checkout-card--delay-1" style={{ position: "relative", height: 200, borderRadius: 16, overflow: "hidden", marginBottom: 20, background: "#e8e8e4" }}>
              <MapboxDeliveryMap location={deliveryLocation} zoom={16.2} style={{ borderRadius: 16 }} />
              <div style={{ position: "absolute", top: 14, left: 14, display: "inline-flex", alignItems: "center", gap: 10, height: 42, padding: "0 16px", borderRadius: 999, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(18,18,18,0.06)", boxShadow: "0 8px 20px rgba(15,15,15,0.12)", backdropFilter: "blur(12px)" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#31c56d", boxShadow: "0 0 0 4px rgba(49,197,109,0.14)" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>Drivers nearby</span>
              </div>
              <div style={{ position: "absolute", top: 14, right: 14, display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 999, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(18,18,18,0.06)", boxShadow: "0 8px 20px rgba(15,15,15,0.12)", backdropFilter: "blur(12px)" }}>
                <FiMapPin size={15} style={{ color: "#5f5f66", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{distanceBadgeLabel}</span>
              </div>
            </div>

            <div ref={cartEditorRef} className="checkout-card checkout-card--delay-2" style={{ marginBottom: 18 }}>
              <div style={{ border: "1px solid #171717", borderRadius: 20, background: "#fff", boxShadow: "0 16px 36px rgba(12,12,12,0.12)", overflow: "hidden", transition: "box-shadow 220ms ease" }}>
                <button
                  type="button"
                  onClick={() => setIsCartExpanded((prev) => !prev)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", border: 0, background: "#111", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
                    <FiShoppingBag size={18} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>Your cart</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.66)" }}>{normalizedItems.length} items · {fmt(subtotal)}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{isCartExpanded ? "Hide" : "Edit"}</span>
                  <FiChevronDown size={18} style={{ color: "rgba(255,255,255,0.78)", transform: isCartExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease" }} />
                </button>

                {isCartExpanded ? (
                  <div style={{ padding: "0 18px 14px", borderTop: "1px solid #f1f1f1", background: "#fff" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10 }}>
                      {normalizedItems.map((item) => (
                        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: "10px 0" }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.28 }}>
                              {item.name}
                            </p>
                            <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 700, color: "#262626" }}>{fmt(item.linePrice)}</p>
                            {item.variant ? (
                              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#8a8a8a" }}>
                                {item.variantOptionName ? `${item.variantOptionName}: ` : ""}{item.variant}
                              </p>
                            ) : null}
                          </div>
                          <div style={{ position: "relative", width: 72, minHeight: 90, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingBottom: 20 }}>
                            <div style={{ width: 72, height: 72, borderRadius: 16, overflow: "hidden", background: "#f3f3f3", flexShrink: 0 }}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : null}
                            </div>
                            <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", padding: "1px", borderRadius: 999, border: "1px solid #ececec", background: "#fff", boxShadow: "0 6px 14px rgba(20,20,20,0.12)" }}>
                              <button type="button" onClick={() => (item.quantity <= 1 ? handleRemove(item) : handleDecrement(item))} style={{ width: 28, height: 28, border: 0, background: "none", color: "#6d6d72", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                {item.quantity <= 1 ? <FiTrash2 size={16} /> : <span style={{ fontSize: 22, lineHeight: 1 }}>−</span>}
                              </button>
                              <span style={{ minWidth: 26, textAlign: "center", fontSize: 12, fontWeight: 800, color: "#1a1a1a" }}>{item.quantity}</span>
                              <button type="button" onClick={() => handleIncrement(item)} disabled={item.incrementDisabled} style={{ width: 28, height: 28, border: 0, background: "none", color: item.incrementDisabled ? "#c4c4c4" : "#1f33ff", cursor: item.incrementDisabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, lineHeight: 1 }}>+</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Add-to-order banner */}
            {isAddToOrderActive ? (
              <div className="checkout-card checkout-card--delay-3" style={{ border: "1px solid #fde8b0", background: "#fffcf0", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
                <p style={{ ...LABEL, color: "#b06000", margin: "0 0 4px" }}>Add to Order</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#222" }}>
                  {Math.floor(addToOrderTimeRemaining / 60000).toString().padStart(2, "0")}:{Math.floor((addToOrderTimeRemaining % 60000) / 1000).toString().padStart(2, "0")} remaining
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>Delivery fees are waived for this add-on.</p>
              </div>
            ) : null}

            {/* Address */}
            <button type="button" onClick={() => openSheet("address")} className="checkout-card checkout-card--delay-4" style={pillInput}>
              <FiMapPin size={17} style={{ color: accentColor, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: deliveryLocation?.address ? "#222" : "#bbb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {deliveryLocation?.address || "Enter your delivery address"}
              </span>
              <FiEdit2 size={15} style={{ color: "#bbb", flexShrink: 0 }} />
            </button>

            {/* Phone */}
            <button type="button" onClick={() => openSheet("phone")} className="checkout-card checkout-card--delay-5" style={{ ...pillInput, marginTop: 10 }}>
              <FiPhone size={17} style={{ color: accentColor, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: formData.customerPhone ? "#222" : "#bbb" }}>
                {formData.customerPhone || "Mobile number"}
              </span>
              <FiEdit2 size={15} style={{ color: "#bbb", flexShrink: 0 }} />
            </button>

            {/* Drop-off preference */}
            <div className="checkout-card checkout-card--delay-6" style={{ marginTop: 24 }}>
              <p style={LABEL}>Drop-off</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {handoffOptions.map((opt) => {
                  const checked = formData.handoffPreference === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setField("handoffPreference", opt.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, width: "100%",
                        padding: "14px 18px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                        border: `1.5px solid ${checked ? "rgba(230,30,77,0.22)" : "#e8e8e8"}`,
                        background: "#f5f5f6",
                        transition: "all 150ms",
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: checked ? "none" : "2px solid #cfcfd4",
                        background: checked ? "#e61e4d" : "transparent",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {checked ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} /> : null}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drop-off instructions */}
            <div className="checkout-card checkout-card--delay-7" style={{ marginTop: 14 }}>
              <button type="button" onClick={() => openSheet("notes")} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#555", textDecoration: "underline", textUnderlineOffset: 3, padding: 0 }}>
                {formData.specialInstructions ? "Edit drop-off instructions" : "Add drop-off instructions"}
              </button>
            </div>

            {/* Payment */}
            <div className="checkout-card checkout-card--delay-8" style={{ marginTop: 28 }}>
              <p style={LABEL}>Payment</p>
              <button type="button" onClick={() => openSheet("payment")} style={{ ...pillInput, padding: "14px 16px", borderRadius: 18 }}>
                {getPaymentBadge(selectedPaymentMethod, selectedPaymentType)}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: selectedPaymentType === "apple_pay" || selectedPaymentMethod ? "#222" : "#bbb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isLoadingMethods ? "Loading payment methods…" : selectedPaymentTitle}
                  </span>
                  <span style={{ fontSize: 12, color: "#8f8f94", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isLoadingMethods ? "Checking saved cards" : selectedPaymentSubtitle}
                  </span>
                </div>
                <FiChevronRight size={18} style={{ color: "#111", flexShrink: 0 }} />
              </button>
            </div>
          </div>

          {/* ── Right sidebar (desktop) ── */}
          <div className="purchase-page-sidebar checkout-card checkout-card--delay-9" style={{ marginTop: 32 }}>
            <div style={{ position: "relative", borderRadius: 22, border: "1px solid #ececec", background: "linear-gradient(180deg,#fff 0%,#fdfdfd 100%)", boxShadow: "0 16px 35px rgba(20,20,20,0.08)", padding: "24px 20px 18px", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 58, borderTop: "1px dashed #ddd" }} />
              <div className="receipt-ripple" style={{ ...receiptRippleStyle(0), display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <p className="order-summary-label" style={{ margin: 0, fontSize: 11, letterSpacing: "0.18em", color: "#777" }}>ORDER SUMMARY</p>
                <button type="button" onClick={openCartEditor} style={{ padding: 0, border: 0, background: "none", fontSize: 12, fontWeight: 700, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}>Edit</button>
              </div>
              <p className="receipt-ripple" style={{ ...receiptRippleStyle(1), margin: "0 0 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase" }}>Order Summary</p>
              <p className="receipt-ripple" style={{ ...receiptRippleStyle(2), margin: "0 0 16px", fontSize: 28, fontWeight: 800, color: "#222", letterSpacing: "-0.02em" }}>
                {isCalculatingDelivery ? "…" : fmt(total)}
              </p>

              {normalizedItems.map((item, index) => (
                <div key={item.id} className="receipt-ripple" style={{ ...receiptRippleStyle(index + 3), display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: 14, color: "#555", borderBottom: "1px solid #f1f1f1" }}>
                  <span style={{ flex: 1, marginRight: 8 }}>{item.name}{item.variant ? ` (${item.variant})` : ""} × {item.quantity}</span>
                  <span style={{ flexShrink: 0, fontWeight: 500 }}>{fmt(item.linePrice)}</span>
                </div>
              ))}

              <div className="receipt-ripple" style={{ ...receiptRippleStyle(normalizedItems.length + 3), display: "flex", justifyContent: "space-between", padding: "10px 0 6px", marginTop: 14, fontSize: 14, color: "#888" }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {!isAddToOrderActive ? (
                <div className="receipt-ripple" style={{ ...receiptRippleStyle(normalizedItems.length + 4), display: "flex", justifyContent: "space-between", padding: "4px 0 8px", fontSize: 14, color: "#888" }}>
                  <span>Delivery</span><span>{isCalculatingDelivery ? "Calculating…" : fmt(deliveryPrice)}</span>
                </div>
              ) : null}

              <div className="receipt-ripple" style={{ ...receiptRippleStyle(normalizedItems.length + 5), borderTop: "1px dashed #d9d9d9", marginTop: 6, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, color: "#222" }}>
                <span>Total</span><span>{isCalculatingDelivery ? "…" : fmt(total)}</span>
              </div>

              {hasDropoffReceiptNote ? (
                <div className="receipt-ripple" style={{ ...receiptRippleStyle(normalizedItems.length + 6), marginTop: 14, paddingTop: 12, borderTop: "1px dashed #e2e2e2" }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8a8a" }}>
                    Drop-off instructions
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "#444" }}>
                    {dropoffReceiptNote}
                  </p>
                </div>
              ) : null}

              {selectedPaymentMethod || selectedPaymentType === "apple_pay" ? (
                <button type="button" className="receipt-ripple" onClick={() => openSheet("payment")} style={{ ...receiptRippleStyle(normalizedItems.length + (hasDropoffReceiptNote ? 7 : 6)), marginTop: 20, padding: "14px 16px", border: "1px solid #ececec", borderRadius: 18, display: "flex", alignItems: "center", gap: 12, width: "100%", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  {getPaymentBadge(selectedPaymentMethod, selectedPaymentType)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#222" }}>{selectedPaymentTitle}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8f8f94" }}>{selectedPaymentSubtitle}</p>
                  </div>
                  <FiChevronRight size={18} style={{ color: "#111", flexShrink: 0 }} />
                </button>
              ) : (
                <button type="button" className="receipt-ripple" onClick={() => openSheet("payment")} style={{ ...receiptRippleStyle(normalizedItems.length + (hasDropoffReceiptNote ? 7 : 6)), marginTop: 20, padding: "14px 16px", border: "1px solid #ececec", borderRadius: 18, display: "flex", alignItems: "center", gap: 12, width: "100%", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  {getPaymentBadge(null, "card")}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#222" }}>Choose payment method</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8f8f94" }}>Apple Pay, saved cards, add card</p>
                  </div>
                  <FiChevronRight size={18} style={{ color: "#111", flexShrink: 0 }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, background: "#fff", borderTop: "1px solid #eee", padding: "12px 20px calc(12px + env(safe-area-inset-bottom))" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            {!canPlace && !isSubmitting && (() => {
              const missing = [];
              if (!deliveryLocation) missing.push("delivery address");
              if ((formData.customerPhone || "").replace(/\D/g, "").length < 7) missing.push("mobile number");
              if (!hasValidPayment) missing.push("payment method");
              return missing.length > 0 ? (
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#e53a3a", textAlign: "center", fontWeight: 600 }}>
                  Please add your {missing.join(" and ")} to continue.
                </p>
              ) : null;
            })()}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleBackToShop}
                style={{
                  width: 116, height: 54, borderRadius: 999, border: "1px solid #e8e8e8",
                  background: "#fff", color: "#161616", fontSize: 14, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                <FiArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!canPlace}
                style={{
                  flex: 1, height: 54, border: 0, borderRadius: 999,
                  background: canPlace ? gradientCTA : "#d8d8d8",
                  color: "#fff", fontSize: 15, fontWeight: 800,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  cursor: canPlace ? "pointer" : "not-allowed",
                  transition: "background 150ms",
                }}
              >
                {isSubmitting ? "Processing…" : "Place order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DrawerOrModal open={sheet === "address"} onClose={closeSheet} title="Delivery address">
        <AddressInput
          value={formData.deliveryAddress}
          onChange={(val) => setField("deliveryAddress", val)}
          onLocationSelect={handleAddressSelect}
          placeholder={t("delivery_address_placeholder")}
        />
      </DrawerOrModal>

      <DrawerOrModal open={sheet === "phone"} onClose={closeSheet} title="Mobile number">
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "#888", lineHeight: 1.5 }}>We&apos;ll use this number only if the driver needs to reach you.</p>
        <input type="tel" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} placeholder="+44 7..." autoFocus
          style={{ width: "100%", height: 50, border: "1.5px solid #e0e0e0", borderRadius: 999, padding: "0 18px", fontSize: 16, color: "#222", outline: "none", boxSizing: "border-box" }} />
        <button type="button" onClick={() => { setField("customerPhone", draftPhone); closeSheet(); }}
          style={{ marginTop: 14, width: "100%", height: 50, border: 0, borderRadius: 999, background: gradientCTA, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Confirm
        </button>
      </DrawerOrModal>

      <DrawerOrModal open={sheet === "notes"} onClose={closeSheet} title="Drop-off instructions">
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#888", lineHeight: 1.5 }}>Flat number, gate code, or where to leave the bag.</p>
        <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} placeholder="e.g. Flat 3B, buzz intercom" rows={4} autoFocus
          style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 14, padding: "13px 16px", fontSize: 15, color: "#222", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.55 }} />
        <button type="button" onClick={() => { setField("specialInstructions", draftNotes); closeSheet(); }}
          style={{ marginTop: 12, width: "100%", height: 50, border: 0, borderRadius: 999, background: gradientCTA, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Confirm
        </button>
      </DrawerOrModal>

      <DrawerOrModal open={sheet === "payment"} onClose={closeSheet} title="Payment Methods">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={() => setSelectedPaymentType("apple_pay")}
            className="checkout-option-card"
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
              border: selectedPaymentType === "apple_pay" ? "2px solid #0b74ff" : "1.5px solid #e6e6e6",
              background: "#fff",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "#111", flexShrink: 0 }}>
              <IoLogoApple size={18} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Pay</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#222" }}>Apple Pay</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8a8a8a" }}>Tap to pay with Apple Pay</p>
            </div>
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: selectedPaymentType === "apple_pay" ? "#0b74ff" : "transparent", border: selectedPaymentType === "apple_pay" ? "none" : "1.5px solid #d6d6d6", flexShrink: 0 }} />
          </button>

          {isLoadingMethods ? (
            <p style={{ margin: "2px 0 0", fontSize: 14, color: "#aaa" }}>Loading saved cards…</p>
          ) : paymentMethods.length > 0 ? (
            <>
              {paymentMethods.map((method) => {
                const selected = selectedPaymentType === "card" && selectedPaymentMethod?.id === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => { setSelectedPaymentMethod(method); setSelectedPaymentType("card"); }}
                    className="checkout-option-card"
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                      border: selected ? "2px solid #0b74ff" : "1.5px solid #e6e6e6",
                      background: "#fff",
                      transition: "all 150ms",
                    }}
                  >
                    <FiCreditCard size={18} style={{ color: "#888", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#222" }}>
                        {formatCardLabel(method)}
                      </p>
                      {method.default ? (
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#919191" }}>
                          Default
                        </p>
                      ) : null}
                    </div>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: selected ? "#0b74ff" : "transparent", border: selected ? "none" : "1.5px solid #d6d6d6", flexShrink: 0 }} />
                  </button>
                );
              })}
            </>
          ) : (
            <p style={{ margin: "2px 0 0", fontSize: 14, color: "#8a8a8a" }}>No saved cards yet.</p>
          )}

          <button type="button" onClick={handleAddCard} className="checkout-option-card checkout-option-card--minimal" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, width: "100%", border: 0, borderTop: "1px solid #efefef", background: "none", padding: "14px 2px 4px", textAlign: "left", cursor: "pointer" }}>
            <FiCreditCard size={17} style={{ color: "#999", flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>Add a card</span>
            <FiChevronRight size={16} style={{ color: "#c8c8c8", marginLeft: "auto" }} />
          </button>
        </div>
      </DrawerOrModal>

      <AddCardModal
        open={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onSuccess={handleAddCardSuccess}
      />
    </>
  );
}
