"use client";
import { useState, useEffect } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import { nameRegex } from "@/utils/helper";

const stripeOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#222",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#9e2146" },
  },
};

function AddCardForm({ onSuccess, onClose, mockMode = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [postcodeError, setPostcodeError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (name || "").trim();
    const trimmedPostcode = (postcode || "").trim();
    if (!trimmed || !nameRegex.test(trimmed)) {
      setNameError("Enter a valid name");
      return;
    }
    if (!trimmedPostcode || !/^[a-z0-9 ]{3,10}$/i.test(trimmedPostcode)) {
      setPostcodeError("Enter a valid postcode");
      return;
    }
    setNameError("");
    setPostcodeError("");
    if (!stripe || !elements) return;

    setIsLoading(true);
    try {
      const cardEl = elements.getElement(CardNumberElement);
      if (!cardEl) {
        toast.error("Card field not ready");
        return;
      }
      const { error, token } = await stripe.createToken(cardEl, {
        name: trimmed,
        address_zip: trimmedPostcode,
      });
      if (error) {
        toast.error(error.message || "Card error");
        return;
      }

      if (mockMode) {
        const mockCard = {
          id: `mock-card-${Date.now()}`,
          paymentMethodId: `pm_mock_${Date.now()}`,
          cardBrand: token?.card?.brand || "visa",
          lastFourDigit: token?.card?.last4 || "0000",
          default: false,
        };
        toast.success("Card added");
        onSuccess(mockCard);
        onClose();
        return;
      }

      const res = await fetch("/api/stripe-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.id, name: trimmed, postcode: trimmedPostcode }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        toast.success(data.message || "Card added");
        onSuccess(data.data);
        onClose();
      } else {
        toast.error(data.message || "Failed to add card");
      }
    } catch (err) {
      toast.error("Failed to add card");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Card holder name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(""); }}
          placeholder="Name on card"
          style={{
            width: "100%", height: 48, border: `1.5px solid ${nameError ? "#e53e3e" : "#e0e0e0"}`,
            borderRadius: 12, padding: "0 14px", fontSize: 15, color: "#222", outline: "none", boxSizing: "border-box",
          }}
        />
        {nameError ? <p style={{ margin: "4px 0 0", fontSize: 12, color: "#e53e3e" }}>{nameError}</p> : null}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Card number *</label>
        <div style={{ border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "12px 14px", background: "#fff" }}>
          <CardNumberElement options={stripeOptions} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Expiry *</label>
          <div style={{ border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "12px 14px", background: "#fff" }}>
            <CardExpiryElement options={stripeOptions} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>CVC *</label>
          <div style={{ border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "12px 14px", background: "#fff" }}>
            <CardCvcElement options={stripeOptions} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Postcode *</label>
        <input
          type="text"
          value={postcode}
          onChange={(e) => { setPostcode(e.target.value.toUpperCase()); setPostcodeError(""); }}
          placeholder="Postcode"
          style={{
            width: "100%", height: 48, border: `1.5px solid ${postcodeError ? "#e53e3e" : "#e0e0e0"}`,
            borderRadius: 12, padding: "0 14px", fontSize: 15, color: "#222", outline: "none", boxSizing: "border-box",
          }}
        />
        {postcodeError ? <p style={{ margin: "4px 0 0", fontSize: 12, color: "#e53e3e" }}>{postcodeError}</p> : null}
      </div>

      <button
        type="submit"
        disabled={!stripe || isLoading}
        style={{
          width: "100%", height: 52, border: 0, borderRadius: 999,
          background: stripe && !isLoading ? "linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)" : "#d8d8d8",
          color: "#fff", fontSize: 15, fontWeight: 700, cursor: stripe && !isLoading ? "pointer" : "not-allowed",
        }}
      >
        {isLoading ? "Saving…" : "Confirm new card"}
      </button>
    </form>
  );
}

export default function AddCardModal({ open, onClose, onSuccess, mockMode = false }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    if (key) setStripePromise(loadStripe(key));
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const content = (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", minHeight: 0 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 800, fontStyle: "italic", color: "#222", fontFamily: "var(--font-order-summary), system-ui, sans-serif" }}>
            Add new card.
          </span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: 0, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: "#555" }}>×</button>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#888" }}>* Required information</p>
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <AddCardForm onSuccess={onSuccess} onClose={onClose} mockMode={mockMode} />
          </Elements>
        ) : (
          <p style={{ color: "#888" }}>Loading…</p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      >
        <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "90dvh", padding: "16px 24px 32px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, padding: "24px 24px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        {content}
      </div>
    </div>
  );
}
