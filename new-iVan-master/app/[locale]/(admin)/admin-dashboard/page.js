"use client";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { formatAmountToCurrency, fullDateFormate } from "@/utils/helper";

function DashboardPage() {
  const t = useTranslations("AdminPages.dashboard");
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAffiliate = userRole === "affiliate";
  const [loading, setLoading] = useState(false);
  const [affiliateData, setAffiliateData] = useState({
    summary: null,
    commissionHistory: [],
  });

  useEffect(() => {
    const fetchAffiliateDashboard = async () => {
      if (!isAffiliate) return;
      setLoading(true);
      try {
        const response = await fetch("/api/affiliate-dashboard");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to fetch affiliate dashboard");
        }
        setAffiliateData({
          summary: data.summary,
          commissionHistory: data.commissionHistory || [],
        });
      } catch (error) {
        setAffiliateData({ summary: null, commissionHistory: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateDashboard();
  }, [isAffiliate]);

  if (isAffiliate) {
    const summary = affiliateData.summary || {
      totalBusinessesOnboarded: 0,
      totalOrdersGenerated: 0,
      totalCommissionEarned: 0,
      totalCommissionPending: 0,
      totalCommissionPaid: 0,
    };

    return (
      <>
        <div className="pagetitle mb-3">
          <h1>Affiliate Dashboard</h1>
        </div>
        <div className="feature-box-container row g-3">
          <div className="col-md-6 col-lg-3">
            <div className="feature-box bg-white p-4 d-flex gap-2">
              <div className="feature-details">
                <span className="feature-title fw-bold d-block">Businesses Onboarded</span>
                <span className="feature-count mt-1 fw-bold d-block">{summary.totalBusinessesOnboarded}</span>
              </div>
              <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                <i className="bi bi-shop" />
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-box bg-white p-4 d-flex gap-2">
              <div className="feature-details">
                <span className="feature-title fw-bold d-block">Orders Generated</span>
                <span className="feature-count mt-1 fw-bold d-block">{summary.totalOrdersGenerated}</span>
              </div>
              <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                <i className="bi bi-cart-check" />
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-box bg-white p-4 d-flex gap-2">
              <div className="feature-details">
                <span className="feature-title fw-bold d-block">Commission Earned</span>
                <span className="feature-count mt-1 fw-bold d-block">
                  {formatAmountToCurrency(summary.totalCommissionEarned)}
                </span>
              </div>
              <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                <i className="bi bi-cash-stack" />
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-box bg-white p-4 d-flex gap-2">
              <div className="feature-details">
                <span className="feature-title fw-bold d-block">Pending Payouts</span>
                <span className="feature-count mt-1 fw-bold d-block">
                  {formatAmountToCurrency(summary.totalCommissionPending)}
                </span>
              </div>
              <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                <i className="bi bi-clock-history" />
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Commission History</h5>
            {loading ? (
              <div className="py-4 text-center">
                <div className="spinner-border" role="status" />
              </div>
            ) : affiliateData.commissionHistory.length > 0 ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Order Value</th>
                      <th>Rate</th>
                      <th>Commission</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliateData.commissionHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.shop?.name || "N/A"}</td>
                        <td>{formatAmountToCurrency(item.totalCartPrice || 0)}</td>
                        <td>{Number(item.affiliateCommissionRate || 0)}%</td>
                        <td>{formatAmountToCurrency(item.affiliateCommissionAmount || 0)}</td>
                        <td>
                          <span
                            className={`badge ${
                              item.affiliateCommissionStatus === "paid" ? "bg-success" : "bg-warning text-dark"
                            } text-uppercase`}
                          >
                            {item.affiliateCommissionStatus || "pending"}
                          </span>
                        </td>
                        <td>{fullDateFormate(item.affiliateCommissionPaidAt || item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted mb-2">No commission records yet.</p>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="feature-box-container row ">
        <div className="col-md-4">
          <div className="feature-box bg-white p-4 d-flex gap-2">
            <div className="feature-details ">
              <span className="feature-title fw-bold d-block ">
                {t("open_jobs_title")}
              </span>
              <span className="feature-count mt-1 fw-bold d-block">
                15
              </span>
            </div>
            <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
              <i className="bi bi-briefcase" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
