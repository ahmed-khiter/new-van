"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "@/i18n/routing";
import toast from "react-hot-toast";
import AddressInput from "@/components/Fields/AddressInput";
import PhoneInput from "@/components/Fields/PhoneInput";
import { getFileUrl } from "@/utils/helper";
import { useCategories } from "@/hooks/useCategories";
import {
  STEPS, ALL_DAYS, TITLES, DEFAULT_WEEKDAY_HOURS,
  STEP_ICONS, BackArrow, PlusIcon, CloseIcon, ShieldIcon,
  CameraIcon, SmallPlusIcon, ClockIcon, SuccessCheckIcon,
  CardPaymentIcon,
  Spinner, StepSkeleton, SlideIn, ProgressBar, StepIndicator,
  Field, StepHeader, Confetti, s,
} from "@/components/ShopOnboarding/OnboardingUI";

// ─── Step 1: Business Info ──────────────────────────────────────────────────

function StepBusiness({ onNext }) {
  const [form, setForm] = useState({
    shopName: "", shopPhone: "", address1: "", city: "", postCode: "",
    latitude: null, longitude: null,
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      const shop = data.shop || {};
      setForm({
        shopName:  shop.name      || "",
        shopPhone: shop.phone     || "",
        address1:  shop.address1  || "",
        city:      shop.city      || "",
        postCode:  shop.postCode  || "",
        latitude:  shop.latitude  || null,
        longitude: shop.longitude || null,
      });
      if (shop.image) setPreviewUrl(getFileUrl(shop.image));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddressSelect = (location) => {
    setForm(p => ({
      ...p,
      address1:  location.address  || p.address1,
      city:      location.city     || p.city,
      postCode:  location.postcode || p.postCode,
      latitude:  location.lat,
      longitude: location.lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shopName.trim()) { toast.error("Shop name is required"); return; }
    if (!form.shopPhone.trim()) { toast.error("Phone number is required"); return; }
    if (!form.address1.trim()) { toast.error("Address is required"); return; }
    if (!previewUrl && !image) { toast.error("Please upload your shop logo"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("shopName", form.shopName);
      fd.append("shopPhone", form.shopPhone);
      fd.append("address1", form.address1);
      fd.append("city", form.city);
      fd.append("postCode", form.postCode);
      if (form.latitude)  fd.append("latitude",  form.latitude);
      if (form.longitude) fd.append("longitude", form.longitude);
      fd.append("firstName", "_");
      fd.append("lastName",  "_");
      fd.append("email",     "_");
      if (image) fd.append("image", image);
      const res = await fetch("/api/profile", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      toast.success("Business info saved");
      onNext();
    } catch {
      toast.error("Failed to save \u2014 please try again");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <StepSkeleton />;

  return (
    <form className={s.body} onSubmit={handleSubmit}>
      <div className={s.avatarWrap} onClick={() => document.getElementById("onb-logo-file").click()}>
        {previewUrl
          ? <img src={previewUrl} alt="" className={s.avatarImg} />
          : <div className={s.avatarEmpty}><CameraIcon /></div>}
        <div className={s.avatarBadge}><SmallPlusIcon /></div>
        <input id="onb-logo-file" type="file" accept="image/*" hidden onChange={handleImageChange} />
      </div>
      <p className={s.avatarHint}>Upload your shop logo <span className={s.req}>*</span></p>

      <div className={s.fields}>
        <Field label="Shop name" required>
          <input className={s.input} placeholder="e.g. Benny Furniture"
            value={form.shopName} onChange={e => setForm(p => ({ ...p, shopName: e.target.value }))} />
        </Field>

        <Field label="Phone number" required>
          <PhoneInput
            value={form.shopPhone}
            onChange={e => setForm(p => ({ ...p, shopPhone: e.target.value }))}
            placeholder="+44 7700 000000"
            className={s.input}
          />
        </Field>

        <Field label="Address" required>
          <AddressInput
            value={form.address1}
            onChange={val => setForm(p => ({ ...p, address1: val }))}
            onLocationSelect={handleAddressSelect}
            placeholder="Start typing your address\u2026"
            className={s.input}
          />
        </Field>

        {form.address1 && (
          <div className={s.grid2}>
            <Field label="City">
              <input className={s.input} placeholder="London"
                value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            </Field>
            <Field label="Post code">
              <input className={s.input} placeholder="NW1 0JH"
                value={form.postCode} onChange={e => setForm(p => ({ ...p, postCode: e.target.value }))} />
            </Field>
          </div>
        )}
      </div>

      <div className={s.footer}>
        <button className={s.btn} type="submit" disabled={saving}>
          {saving ? <><Spinner /> Saving&hellip;</> : "Continue"}
        </button>
      </div>
    </form>
  );
}

// ─── Step 2: Hours ──────────────────────────────────────────────────────────

function StepHours({ onNext, onBack }) {
  const [hours, setHours] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      const meta = (data.shop || {}).shop_metadata || {};
      if (Array.isArray(meta.openingHours) && meta.openingHours.length) {
        setHours(meta.openingHours.map(h => ({
          key: h.day || h.key,
          label: ALL_DAYS.find(d => d.key === (h.day || h.key))?.label || h.day,
          open: h.open, close: h.close,
        })));
      } else {
        setHours([...DEFAULT_WEEKDAY_HOURS]);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const available = ALL_DAYS.filter(d => !hours.find(h => h.key === d.key));
  const addDay = (d) => setHours(p => [...p, { key: d.key, label: d.label, open: "09:00", close: "17:00" }]);
  const remove = (k) => setHours(p => p.filter(h => h.key !== k));
  const update = (k, f, v) => setHours(p => p.map(h => h.key === k ? { ...h, [f]: v } : h));
  const addAll = () => available.forEach(d => addDay(d));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hours.length === 0) { toast.error("Add at least one day"); return; }
    for (const h of hours) {
      if (!h.open || !h.close) { toast.error(`Set times for ${h.label}`); return; }
    }
    setSaving(true);
    try {
      const payload = hours.map(h => ({ day: h.key, open: h.open, close: h.close }));
      const fd = new FormData();
      fd.append("firstName", "_");
      fd.append("lastName",  "_");
      fd.append("email",     "_");
      fd.append("shop_metadata", JSON.stringify({ openingHours: payload }));
      const res = await fetch("/api/profile", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      toast.success("Opening hours saved");
      onNext();
    } catch {
      toast.error("Failed to save \u2014 please try again");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <StepSkeleton />;

  return (
    <form className={s.body} onSubmit={handleSubmit}>
      <div className={s.daySelector}>
        {ALL_DAYS.map(d => {
          const sel = hours.find(h => h.key === d.key);
          return (
            <button key={d.key} type="button"
              className={`${s.dayCirc} ${sel ? s.dayCircSel : ""}`}
              onClick={() => sel ? remove(d.key) : addDay(d)} title={d.label}>
              {d.short}
            </button>
          );
        })}
      </div>
      {available.length > 1 && (
        <button type="button" className={s.textBtn} onClick={addAll}>Select all days</button>
      )}

      <div className={s.timeList}>
        {hours.length === 0 && (
          <div className={s.empty}>
            <ClockIcon />
            <span>Tap the days above to get started</span>
          </div>
        )}
        {hours.map(h => (
          <div key={h.key} className={s.trow}>
            <span className={s.tday}>{h.label}</span>
            <div className={s.tpair}>
              <input type="time" className={s.tinput} value={h.open}  onChange={e => update(h.key, "open",  e.target.value)} />
              <span className={s.tdash}>&ndash;</span>
              <input type="time" className={s.tinput} value={h.close} onChange={e => update(h.key, "close", e.target.value)} />
            </div>
            <button type="button" className={s.tremove} onClick={() => remove(h.key)}>
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>

      <div className={`${s.footer} ${s.footerSplit}`}>
        <button type="button" className={s.btnBack} onClick={onBack}><BackArrow /></button>
        <button className={s.btn} type="submit" disabled={saving}>
          {saving ? <><Spinner /> Saving&hellip;</> : "Continue"}
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Payment ────────────────────────────────────────────────────────

function StepPayment({ onNext, onBack }) {
  const [stripeConnected, setStripeConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const checkStatus = useCallback(() => {
    fetch("/api/shops/activation-progress").then(r => r.json()).then(data => {
      setStripeConnected(!!data?.steps?.paymentDetails);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  useEffect(() => {
    const handler = () => { if (!document.hidden) checkStatus(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [checkStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe-connect", { method: "POST" });
      const data = await res.json();
      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, "_blank");
        toast.success("Complete Stripe setup in the new tab");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to start Stripe setup");
    } finally {
      setConnecting(false);
    }
  };

  if (!loaded) return <StepSkeleton />;

  return (
    <div className={s.body}>
      <div className={`${s.cardBlock} ${stripeConnected ? s.cardBlockSuccess : ""}`}>
        <div className={s.cardIc}>
          {stripeConnected ? <SuccessCheckIcon /> : <CardPaymentIcon />}
        </div>
        <div className={s.cardTx}>
          <strong>{stripeConnected ? "Stripe connected" : "Connect with Stripe"}</strong>
          <span>{stripeConnected ? "Your payout account is active." : "Get paid directly to your bank account."}</span>
        </div>
        {!stripeConnected && (
          <button className={s.cardAct} type="button" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Spinner /> : "Connect"}
          </button>
        )}
      </div>

      <div className={s.infoRow}>
        <ShieldIcon />
        <span>Your banking details are encrypted and never shared.</span>
      </div>

      <div className={`${s.footer} ${s.footerSplit}`} style={{ marginTop: 24 }}>
        <button type="button" className={s.btnBack} onClick={onBack}><BackArrow /></button>
        <button className={s.btn} type="button" onClick={onNext} disabled={!stripeConnected}>
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Product ────────────────────────────────────────────────────────

function StepProduct({ onNext, onBack }) {
  const [hasProduct, setHasProduct] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const imageRef = useRef(null);
  const { categories, loading: categoriesLoading } = useCategories();
  const [shopCategory, setShopCategory] = useState(null);
  const [product, setProduct] = useState({
    name: "", price: "", stock: "0", description: "",
    category: "", subcategory: "",
  });

  const checkStatus = useCallback(() => {
    fetch("/api/shops/activation-progress").then(r => r.json()).then(data => {
      setHasProduct(!!data?.steps?.firstProduct);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  useEffect(() => {
    const handler = () => { if (!document.hidden) checkStatus(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [checkStatus]);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (data.shop?.category) {
        setShopCategory(data.shop.category);
        setProduct(p => ({ ...p, category: data.shop.category }));
      }
    }).catch(() => {});
  }, []);

  const selectedCat = categories.find(c => String(c.id) === String(product.category));
  const subcategories = selectedCat?.subcategories && Array.isArray(selectedCat.subcategories)
    ? selectedCat.subcategories : [];

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 8 - images.length;
    if (remaining <= 0) { toast.error("Maximum 8 images allowed"); return; }
    const toAdd = files.slice(0, remaining).map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setImages(p => [...p, ...toAdd]);
    e.target.value = "";
  };

  const removeImage = (idx) => setImages(p => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product.name.trim()) { toast.error("Product name is required"); return; }
    if (!product.price || parseFloat(product.price) <= 0) { toast.error("Valid price is required"); return; }
    if (images.length === 0) { toast.error("Product photo is required"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", product.name);
      fd.append("description", product.description || "");
      fd.append("price", product.price);
      fd.append("category", product.category || "");
      fd.append("subcategory", product.subcategory || "");
      fd.append("stock", product.stock || "0");
      fd.append("isActive", "true");
      fd.append("variants", "");
      for (const img of images) {
        fd.append("images", img.file);
      }
      const res = await fetch("/api/products", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create product");
      }
      toast.success("Product added successfully");
      setHasProduct(true);
      setShowForm(false);
      setProduct({ name: "", price: "", stock: "0", description: "", category: shopCategory || "", subcategory: "" });
      setImages([]);
    } catch (err) {
      toast.error(err.message || "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <StepSkeleton />;

  if (hasProduct && !showForm) {
    return (
      <div className={s.body}>
        <div className={`${s.cardBlock} ${s.cardBlockSuccess}`}>
          <div className={s.cardIc}><SuccessCheckIcon /></div>
          <div className={s.cardTx}>
            <strong>Product added</strong>
            <span>Your first product is ready for customers.</span>
          </div>
        </div>

        <div className={`${s.footer} ${s.footerSplit}`}>
          <button type="button" className={s.btnBack} onClick={onBack}><BackArrow /></button>
          <button className={s.btn} type="button" onClick={onNext}>
            Finish setup
          </button>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className={s.body}>
        <div className={s.checklist}>
          {[
            { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>, text: "Upload a product photo" },
            { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>, text: "Write a short description" },
            { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, text: "Set your price" },
            { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, text: "Choose a category" },
          ].map((item, i) => (
            <div key={i} className={s.chkItem}>
              <div className={s.chkIc}>{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <button className={`${s.btn} ${s.btnOutline}`} type="button" onClick={() => setShowForm(true)}>
          <PlusIcon /> Add your first product
        </button>

        <div className={`${s.footer} ${s.footerSplit}`}>
          <button type="button" className={s.btnBack} onClick={onBack}><BackArrow /></button>
          <button className={s.btn} type="button" disabled>
            Finish setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={s.body} onSubmit={handleSubmit}>
      {/* ── Photos section ── */}
      <div className={s.prodSection}>
        <div className={s.prodSectionHeader}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span>Photos <span className={s.req}>*</span></span>
          {images.length > 0 && <span className={s.prodBadge}>{images.length}/8</span>}
        </div>
        <input ref={imageRef} type="file" accept="image/*" multiple hidden onChange={handleImageAdd} />
        {images.length === 0 ? (
          <button type="button" onClick={() => imageRef.current?.click()} className={s.imgDropzone}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span className={s.imgDropzoneText}>Tap to upload product photos</span>
            <span className={s.imgDropzoneSub}>Up to 8 images &middot; First image is the main photo</span>
          </button>
        ) : (
          <div className={s.imgGrid}>
            {images.map((img, idx) => (
              <div key={idx} className={`${s.imgThumb} ${idx === 0 ? s.imgThumbMain : ""}`}>
                <img src={img.url} alt="" className={s.imgThumbImg} />
                {idx === 0 && <span className={s.imgMainBadge}>Main</span>}
                <button type="button" onClick={() => removeImage(idx)} className={s.imgRemove}>&times;</button>
              </div>
            ))}
            {images.length < 8 && (
              <button type="button" onClick={() => imageRef.current?.click()} className={s.imgAdd}>
                <PlusIcon />
                <span>Add</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Details section ── */}
      <div className={s.prodSection}>
        <div className={s.prodSectionHeader}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          <span>Details</span>
        </div>
        <div className={s.fields}>
          <Field label="Product name" required>
            <input className={s.input} placeholder="e.g. Oak Dining Table"
              value={product.name} onChange={e => setProduct(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Description">
            <textarea className={`${s.input} ${s.textarea}`} rows="3" placeholder="What makes this product special?"
              value={product.description} onChange={e => setProduct(p => ({ ...p, description: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* ── Pricing section ── */}
      <div className={s.prodSection}>
        <div className={s.prodSectionHeader}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Pricing</span>
        </div>
        <div className={s.fields}>
          <div className={s.grid2}>
            <Field label="Price" required>
              <div className={s.inputWithPrefix}>
                <span className={s.inputPrefix}>&pound;</span>
                <input className={`${s.input} ${s.inputHasPrefix}`} type="number" step="0.01" placeholder="0.00"
                  value={product.price} onChange={e => setProduct(p => ({ ...p, price: e.target.value }))} />
              </div>
            </Field>
            <Field label="Stock quantity">
              <input className={s.input} type="number" min="0" placeholder="0"
                value={product.stock} onChange={e => setProduct(p => ({ ...p, stock: e.target.value }))} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Category section ── */}
      <div className={s.prodSection}>
        <div className={s.prodSectionHeader}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span>Category</span>
        </div>
        <div className={s.fields}>
          <div className={s.grid2}>
            <Field label="Category">
              {shopCategory ? (
                <>
                  <input className={s.input} value={selectedCat?.name || (categoriesLoading ? "Loading..." : "No category")} disabled />
                  <input type="hidden" value={product.category} />
                </>
              ) : (
                <select className={s.input} value={product.category} disabled={categoriesLoading}
                  onChange={e => setProduct(p => ({ ...p, category: e.target.value, subcategory: "" }))}>
                  <option value="">{categoriesLoading ? "Loading..." : "Select a category"}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </Field>
            <Field label="Subcategory">
              <select className={s.input} value={product.subcategory}
                disabled={categoriesLoading || subcategories.length === 0}
                onChange={e => setProduct(p => ({ ...p, subcategory: e.target.value }))}>
                <option value="">{categoriesLoading ? "Loading..." : subcategories.length === 0 ? "None available" : "Select subcategory"}</option>
                {subcategories.map((sc, i) => <option key={i} value={sc}>{sc}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <div className={`${s.footer} ${s.footerSplit}`}>
        <button type="button" className={s.btnBack} onClick={() => setShowForm(false)}><BackArrow /></button>
        <button className={s.btn} type="submit" disabled={saving}>
          {saving ? <><Spinner /> Adding&hellip;</> : "Add product"}
        </button>
      </div>
    </form>
  );
}

// ─── Success ────────────────────────────────────────────────────────────────

function SuccessScreen({ progress }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 80); return () => clearTimeout(t); }, []);
  const allDone = progress && Object.values(progress).every(Boolean);
  const doneCount = progress ? Object.values(progress).filter(Boolean).length : 0;

  return (
    <div className={`${s.success} ${show ? s.successIn : ""}`}>
      <Confetti />
      <div className={s.successRing}>
        <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#FF385C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" className={s.drawCheck} />
        </svg>
      </div>
      <h2>{allDone ? "You\u2019re all set!" : "Great progress!"}</h2>
      <p>
        {allDone
          ? "Your shop is live and ready to accept orders."
          : `You\u2019ve completed ${doneCount} of 4 steps. You can always finish the rest from your dashboard.`}
      </p>
      <Link href="/shop/products" className={`${s.btn} ${s.btnAccent}`} style={{ textDecoration: "none" }}>
        Go to Dashboard
      </Link>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function ShopOwnerDashboardPage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [completed, setCompleted] = useState({});
  const [loading, setLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/shops/activation-progress");
      const data = await res.json();
      return data?.steps || {};
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    refreshProgress().then(steps => {
      setCompleted(steps);
      if (Object.values(steps).every(Boolean)) {
        setDone(true);
      } else {
        const order = ["businessInfo", "openingHours", "paymentDetails", "firstProduct"];
        const firstIncomplete = order.findIndex(id => !steps[id]);
        setStep(firstIncomplete >= 0 ? firstIncomplete : 0);
      }
      setLoading(false);
    });
  }, [refreshProgress]);

  const handleNext = useCallback(() => {
    setCompleted(p => ({ ...p, [STEPS[step].id]: true }));
    if (step >= STEPS.length - 1) {
      refreshProgress().then(steps => {
        setCompleted(steps);
        setDone(true);
      });
    } else {
      setStep(s => s + 1);
      refreshProgress().then(steps => setCompleted(steps));
    }
  }, [step, refreshProgress]);

  const handleBack = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  if (loading) {
    return (
      <div className={s.pageWrap}>
        <div className={s.card}><StepSkeleton /></div>
      </div>
    );
  }

  return (
    <div className={s.pageWrap}>
      <div className={s.card}>
        {done ? (
          <SuccessScreen progress={completed} />
        ) : (
          <>
            <ProgressBar current={step} total={STEPS.length} />
            <StepIndicator steps={STEPS} current={step} completed={completed} onStepClick={setStep} />
            <SlideIn stepKey={step}>
              <StepHeader step={step} />
              {step === 0 && <StepBusiness onNext={handleNext} />}
              {step === 1 && <StepHours    onNext={handleNext} onBack={handleBack} />}
              {step === 2 && <StepPayment  onNext={handleNext} onBack={handleBack} />}
              {step === 3 && <StepProduct  onNext={handleNext} onBack={handleBack} />}
            </SlideIn>
          </>
        )}
      </div>
    </div>
  );
}
