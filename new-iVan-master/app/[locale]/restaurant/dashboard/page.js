"use client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";

const activationSteps = [
  {
    id: "businessInfo",
    title: "Step 1: Update Business Information",
    points: [
      "Add your Restaurant Name",
      "Enter your Full Address",
      "Add your Phone Number",
      "Upload your Restaurant Logo"
    ],
    href: "/restaurant/details",
    icon: "bi-shop-window"
  },
  {
    id: "paymentDetails",
    title: "Step 2: Add Payment Details",
    points: [
      "Enter your Bank Account Details",
      "Or connect your Stripe/Payment Provider (Payments go directly to you)"
    ],
    href: "/restaurant/payouts",
    icon: "bi-credit-card-2-front"
  },
  {
    id: "openingHours",
    title: "Step 3: Set Opening Hours",
    points: [
      "Select your Working Days",
      "Set your Opening and Closing Times"
    ],
    href: "/restaurant/details",
    icon: "bi-calendar2-week"
  },
  {
    id: "firstProduct",
    title: "Step 4: Add At Least 1 Menu Item",
    points: [
      "Upload menu item image",
      "Add description",
      "Set price",
      "Choose category"
    ],
    href: "/restaurant/menu-items/add",
    icon: "bi-journal-richtext"
  }
];

export default function RestaurantDashboardPage() {
  const [progress, setProgress] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    const loadActivationProgress = async () => {
      try {
        const res = await fetch("/api/shops/activation-progress");
        if (!res.ok) return;
        const data = await res.json();
        setProgress(data?.steps || {});
      } catch (error) {
        console.error("Failed to load activation progress:", error);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadActivationProgress();
  }, []);

  const remainingSteps = useMemo(() => {
    if (loadingProgress) return activationSteps;
    return activationSteps.filter((step) => !progress[step.id]);
  }, [loadingProgress, progress]);

  return (
    <div className="pagetitle">
      <section className="activation-checklist-wrapper">
        <h1 className="activation-checklist-title">🚀 Activate Your Restaurant Account</h1>
        <p className="activation-checklist-subtitle">
          To start receiving orders, please complete your profile:
        </p>

        {remainingSteps.length > 0 ? (
          <div className="activation-steps-list">
            {remainingSteps.map((step) => (
              <Link href={step.href} className="text-decoration-none" key={step.id}>
                <article className="activation-step-card">
                  <div className="activation-step-main">
                    <span className="activation-step-check">
                      <i className="bi bi-check-lg" />
                    </span>
                    <div>
                      <h2 className="activation-step-title">{step.title}</h2>
                      <ul className="activation-step-points">
                        {step.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <span className="activation-step-icon">
                    <i className={`bi ${step.icon}`} />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <article className="activation-complete-card">
            <span className="activation-complete-check">
              <i className="bi bi-check-circle-fill" />
            </span>
            <div>
              <h2 className="activation-step-title mb-1">Account setup complete</h2>
              <p className="activation-complete-text mb-0">
                Great work. All activation steps are completed.
              </p>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

