"use client";
import { useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { FiCreditCard, FiStar } from "react-icons/fi";

import { AppContext } from "@/lib/contexts/context";
import { getCurrencySymbol } from "@/utils/helper";
import CheckoutModal from "@/components/Modals/CheckoutModal";

export default function PricingPage() {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState({});
  const { plans, plansLoading, subscription, setSubscription } = useContext(AppContext);
  const [isYearly, setIsYearly] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const anyGBPlan = (plans || []).some(p => p.plan_region === 'GB');

  const computeDisplayedPrice = (plan) => {
    const monthly = Number(plan.price) || 0;
    if (!isYearly) return monthly;

    // yearly: monthly * 12
    let yearly = monthly * 12;
    // apply 30% off if plan region indicates GB
    if (plan.plan_region === 'GB') {
      yearly = yearly * 0.7; // 30% off
    }
    return yearly;
  };

  const handleSubscribe = async (plan) => {
    if(plan.plan_id === 1){
      handleActivateFreeTrial(plan);
      return;
    }
    
    // Calculate amount
    let amount = Number(plan.price) || 0;
    if (isYearly) {
      amount = amount * 12;
      if (plan.plan_region === 'GB') {
        amount = amount * 0.7; // 30% discount
      }
    }
    
    // Open checkout modal
    setSelectedPlan({
      planId: plan.plan_id,
      planType: isYearly ? "yearly" : "monthly",
      plan: plan,
      amount: amount,
      currency: plan.currency || "GBP",
    });
    setShowCheckoutModal(true);
  };
  
const handleActivateFreeTrial = async (plan) => {
  setLoading((prev) => ({ ...prev, [plan.plan_id]: true }));

  try {
    const response = await fetch("/api/subscription/free-trial", {
      method: "POST",
      body: JSON.stringify({ planId: plan.plan_id }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.success) {
      toast.success(data.message || "Free trial activated successfully!");
      if (data.data) {
        setSubscription(data.data);
      }
    } else {
      toast.error(data.message || "Unable to activate free trial. Please try again.");
    }
  } catch (error) {
    console.error("Error activating free trial:", error);
    toast.error(error?.message || "Something went wrong while activating the free trial.");
  } finally {
    setLoading((prev) => ({ ...prev, [plan.plan_id]: false }));
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <section className="section">
        <div className="container">
          {/* Header */}
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="fw-bold mb-3">{t("choose_plan")}</h2>
              <p className="lead text-muted">{t("select_perfect_plan")}</p>

              {/* Current Subscription Status */}
              {subscription &&
                (subscription.status === "active" ||
                  (subscription.status === "cancelled" &&
                    new Date(subscription.end_date) > new Date())) &&
                subscription.end_date && (
                  <div className="my-4">
                    <div
                      className="d-inline-flex align-items-center px-3 py-2 rounded-3"
                      style={{ backgroundColor: "#d1e7dd", color: "#0f5132" }}
                    >
                      <FiCreditCard className="me-2" size={16} />
                      <span>
                        {t("subscription_expires", {
                          date: formatDate(subscription.end_date),
                        })}
                      </span>
                    </div>
                  </div>
                )}
              {subscription && subscription.status === "expired" && (
                <div className="my-4">
                  <div
                    className="d-inline-flex align-items-center px-3 py-2 rounded-3"
                    style={{ backgroundColor: "#f8d7da", color: "#721c24" }}
                  >
                    <FiCreditCard className="me-2" size={16} />
                    <span>{t("subscription_expired")}</span>
                  </div>
                </div>
              )}
              {subscription && subscription.status === "cancelled" && (
                <div className="my-4">
                  <div
                    className="d-inline-flex align-items-center px-3 py-2 rounded-3"
                    style={{ backgroundColor: "#fff3cd", color: "#856404" }}
                  >
                    <FiCreditCard className="me-2" size={16} />
                    <span>{t("subscription_cancelled")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          {anyGBPlan && 
          <div className="d-flex justify-content-center mb-4">
            <div className="rounded-2xl bg-[#f4f7fb] p-1 shadow-sm d-inline-flex">
              <button
                className={`!px-6 py-2 focus:outline-none rounded-2xl transition-colors duration-150 ${!isYearly ? 'bg-white text-[#0f4db6] shadow-sm' : 'text-gray-600'}`}
                onClick={() => setIsYearly(false)}
                aria-pressed={!isYearly}
              >
                {t('monthly')}
              </button>

              <button
                className={`!px-6 py-2 focus:outline-none rounded-2xl transition-colors duration-150 ${isYearly ? 'bg-white text-[#0f4db6] shadow-sm' : 'text-gray-600'}`}
                onClick={() => setIsYearly(true)}
                aria-pressed={isYearly}
              >
                {t('yearly')}
              <span className="badge bg-light text-primary ms-2" style={{ borderRadius: 8, padding: '6px 8px', fontSize: '12px' }}>
                {`${30}% off`}
              </span>
              </button>
            </div>
          </div>
          }

          <div className="row justify-content-center g-4">
            {plansLoading && (
              <div className="text-center w-100 py-8">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            {!plansLoading && (plans || []).map((plan, index) => (
              <div key={plan.plan_id} className="col-lg-4 col-md-6">
                <div className="card h-100 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="card-body p-4">
                    {index === 1 && (
                      <div className="bg-gradient-to-r from-red-400 to-orange-400 text-white px-6 py-1 rounded-2xl text-sm font-semibold flex items-center w-fit ml-auto">
                        <FiStar className="mr-1" />
                        {t("most_popular")}
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <h3 className="card-title fw-bold mb-0">
                        {plan.name}
                      </h3>
                      <div className="text-4xl font-bold text-blue-600 mb-3">
                        <span className="text-2xl align-top">{getCurrencySymbol(plan.currency)}</span>
                        <span>
                          {computeDisplayedPrice(plan).toFixed(2)}
                        </span>
                        <span className="text-base text-gray-500 font-normal ms-2">
                          {plan.trial_days > 0 ? "" : isYearly ? t('per_year') : t('per_month')}
                        </span>
                      </div>
                      <p className="text-muted">{plan.description}</p>
                    </div>
                    <div className="text-center">
                      {subscription &&
                      (subscription.status === "active" ||
                        (subscription.status === "cancelled" &&
                          new Date(subscription.end_date) > new Date())) &&
                      subscription.plan_id === plan.plan_id ? (
                        <button
                          className="btn btn-success btn-lg w-100"
                          disabled
                        >
                          {t("current_plan")}
                        </button>
                      ) : subscription &&
                        (subscription.status === "active" ||
                          (subscription.status === "cancelled" &&
                            new Date(subscription.end_date) > new Date())) &&
                        subscription.plan_id < plan.plan_id ? (
                        <button
                          className="btn btn-warning btn-lg w-100"
                          onClick={() => handleSubscribe(plan)}
                          disabled={loading[plan.plan_id]}
                        >
                          {loading[plan.plan_id] ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                              ></span>
                              {t("processing")}
                            </>
                          ) : (
                            t("upgrade_plan")
                          )}
                        </button>
                      ) : subscription &&
                        (subscription.status === "active" ||
                          (subscription.status === "cancelled" &&
                            new Date(subscription.end_date) > new Date())) &&
                        subscription.plan_id > plan.plan_id ? (
                        <button
                          className="btn btn-secondary btn-lg w-100"
                          disabled
                        >
                          {t("downgrade_not_allowed")}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-lg w-100"
                          onClick={() => handleSubscribe(plan)}
                          disabled={loading[plan.plan_id]}
                        >
                          {loading[plan.plan_id] ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                              ></span>
                              {t("processing")}
                            </>
                          ) : (
                            t("subscribe_now")
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Checkout Modal */}
      {showCheckoutModal && selectedPlan && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedPlan(null);
          }}
          type="subscription"
          data={selectedPlan}
        />
      )}
    </>
  );
}

