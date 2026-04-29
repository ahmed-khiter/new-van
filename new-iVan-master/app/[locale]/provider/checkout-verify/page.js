"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import { formatAmountToCurrency } from "@/utils/helper";

export default function CheckoutVerifyPage() {
  const t = useTranslations("CheckoutVerify");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [status, setStatus] = useState("loading");
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const success = searchParams.get("success");
  const cancel = searchParams.get("cancel");
  const planId = searchParams.get("planId");

  useEffect(() => {
    if (success === "true") {
      setStatus("success");
      // Fetch plan details if planId is provided
      if (planId) {
        fetchPlanDetails(planId);
      } 
    } else if (cancel === "true") {
      setStatus("cancelled");
      setLoading(false);
    } else {
      setStatus("error");
      setLoading(false);
    }
  }, [success, cancel, planId]);

  const fetchPlanDetails = async (planId) => {
    try {
      const response = await fetch(`/api/subscription/plans`);
      const data = await response.json();
      if (response.ok && data.plans) {
        const plan = data.plans.find(p => p.plan_id === parseInt(planId));
        setPlanDetails(plan);
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push("/provider/dashboard");
  };

  const handleTryAgain = () => {
    router.push("/provider/pricing");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-4" style={{ width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">{t("loading")}</span>
          </div>
          <p className="text-muted fs-5">{t("verifying_subscription")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
   
      <section className="section mt-8">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              {status === "success" && (
                <div className="card border-success shadow-lg">
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle" style={{ width: "80px", height: "80px" }}>
                        <FiCheckCircle className="text-success" size={48} />
                      </div>
                    </div>
                    <h2 className="text-success mb-3 fw-bold">{t("payment_successful")}</h2>
                    <p className="lead mb-4 fs-5">
                      {t("thank_you_subscribing")}<br />
                      {t("subscription_activated")}
                    </p>
                    
                    {planDetails && (
                      <div className="alert alert-success border-0 mb-4" style={{ backgroundColor: "#d1e7dd" }}>
                        <h5 className="text-success mb-3">
                          <i className="bi bi-star-fill me-2"></i>
                          {t("subscription_details")}
                        </h5>
                        <div className="row text-start">
                          <div className="col-md-4">
                            <p className="mb-2"><strong>{t("plan")}</strong></p>
                            <p className="text-success fw-semibold">{planDetails.name}</p>
                          </div>
                          <div className="col-md-4">
                            <p className="mb-2"><strong>{t("amount")}</strong></p>
                            <p className="text-success fw-semibold">{formatAmountToCurrency(planDetails.price)}</p>
                          </div>
                          <div className="col-md-4">
                            <p className="mb-2"><strong>{t("status")}</strong></p>
                            <span className="badge bg-success fs-6">{t("active")}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="d-grid gap-3">
                      <button 
                        className="btn btn-success btn-lg px-5 py-3 fw-semibold"
                        onClick={handleContinue}
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        {t("continue_dashboard")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {status === "cancelled" && (
                <div className="card border-warning shadow-lg">
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle" style={{ width: "80px", height: "80px" }}>
                        <FiXCircle className="text-warning" size={48} />
                      </div>
                    </div>
                    <h2 className="text-warning mb-3 fw-bold">{t("payment_cancelled")}</h2>
                    <p className="lead mb-4 fs-5">
                      {t("payment_cancelled_desc")}<br />
                      {t("try_again_desc")}
                    </p>
                    <div className="d-grid gap-3">
                      <button 
                        className="btn btn-warning btn-lg px-5 py-3 fw-semibold"
                        onClick={handleTryAgain}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {t("try_again")}
                      </button>
                      <button 
                        className="btn btn-outline-secondary btn-lg px-5 py-3"
                        onClick={handleContinue}
                      >
                        <i className="bi bi-house me-2"></i>
                        {t("back_dashboard")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="card border-danger shadow-lg">
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle" style={{ width: "80px", height: "80px" }}>
                        <FiXCircle className="text-danger" size={48} />
                      </div>
                    </div>
                    <h2 className="text-danger mb-3 fw-bold">{t("payment_error")}</h2>
                    <p className="lead mb-4 fs-5">
                      {t("payment_error_desc")}<br />
                      {t("contact_support_desc")}
                    </p>
                    <div className="d-grid gap-3">
                      <button 
                        className="btn btn-danger btn-lg px-5 py-3 fw-semibold"
                        onClick={handleTryAgain}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {t("try_again")}
                      </button>
                      <button 
                        className="btn btn-outline-secondary btn-lg px-5 py-3"
                        onClick={handleContinue}
                      >
                        <i className="bi bi-house me-2"></i>
                        {t("back_dashboard")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

