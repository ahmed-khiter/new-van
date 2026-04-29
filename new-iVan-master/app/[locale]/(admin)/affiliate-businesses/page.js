"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatAmountToCurrency, fullDateFormate } from "@/utils/helper";

export default function AffiliateBusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch("/api/affiliate-businesses");
        const data = await response.json();
        if (response.ok) {
          setBusinesses(data.businesses || []);
        } else {
          setBusinesses([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  return (
    <>
      <div className="pagetitle">
        <h1>Affiliate-linked Businesses</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/admin-dashboard">Home</Link>
            </li>
            <li className="breadcrumb-item active">Affiliate Businesses</li>
          </ol>
        </nav>
      </div>

      <section className="section">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Onboarded Shops and Restaurants</h5>
            {loading ? (
              <div className="py-4 text-center">
                <div className="spinner-border" role="status" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Type</th>
                      <th>Owner</th>
                      <th>Affiliate</th>
                      <th>Orders</th>
                      <th>Commission</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.length > 0 ? (
                      businesses.map((business) => (
                        <tr key={business.id}>
                          <td>{business.name}</td>
                          <td className="text-capitalize">{business.type}</td>
                          <td>{business.ownerName || business.ownerEmail || "N/A"}</td>
                          <td>{business.affiliateName || business.affiliateEmail || "N/A"}</td>
                          <td>{business.totalOrders}</td>
                          <td>{formatAmountToCurrency(business.totalCommission)}</td>
                          <td>{fullDateFormate(business.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No affiliate-linked businesses found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
