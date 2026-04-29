"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import toast from "react-hot-toast";

export default function AffiliateSettingsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = userRole === "admin" || userRole === "team-member";
  const [platformCommissionPercentage, setPlatformCommissionPercentage] = useState(15);
  const [affiliateSharePercentage, setAffiliateSharePercentage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/affiliate-settings");
        const data = await response.json();
        if (response.ok) {
          setPlatformCommissionPercentage(Number(data?.settings?.platformCommissionPercentage || 15));
          setAffiliateSharePercentage(Number(data?.settings?.affiliateSharePercentage || 10));
        }
      } catch (error) {
        toast.error("Failed to load affiliate settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!canManage) {
      toast.error("You do not have permission to update settings.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/affiliate-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformCommissionPercentage,
          affiliateSharePercentage,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save settings");
      }
      toast.success("Affiliate commission percentage updated.");
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="pagetitle">
        <h1>Affiliate Settings</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/admin-dashboard">Home</Link>
            </li>
            <li className="breadcrumb-item active">Affiliate Settings</li>
          </ol>
        </nav>
      </div>

      <section className="section">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Commission Percentage per Order</h5>
            {loading ? (
              <div className="py-4 text-center">
                <div className="spinner-border" role="status" />
              </div>
            ) : (
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label">Platform Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-control"
                    value={platformCommissionPercentage}
                    onChange={(e) => setPlatformCommissionPercentage(Number(e.target.value))}
                    disabled={!canManage}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Affiliate Share of Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-control"
                    value={affiliateSharePercentage}
                    onChange={(e) => setAffiliateSharePercentage(Number(e.target.value))}
                    disabled={!canManage}
                  />
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={!canManage || saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
                <div className="col-12">
                  <small className="text-muted">
                    Effective affiliate payout rate: {((platformCommissionPercentage * affiliateSharePercentage) / 100).toFixed(2)}%
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
