"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FiCreditCard } from "react-icons/fi";
import toast from "react-hot-toast";
import Subscription from "@/components/subscription/Subscription";
import { truncateId, formatAmountToCurrency } from "@/utils/helper";

export default function BillingHistoryPage({ translationNamespace = "ProviderPages.billingHistory" }) {
  const t = useTranslations(translationNamespace);
  const { data: session } = useSession();
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchBillingHistory();
    }
  }, [session]);

  const fetchBillingHistory = async () => {
    try {
      const response = await fetch("/api/subscription/billing-history");
      const data = await response.json();

      if (response.ok) {
        setBillingHistory(data.billingHistory);
      } else {
        console.error("Failed to fetch billing history:", data.error);
        toast.error(t("failed_fetch_billing"));
      }
    } catch (error) {
      console.error("Error fetching billing history:", error);
      toast.error(t("failed_fetch_billing"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "400px" }}
            >
              <div className="spinner-border" role="status">
                <span className="visually-hidden">{t("loading")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">{t("title")}</h2>
          </div>

          {/* Billing History and Subscription Layout */}
          <div className="row">
            {/* Left Column - Billing History */}
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">{t("transaction_history")}</h6>
                </div>
                <div className="card-body">
                  {billingHistory.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th className="align-middle">{t("table_headers.date")}</th>
                            <th className="align-middle">{t("table_headers.plan")}</th>
                            <th className="align-middle">{t("table_headers.amount")}</th>
                            <th className="align-middle">{t("table_headers.transaction_id")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingHistory.map((item) => (
                            <tr key={item.transaction_id}>
                              <td className="align-middle">
                                <div className="d-flex flex-column">
                                 
                                  <span>{formatDate(item.date)}</span>
                                </div>
                              </td>
                              <td className="align-middle">
                                <div className="d-flex flex-column">
                                  <strong>{item.plan_name}</strong>
                                </div>
                              </td>
                              <td className="align-middle">
                                <div className="d-flex flex-column">
                                  <strong className="text-success">
                                    {formatAmountToCurrency(item.amount)}
                                  </strong>
                                </div>
                              </td>
                              <td className="align-middle">
                                <span className="text-muted small">
                                  {truncateId(item.transaction_id)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <FiCreditCard size={48} className="text-muted mb-3" />
                      <h6>{t("no_billing_history")}</h6>
                      <p className="text-muted">{t("no_subscriptions")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Subscription Details */}
            <div className="col-lg-6">
              <Subscription translationNamespace={translationNamespace.replace(".billingHistory", ".subscription")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



