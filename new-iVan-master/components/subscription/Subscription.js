"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle, FiClock, FiCreditCard, FiDollarSign, FiCalendar, FiPackage } from "react-icons/fi";
import { formatAmountToCurrency } from "@/utils/helper";
import ConfirmationDialog from "@/components/Modals/ConfirmationModal";

export default function Subscription({ translationNamespace = "ProviderPages.subscription" }) {
  const t = useTranslations(translationNamespace);
  const { data: session } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  useEffect(() => {
    if (session) {
      fetchSubscription();
    }
  }, [session]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/status");
      const data = await response.json();
      
      if (response.ok) {
        setSubscription(data.subscription);
      } else {
        console.error("Failed to fetch subscription:", data.error);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/provider')) {
        router.push("/provider/pricing");
        return;
      }
    }
    router.push("/pricing");
  };

  const handleCancelSubscription = () => {
    setShowCancelConfirmation(true);
  };

  const confirmCancelSubscription = async () => {
    if (!subscription) return;
    
    setCancelling(true);
    setShowCancelConfirmation(false);
    
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        body: JSON.stringify({
          subscriptionId: subscription.subscription_id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t("subscription_cancelled_success"));
        // Refresh subscription data
        fetchSubscription();
      } else {
        toast.error(data.error || t("failed_cancel_subscription"));
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error(t("failed_cancel_subscription"));
    } finally {
      setCancelling(false);
    }
  };

  const handleCloseCancelConfirmation = () => {
    setShowCancelConfirmation(false);
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return t("active");
      case "upgraded":
        return t("upgraded");
      case "cancelled":
        return t("cancelled");
      case "expired":
        return t("expired");
      default:
        return t("no_subscription");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "upgraded":
        return "bg-info";
      case "cancelled":
        return "bg-warning";
      case "expired":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <FiCreditCard className="me-2" size={18} />
          <h6 className="mb-0">{t("title")}</h6>
        </div>
        <div className="card-body d-flex justify-content-center align-items-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t("loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="card">
      <div className="card-header d-flex align-items-center">
        <FiCreditCard className="me-2" size={18} />
        <h6 className="mb-0">{t("title")}</h6>
      </div>
      <div className="card-body pt-4">
        {subscription ? (
          <div>
            {/* Plan Name and Status */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h6 className="mb-2 text-muted small fw-normal">{t("current_plan")}</h6>
                <h5 className="mb-0 fw-bold text-primary">{subscription.plans?.name || "N/A"}</h5>
              </div>
              <div className={`badge ${getStatusBadgeClass(subscription.status)} d-flex align-items-center px-3 py-2`}>
                <span className="ms-1 fw-medium">{getStatusText(subscription.status)}</span>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="d-flex align-items-center text-muted small">
                  <FiDollarSign className="me-1" size={14} />
                  <span>{t("amount")}</span>
                </div>
                <div className="fw-bold text-success">
                  {formatAmountToCurrency(Number(subscription.amount_charged || 0))}
                </div>
              </div>
              <div className="col-6">
                <div className="d-flex align-items-center text-muted small">
                  <FiPackage className="me-1" size={14} />
                  <span>{t("type")}</span>
                </div>
                <div className="fw-bold">
                  {subscription.type || "monthly"}
                </div>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="d-flex align-items-center text-muted small">
                  <FiCalendar className="me-1" size={14} />
                  <span>{t("start_date")}</span>
                </div>
                <div className="small">
                  {new Date(subscription.start_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="col-6">
                <div className="d-flex align-items-center text-muted small">
                  <FiCalendar className="me-1" size={14} />
                  <span>{t("end_date")}</span>
                </div>
                <div className="small">
                  {subscription.end_date 
                    ? new Date(subscription.end_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : t("ongoing")
                  }
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {subscription.status === "active" && (
              <div className="alert alert-success py-2 px-3 small mb-0">
                <div className="d-flex align-items-center">
                  <FiCheckCircle className="me-2" size={14} />
                  <span>{t("active_subscription_message")}</span>
                </div>
              </div>
            )}

            {subscription.status === "cancelled" && new Date(subscription.end_date) > new Date() && (
              <div className="alert alert-warning py-2 px-3 small mb-0">
                <div className="d-flex align-items-center">
                  <FiClock className="me-2" size={14} />
                  <span>{t("cancelled_access_until", { date: new Date(subscription.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })}</span>
                </div>
              </div>
            )}

            {subscription.status === "cancelled" && new Date(subscription.end_date) <= new Date() && (
              <div className="alert alert-danger py-2 px-3 small mb-0">
                <div className="d-flex align-items-center">
                  <FiXCircle className="me-2" size={14} />
                  <span>{t("cancelled_access_expired")}</span>
                </div>
              </div>
            )}

            {subscription.status === "expired" && (
              <div className="alert alert-danger py-2 px-3 small mb-0">
                <div className="d-flex align-items-center">
                  <FiXCircle className="me-2" size={14} />
                  <span>{t("expired_renew_message")}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {subscription.status === "active" && (
              <button
                className="btn btn-outline-danger btn-sm w-100 mt-2"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {t("cancelling")}
                  </>
                ) : (
                  t("cancel_subscription")
                )}
              </button>
            )}
            
            {(subscription.status === "expired" || (subscription.status === "cancelled" && new Date(subscription.end_date) <= new Date())) && (
              <button
                className="btn btn-primary btn-sm w-100 mt-2"
                onClick={handleUpgrade}
              >
                {t("renew_subscription")}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <h6 className="mb-2">{t("no_active_subscription")}</h6>
            <p className="text-muted small mb-3">
              {t("subscribe_unlock_message")}
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleUpgrade}
            >
              {t("view_plans")}
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Confirmation Dialog */}
    <ConfirmationDialog
      isOpen={showCancelConfirmation}
      onClose={handleCloseCancelConfirmation}
      handleConfirm={confirmCancelSubscription}
      alertMessage={t("confirm_cancel_subscription")}
    />
    </>
    );
}



