"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { getLocationOptions } from "@/utils/helper";
import PhoneInput from "@/components/Fields/PhoneInput";
import InfoModal from "@/components/Modals/InfoModal";

export default function FulfilmentPage() {
  const router = useRouter();
  const t = useTranslations("PublicPages.fulfilment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    productRange: "",
    countryToSell: "",
  });
  const [errors, setErrors] = useState({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const popupMessages = {
    "scale_anywhere": "Expand your business globally with just one tap. Select any country and Swipped takes care of all the logistics, regulations, and operations so you can focus on growing your brand without worrying about international shipping, customs, or local compliance.",
    "sell_store_pack": "From inventory storage to packing and shipping, Swipped manages the entire fulfillment process. Your products are stored safely, orders are packed efficiently, and shipped quickly to your customers—ensuring a seamless shopping experience and happier buyers.",
    "real_time_dashboard": "Stay in control of your business with detailed, real-time analytics. Monitor sales, track growth, and understand your profits easily, so you can make data-driven decisions and optimize your operations for maximum efficiency.",
    "weekly_payouts": "Maintain smooth cash flow with weekly payouts directly to your bank account. Swipped ensures you get paid reliably and on time, giving you the funds you need to reinvest in your business and keep operations running without interruptions.",
    "no_signup_fees": "Start selling with zero upfront costs. There are no sign-up fees or hidden charges—Swipped only takes 15% of the revenue from successfully completed orders. You keep the rest, making it a risk-free way to scale your business quickly."
  };

  const handleFeatureClick = (featureKey) => {
    setPopupMessage(popupMessages[featureKey]);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setPopupMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t("errors.name_required");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("errors.email_invalid");
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = t("errors.contact_number_required");
    }
    if (!formData.productRange) {
      newErrors.productRange = t("errors.product_range_required");
    }
    if (!formData.countryToSell) {
      newErrors.countryToSell = t("errors.country_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t("toast.fill_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch("/api/fulfilment/inquire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(t("toast.submit_success"));
        setFormData({
          name: "",
          email: "",
          contactNumber: "",
          productRange: "",
          countryToSell: "",
        });
      } else {
        const data = await response.json();
        toast.error(data.message || t("toast.submit_failed"));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(t("toast.error_occurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header Section */}
          <div className="mb-5">
            <button
              onClick={() => router.back()}
              className="btn btn-link text-decoration-none p-0 mb-3"
              style={{ color: "#6c757d" }}
            >
              <i className="fa fa-arrow-left me-2" aria-hidden="true"></i>
              {t("back")}
            </button>
            <h1 className="mb-3">
              {t("title")}
            </h1>
            <p className="text-muted fs-5 mb-3">
              {t("description")}
            </p>
            <p className="text-muted fs-6 mb-4">
              <strong>{t("launch_date")}</strong>
            </p>
            <p className="text-muted">
              {t("form_instruction")}
            </p>
          </div>

          {/* Hero Image */}
          <div
            className="mb-5"
            style={{ overflow: "hidden", borderRadius: "8px" }}
          >
            <img
              src="/assets/img/slider/swipped_05.jpg"
              alt={t("title")}
              className="w-100 h-100"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Features Section */}
          <div className="card shadow-sm border-0 mb-5">
            <div className="card-body p-3">
              <h3 className="mb-4 text-start">{t("features.title")}</h3>
              <ul className="list-unstyled text-start" style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0 }}></i>
                  <span 
                    onClick={() => handleFeatureClick("scale_anywhere")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    {t("features.scale_anywhere")}
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0 }}></i>
                  <span 
                    onClick={() => handleFeatureClick("sell_store_pack")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    {t("features.sell_store_pack")}
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0 }}></i>
                  <span 
                    onClick={() => handleFeatureClick("real_time_dashboard")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    {t("features.real_time_dashboard")}
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0 }}></i>
                  <span 
                    onClick={() => handleFeatureClick("weekly_payouts")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    {t("features.weekly_payouts")}
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0 }}></i>
                  <span 
                    onClick={() => handleFeatureClick("no_signup_fees")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    {t("features.no_signup_fees")}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="card shadow-sm border-0 mt-5">
            <div className="card-body p-5">
              <h2 className="mb-4">{t("form_title")}</h2>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label htmlFor="name" className="form-label">
                      {t("form.name")}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.name ? "is-invalid" : ""
                      }`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label">
                      {t("form.email")}
                    </label>
                    <input
                      type="email"
                      className={`form-control !h-[42px] ${
                        errors.email ? "is-invalid" : ""
                      }`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="contactNumber" className="form-label">
                      {t("form.contact_number")}
                    </label>
                    <PhoneInput
                      className={`border border-[#DEE2E6] rounded-2 !py-0 !px-2 ${
                        errors.contactNumber ? "is-invalid" : ""
                      }`}
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.contactNumber && (
                      <div className="invalid-feedback">
                        {errors.contactNumber}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="productRange" className="form-label">
                      {t("form.product_range")}
                    </label>
                    <select
                      className={`form-select ${
                        errors.productRange ? "is-invalid" : ""
                      }`}
                      id="productRange"
                      name="productRange"
                      value={formData.productRange}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">{t("form.select_product_range")}</option>
                      <option value="1-10">1-10</option>
                      <option value="10-50">10-50</option>
                      <option value="50-100">50-100</option>
                      <option value="100-500">100-500</option>
                      <option value="1000+">1000+</option>
                    </select>
                    {errors.productRange && (
                      <div className="invalid-feedback">
                        {errors.productRange}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="countryToSell" className="form-label">
                      {t("form.country_to_sell")}
                    </label>
                    <select
                      className={`form-select ${
                        errors.countryToSell ? "is-invalid" : ""
                      }`}
                      id="countryToSell"
                      name="countryToSell"
                      value={formData.countryToSell}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">{t("form.select_country")}</option>
                      {getLocationOptions().map((location) => (
                        <option key={location.id} value={location.country}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    {errors.countryToSell && (
                      <div className="invalid-feedback">
                        {errors.countryToSell}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="custom_btn_solid"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {t("form.submitting")}
                      </>
                    ) : (
                      t("form.submit")
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Info Popup Modal */}
      <InfoModal
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        title="Information"
        message={popupMessage}
        icon="fa-info-circle"
      />
    </div>
  );
}

