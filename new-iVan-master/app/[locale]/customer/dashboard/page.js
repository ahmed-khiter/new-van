"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function VisitorDashboard() {
  const [stats, setStats] = useState({
    jobs: {
      total: 0,
      active: 0,
      completed: 0,
      pending: 0,
      open: 0,
      cancelled: 0
    },
    spending: {
      totalSpent: 0
    },
    transactions: {
      total: 0,
      payments: 0,
      transfers: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/visitor-dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pagetitle">
        <h1>Dashboard</h1>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pagetitle">
      <h1>Dashboard</h1>
      {/* <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/customer/dashboard">Home</a>
          </li>
          <li className="breadcrumb-item active">Dashboard</li>
        </ol>
      </nav> */}

      <div className="feature-box-container row g-4">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <Link href="/customer/jobs?tab=all">
          <div className="feature-box bg-white p-4 d-flex gap-2">
            <div className="feature-details">
              <span className="feature-title fw-bold d-block">
                My Activity
              </span>
              <span className="feature-count mt-1 fw-bold d-block">
                {stats.jobs.total}
              </span>
            </div>
            <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
              <i className="bi bi-briefcase" />
            </div>
          </div>
          </Link>
        </div>

        <div className="col-lg-4 col-md-6 col-sm-12">
          <Link href="/customer/jobs?tab=active">
          <div className="feature-box bg-white p-4 d-flex gap-2">
            <div className="feature-details">
              <span className="feature-title fw-bold d-block">
                Ongoing Orders
              </span>
              <span className="feature-count mt-1 fw-bold d-block">
                {stats.jobs.active}
              </span>
            </div>
            <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
              <i className="bi bi-arrow-clockwise" />
            </div>
          </div>
          </Link>
        </div>

        <div className="col-lg-4 col-md-6 col-sm-12">
          <Link href="/customer/jobs?tab=completed">
          <div className="feature-box bg-white p-4 d-flex gap-2">
            <div className="feature-details">
              <span className="feature-title fw-bold d-block">
                Completed Orders
              </span>
              <span className="feature-count mt-1 fw-bold d-block">
                {stats.jobs.completed}
              </span>
            </div>
            <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
              <i className="bi bi-check-circle" />
            </div>
          </div>
          </Link>
        </div>

        {/* <div className="col-lg-3 col-md-6 col-sm-12">
          <Link href="/customer/transactions">
            <div className="feature-box bg-white p-4 d-flex gap-2">
            <div className="feature-details">
              <span className="feature-title fw-bold d-block">
                Total Spent
              </span>
              <span className="feature-count mt-1 fw-bold d-block">
                {formatAmountToCurrency(stats.spending.totalSpent)}
              </span>
            </div>
            <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
              <i className="bi bi-currency-pound" />
            </div>
          </div>
          </Link>
        </div> */}
      </div>
    </div>
  );
}
