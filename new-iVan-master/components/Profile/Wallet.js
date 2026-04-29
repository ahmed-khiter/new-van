"use client";
import { nameRegex } from "@/utils/helper";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    CardCvcElement,
    CardExpiryElement,
    CardNumberElement,
    useElements,
    useStripe,
    Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import cardIcons from "../../public/assets/img/cards.svg";
import WalletCard from "./WalletCard";
import CheckoutModal from "@/components/Modals/CheckoutModal";
import { useRouter } from "@/i18n/routing";

const useOptions = () => {
  const options = useMemo(
    () => ({
      style: {
        base: {
          fontSize: "16px",
          color: "#424770",
          letterSpacing: "0.025em",
          fontFamily: "Source Code Pro, monospace",
          "::placeholder": {
            color: "#aab7c4",
          },
          backgroundColor: "#fff",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          padding: "10px",
        },
        invalid: {
          color: "#9e2146",
        },
      },
    }),
    []
  );

  return options;
}

function WalletForm({ accountType }) {
  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [stripeProfiles, setStripeProfiles] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isLoadingBankAccount, setIsLoadingBankAccount] = useState(false);
  const [bankAccountStatus, setBankAccountStatus] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const isAffiliateAccount = accountType === "affiliate";

  const fetchBankAccountStatus = async () => {
    try {
      const response = await fetch("/api/stripe-connect");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accountStatus) {
          setBankAccountStatus(data.accountStatus);
        } else if (data.success && !data.hasAccount) {
          setBankAccountStatus(null);
        }
      }
    } catch (error) {
      console.error("Error fetching bank account status:", error);
    }
  };

  useEffect(() => {
    if (isAffiliateAccount) {
      setIsLoadingCards(false);
      fetchBankAccountStatus();
      return;
    }

    const fetchStripeProfiles = async () => {
      setIsLoadingCards(true);
      try {
        const response = await fetch("/api/stripe-profile");
        const data = await response.json();
        if (data.success && data.data) {
          const validCards = Array.isArray(data.data) ? data.data.filter(card => card && card.id) : [];
          setStripeProfiles(validCards);
          // Set default card
          const defaultCard = validCards.find(card => card.default === true || card.default === 1);
          if (defaultCard) {
            setSelectedCard(defaultCard);
          }
        } else {
          toast.error(data.message || "Failed to load cards");
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
        toast.error("Failed to load cards");
      } finally {
        setIsLoadingCards(false);
      }
    };
    fetchStripeProfiles();
    fetchBankAccountStatus();

    // Check if returning from Stripe onboarding (URL might have query params)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payments') === 'true') {
      // Refresh bank account status when returning from Stripe
      setTimeout(() => {
        fetchBankAccountStatus();
      }, 1000);
    }
  }, [isAffiliateAccount]);

  // Function to check and open pending checkout modal
  const checkAndOpenPendingCheckout = useCallback(() => {
    if (isAffiliateAccount) {
      return;
    }

    const pendingCheckout = localStorage.getItem("pendingCheckoutState");
    if (!pendingCheckout) {
      // Also check for old key and remove it if exists
      const oldPendingPlan = localStorage.getItem("pendingSubscriptionPlan");
      if (oldPendingPlan) {
        localStorage.removeItem("pendingSubscriptionPlan");
      }
      return;
    }

    // Only open if cards are available
    if (stripeProfiles.length === 0) {
      return;
    }

    try {
      const checkoutState = JSON.parse(pendingCheckout);
      // Set the checkout state with type and data
      setPendingCheckout(checkoutState);
      setShowCheckoutModal(true);
    } catch (error) {
      console.error("Error parsing pending checkout state:", error);
      localStorage.removeItem("pendingCheckoutState");
    }
  }, [isAffiliateAccount, stripeProfiles.length]);

  // Check for pending checkout after cards are loaded
  useEffect(() => {
    if (!isLoadingCards && stripeProfiles.length > 0) {
      checkAndOpenPendingCheckout();
    }
  }, [isLoadingCards, stripeProfiles.length, checkAndOpenPendingCheckout]);
  const validationSchema = yup.object().shape({
    cardHolderName: yup
      .string()
      .required("Card Holder Name is required")
      .matches(nameRegex, "Card Holder Name is invalid")
      .min(2, "Card Holder Name must be at least 2 characters")
      .max(50, "Card Holder Name must be less than 50 characters"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    if (!stripe || !elements) {
      toast.error("Stripe is not loaded yet. Please wait.");
      setIsLoading(false);
      return;
    }
    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      toast.error("Card element not found");
      setIsLoading(false);
      return;
    }

    const { error: tokenError, token } = await stripe.createToken(cardElement);
    if (tokenError) {
      console.error("Token error:", tokenError);
      toast.error(tokenError?.message);
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name: data.cardHolderName,
        token: token.id,
      };

      const response = await fetch("/api/stripe-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.success && responseData.data && responseData.data.id) {
        const newCards = [...stripeProfiles, responseData.data];
        setStripeProfiles(newCards);
        // If this is the first card, set it as selected
        if (stripeProfiles.length === 0) {
          setSelectedCard(responseData.data);
        }
        toast.success(responseData.message || "Card added successfully");
        resetForm();
        
        // Check for pending checkout after card is added
        setTimeout(() => {
          checkAndOpenPendingCheckout();
        }, 500);
      } else {
        console.error("Error saving card:", responseData);
        toast.error(responseData.message || "Card save failed");
      }
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error(error.message || "Card save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    reset();
    if (elements) {
      const cardNumber = elements.getElement(CardNumberElement);
      const cardExpiry = elements.getElement(CardExpiryElement);
      const cardCvc = elements.getElement(CardCvcElement);
      if (cardNumber) cardNumber.clear();
      if (cardExpiry) cardExpiry.clear();
      if (cardCvc) cardCvc.clear();
    }
  };

  const handleSelectCard = async (card) => {
    try {
      const response = await fetch("/api/stripe-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: card.paymentMethodId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update state manually: set all cards to default: false, then set selected card to default: true
        setStripeProfiles((prevCards) =>
          prevCards.map((c) => ({
            ...c,
            default: c.id === card.id ? true : false,
          }))
        );
        setSelectedCard(card);
        toast.success(data.message || "Default card updated successfully");
      } else {
        toast.error(data.message || "Failed to update default card");
      }
    } catch (error) {
      console.error("Error updating default card:", error);
      toast.error("Failed to update default card");
    }
  };

  const handleDeleteCard = async (card) => {
    try {
      const response = await fetch("/api/stripe-profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: card.paymentMethodId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update state manually: remove the deleted card
        setStripeProfiles((prevCards) => {
          const remainingCards = prevCards.filter((c) => c.id !== card.id);
          
          // If the deleted card was the selected one, select the first remaining card or set to null
          if (selectedCard?.id === card.id) {
            const newDefaultCard = remainingCards.find(c => c.default === true || c.default === 1) || remainingCards[0] || null;
            setSelectedCard(newDefaultCard);
          }
          
          return remainingCards;
        });
        
        toast.success(data.message || "Card deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete card");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Failed to delete card");
    }
  };

  const handleAddBankAccount = async () => {
    setIsLoadingBankAccount(true);
    try {
      const response = await fetch("/api/stripe-connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.onboardingUrl) {
        // Redirect to Stripe onboarding URL
        window.location.href = data.onboardingUrl;
      } else {
        toast.error(data.message || "Failed to create bank account setup link");
        setIsLoadingBankAccount(false);
      }
    } catch (error) {
      console.error("Error setting up bank account:", error);
      toast.error("Failed to set up bank account. Please try again.");
      setIsLoadingBankAccount(false);
    }
  };
 
  return (
    <>
      {!isAffiliateAccount && (
        <>
          {/* Add New Card Form - Always visible */}
          <div className="card p-4 mb-4">
            <h5 className="fw-bold mb-3">Add New Card</h5>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>Card Holder Name</label>
                  <input
                    type="text"
                    placeholder="Card Holder Name"
                    className={`form-control card-holder-name-input ${
                      errors.cardHolderName ? "is-invalid" : ""
                    }`}
                    {...register("cardHolderName")}
                  />
                  {errors.cardHolderName && (
                    <div className="invalid-feedback">
                      {errors.cardHolderName.message}
                    </div>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label>Card Number</label>
                  <CardNumberElement options={options} />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <label>Expiration Date</label>
                  <CardExpiryElement options={options} />
                </div>
                <div className="col-md-6">
                  <label>CVC</label>
                  <CardCvcElement options={options} />
                </div>
              </div>
              <div className="mt-3">
                <Image
                  alt="card icon"
                  src={cardIcons}
                  height={"auto"}
                  width={"auto"}
                />
              </div>
              <div className="add_card_action mt-3">
                <button
                  type="submit"
                  className="btn btn-primary add_card_btn btn-sm"
                  disabled={!stripe || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Loading...
                    </>
                  ) : (
                    "Add Card"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Cards - Load asynchronously below the form */}
          {isLoadingCards ? (
            <div className="card p-4">
              <h5 className="fw-bold mb-3">Payment Methods</h5>
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading cards...</span>
                </div>
              </div>
            </div>
          ) : stripeProfiles.length > 0 ? (
            <div className="card p-4">
              <h5 className="fw-bold mb-3">Payment Methods</h5>
              {stripeProfiles
                .filter((card) => card && card.id)
                .map((card) => (
                  <WalletCard
                    key={card.id}
                    card={card}
                    selected={selectedCard}
                    onSelect={handleSelectCard}
                    handleDeleteCard={handleDeleteCard}
                    isShowDelete={true}
                    cards={stripeProfiles}
                  />
                ))}
            </div>
          ) : null}
        </>
      )}

      {/* Bank Account for Payouts Section */}
      {accountType !== "customer" && (
        <div className="card p-4 mt-4">
        <h5 className="fw-bold mb-3">Bank Account for Payouts</h5>
        <p className="text-muted mb-3">
          Add your bank account to receive payouts directly to your bank. This is required for receiving payments from completed jobs and orders.
        </p>
        {bankAccountStatus && (
          <div className="mb-3">
            <span className={`badge ${bankAccountStatus === "active" ? "bg-success" : bankAccountStatus === "pending" ? "bg-warning" : "bg-secondary"}`}>
              Status: {bankAccountStatus}
            </span>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleAddBankAccount}
          disabled={isLoadingBankAccount}
        >
          {isLoadingBankAccount ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Processing...
            </>
          ) : bankAccountStatus ? (
            "Update Bank Account"
          ) : (
            "Add Bank Account"
          )}
        </button>
      </div>)}

      {/* Checkout Modal for Pending Checkout */}
      {showCheckoutModal && pendingCheckout && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setPendingCheckout(null);
            localStorage.removeItem("pendingCheckoutState");
          }}
          type={pendingCheckout.type}
          data={pendingCheckout.data}
        />
      )}
    </>
  );
}

export default function Wallet({ accountType }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    // Load Stripe publishable key from environment variable
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey));
    } else {
      console.error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not set in environment variables");
    }
  }, []);

  // Show form immediately, even if Stripe is still loading
  // The form will be disabled until Stripe loads
  return (
    <div className="row">
      <div className="col-sm-12 col-md-6">
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <WalletForm accountType={accountType} />
          </Elements>
        ) : (
          <div className="card p-4 mb-4">
            <h5 className="fw-bold mb-3">Add New Card</h5>
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading Stripe...</span>
              </div>
              <p className="mt-2 text-muted">Initializing payment form...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
