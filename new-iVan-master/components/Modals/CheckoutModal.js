"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { FiX, FiCreditCard, FiCheck, FiAlertCircle } from "react-icons/fi";
import { formatAmountToCurrency, getFileUrl } from "@/utils/helper";
import { AppContext } from "@/lib/contexts/context";

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  type, // 'subscription', 'order', 'job'
  data // Contains plan/order/job details
}) {
  const t = useTranslations();
  const router = useRouter();
  const { setSubscription } = useContext(AppContext) || {};
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const response = await fetch("/api/stripe-profile");
      const result = await response.json();
      
      if (result.success && result.data) {
        const validCards = Array.isArray(result.data) ? result.data.filter(card => card && card.id) : [];
        setPaymentMethods(validCards);
        
        // Set default card
        const defaultCard = validCards.find(card => card.default === true || card.default === 1);
        if (defaultCard) {
          setSelectedPaymentMethod(defaultCard);
        } else if (validCards.length > 0) {
          setSelectedPaymentMethod(validCards[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsLoading(true);
    try {
      let response;
      let endpoint;
      let payload = {
        paymentMethodId: selectedPaymentMethod.paymentMethodId,
      };

      if (type === "subscription") {
        endpoint = "/api/subscription";
        payload = {
          ...payload,
          planId: data.planId,
          type: data.planType || "monthly",
        };
      } else if (type === "order") {
        endpoint = "/api/orders/payment";
        payload = {
          ...payload,
          orderId: data.orderId,
          jobId: data.jobId,
        };
      } else if (type === "job") {
        endpoint = "/api/jobs/payment";
        payload = {
          ...payload,
          jobId: data.jobId,
        };
      }

      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || "Payment successful!");
        
        if (type === "subscription" && result.subscription && setSubscription) {
          setSubscription(result.subscription);
        }
        
        // Clear localStorage after successful payment
        localStorage.removeItem("pendingCheckoutState");
        
        onClose();
        
        // Redirect based on type
        if (type === "subscription") {
          router.push("/provider/pricing");
        } else if (type === "order") {
          router.push("/customer/jobs");
        } else if (type === "job") {
          router.push("/customer/jobs");
        }
      } else {
        toast.error(result.error || result.message || "Payment failed");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = () => {
    // Save checkout state to localStorage
    localStorage.setItem("pendingCheckoutState", JSON.stringify({
      type: type,
      data: data
    }));
    
    onClose();
    if(type === "subscription") {
    router.push("/provider/settings?payments=true");
    } else {
      router.push("/customer/wallet");
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (type === "subscription") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Subscription Plan</h3>
          {data.plan && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{data.plan.name}</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatAmountToCurrency(data.amount, data.currency || "GBP")}
                </span>
              </div>
              <p className="text-sm text-gray-600">{data.plan.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Type: {data.planType === "yearly" ? "Yearly" : "Monthly"}
              </p>
            </div>
          )}
        </div>
      );
    } else if (type === "order") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          {data.cartItems && data.cartItems.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.cartItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-xl">
                  {item.image && (
                    <img
                      src={getFileUrl(item.image)}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.name}
                      {item.variant && (
                        <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          {item.variantOptionName || 'Variant'}: {item.variant}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × {formatAmountToCurrency(item.price, "GBP")}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatAmountToCurrency(item.price * item.quantity, "GBP")}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-3 space-y-2">
            {data.cartPrice && (
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatAmountToCurrency(data.cartPrice, "GBP")}</span>
              </div>
            )}
            {data.deliveryPrice && (
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{formatAmountToCurrency(data.deliveryPrice, "GBP")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">
                {formatAmountToCurrency(data.totalAmount || data.amount, "GBP")}
              </span>
            </div>
          </div>
        </div>
      );
    } else if (type === "job") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Job Payment</h3>
          {data.job && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{data.job.title || "Job Payment"}</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatAmountToCurrency(data.amount, "GBP")}
                </span>
              </div>
              {data.job.description && (
                <p className="text-sm text-gray-600 mt-2">{data.job.description}</p>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 relative z-[10000] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Always visible */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl z-10 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold mb-0">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
              disabled={isLoading}
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable body with max-height */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Payment Methods - Shown at top */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Method</h3>
            
            {isLoadingMethods ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : paymentMethods.length > 0 ? (
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPaymentMethod?.id === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FiCreditCard size={20} className="text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {method.cardBrand?.toUpperCase() || "Card"} •••• {method.lastFourDigit}
                          </p>
                          {method.default && (
                            <span className="text-xs text-blue-600">Default</span>
                          )}
                        </div>
                      </div>
                      {selectedPaymentMethod?.id === method.id && (
                        <FiCheck className="text-blue-500" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <FiAlertCircle className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="text-gray-600 mb-3">No payment methods available</p>
                <button
                  onClick={handleAddCard}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add Payment Method
                </button>
              </div>
            )}
          </div>

          {/* Plan/Order/Job Details */}
          {renderContent()}
        </div>

        {/* Footer - Always visible */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 rounded-b-2xl p-6 flex items-center justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedPaymentMethod || paymentMethods.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Processing...
              </>
            ) : (
              "Confirm Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

