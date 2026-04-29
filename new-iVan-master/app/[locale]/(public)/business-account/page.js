"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import toast from "react-hot-toast";
import PhoneInput from "@/components/Fields/PhoneInput";
import InfoModal from "@/components/Modals/InfoModal";

export default function BusinessAccountPage() {
  const router = useRouter();
  const t = useTranslations("PublicPages.businessAccount");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyNumber: "",
    companyName: "",
    email: "",
    contactNumber: "",
    limitRequest: "",
    customLimit: "",
  });
  const [errors, setErrors] = useState({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const popupMessages = {
    "Hire workers instantly from your phone": "Find and book skilled workers anytime, anywhere. Customize your booking: hire 1–100 service providers at once—no calls or emails needed.",
    "Use any Swipped service with no upfront payment": "Start using services immediately without paying upfront. Request a credit limit once approved and enjoy 30 days to pay interest-free.",
    "Pay later with full transparency": "Track your pending payments, due dates, and invoices easily. Always clear, always transparent—no hidden charges.",
    "Enjoy a 3% discount on all booking fees": "Save 3% on every booking automatically. No codes, no hassle—your discount is applied instantly.",
    "Designed for small businesses, freelancers, and growing teams": "Swipped helps you manage flexible teams and grow your business efficiently, without extra overhead or complexity."
  };

  const handleFeatureClick = (text) => {
    setPopupMessage(popupMessages[text]);
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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("errors.first_name_required");
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("errors.last_name_required");
    }
    if (!formData.companyNumber.trim()) {
      newErrors.companyNumber = t("errors.company_number_required");
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = t("errors.company_name_required");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("errors.email_invalid");
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = t("errors.contact_number_required");
    }
    if (!formData.limitRequest) {
      newErrors.limitRequest = t("errors.limit_request_required");
    }
    if (formData.limitRequest === "custom" && !formData.customLimit.trim()) {
      newErrors.customLimit = t("errors.custom_limit_required");
    }
    if (formData.limitRequest === "custom" && formData.customLimit.trim()) {
      const customLimitValue = parseFloat(formData.customLimit);
      if (isNaN(customLimitValue) || customLimitValue <= 0) {
        newErrors.customLimit = t("errors.custom_limit_invalid");
      } else if (customLimitValue > 25000) {
        newErrors.customLimit = t("errors.custom_limit_max");
      }
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
      const response = await fetch("/api/business-account/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(t("toast.submit_success"));
        setFormData({
          firstName: "",
          lastName: "",
          companyNumber: "",
          companyName: "",
          email: "",
          contactNumber: "",
          limitRequest: "",
          customLimit: "",
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
            {/* <button
              onClick={() => router.back()}
              className="btn btn-link text-decoration-none p-0 mb-3"
              style={{ color: "#6c757d" }}
            >
              <i className="fa fa-arrow-left me-2" aria-hidden="true"></i>
              {t("back")}
            </button> */}
            <h1 className="mb-3">{t("title")}</h1>
            <p className="text-muted fs-5">
              {t("description")}
            </p>
          </div>

          {/* Hero Image */}
          <div
            className="mb-5"
            style={{ overflow: "hidden", borderRadius: "8px" }}
          >
            <img
              src="/assets/img/slider/swipped_03.jpg"
              alt={t("title")}
              className="w-100 h-100"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Features Section */}
          <div className="card shadow-sm border-0 mb-5">
            <div className="card-body p-3">
            <h1 className="mb-3">
                Instant credit to grow your business — use Swipped services now, pay later.
              </h1>
              <p className="text-muted mb-4 text-start" style={{ fontSize: "1.1rem" }}>
                Unlock a flexible spending limit that gives your business the cash flow it needs to scale.
              </p>
              <ul className="list-unstyled text-start" style={{ fontSize: "1rem", lineHeight: "1.8" }}>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0, color: "#28a745" }}></i>
                  <span 
                    onClick={() => handleFeatureClick("Hire workers instantly from your phone")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    Hire workers instantly from your phone
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0, color: "#28a745" }}></i>
                  <span 
                    onClick={() => handleFeatureClick("Use any Swipped service with no upfront payment")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    Use any Swipped service with no upfront payment
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0, color: "#28a745" }}></i>
                  <span 
                    onClick={() => handleFeatureClick("Pay later with full transparency")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    Pay later with full transparency
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0, color: "#28a745" }}></i>
                  <span 
                    onClick={() => handleFeatureClick("Enjoy a 3% discount on all booking fees")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    Enjoy a 3% discount on all booking fees
                  </span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="fa fa-check-circle text-success me-2 mt-2" aria-hidden="true" style={{ flexShrink: 0, color: "#28a745" }}></i>
                  <span 
                    onClick={() => handleFeatureClick("Designed for small businesses, freelancers, and growing teams")}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    Designed for small businesses, freelancers, and growing teams
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Application Form */}
          <div className="card shadow-sm border-0 mt-5">
            <div className="card-body p-5">
              <h2 className="mb-4">{t("apply_title")}</h2>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="firstName" className="form-label">
                      {t("form.first_name")}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.firstName ? "is-invalid" : ""
                      }`}
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback">{errors.firstName}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="lastName" className="form-label">
                      {t("form.last_name")}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.lastName ? "is-invalid" : ""
                      }`}
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback">{errors.lastName}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="companyName" className="form-label">
                      {t("form.company_name")}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.companyName ? "is-invalid" : ""
                      }`}
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.companyName && (
                      <div className="invalid-feedback">
                        {errors.companyName}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="companyNumber" className="form-label">
                      {t("form.company_number")}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.companyNumber ? "is-invalid" : ""
                      }`}
                      id="companyNumber"
                      name="companyNumber"
                      value={formData.companyNumber}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.companyNumber && (
                      <div className="invalid-feedback">
                        {errors.companyNumber}
                      </div>
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

                  <div className="col-12">
                    <label className="form-label">{t("form.limit_request")}</label>
                    <div className="mt-2">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="limitRequest"
                          id="limit1000"
                          value="1000"
                          checked={formData.limitRequest === "1000"}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="limit1000">
                          {t("form.limit_1000")}
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="limitRequest"
                          id="limit3000"
                          value="3000"
                          checked={formData.limitRequest === "3000"}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="limit3000">
                          {t("form.limit_3000")}
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="limitRequest"
                          id="limit5000"
                          value="5000"
                          checked={formData.limitRequest === "5000"}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="limit5000">
                          {t("form.limit_5000")}
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="limitRequest"
                          id="limitCustom"
                          value="custom"
                          checked={formData.limitRequest === "custom"}
                          onChange={handleInputChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="limitCustom"
                        >
                          {t("form.limit_custom")}
                        </label>
                      </div>
                      {formData.limitRequest === "custom" && (
                        <div className="mt-3 ms-4">
                          <input
                            type="number"
                            className={`form-control ${
                              errors.customLimit ? "is-invalid" : ""
                            }`}
                            id="customLimit"
                            name="customLimit"
                            placeholder={t("form.custom_limit_placeholder")}
                            value={formData.customLimit}
                            onChange={handleInputChange}
                            min="1"
                            max="25000"
                            step="0.01"
                          />
                          {errors.customLimit && (
                            <div className="invalid-feedback">
                              {errors.customLimit}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.limitRequest && (
                      <div className="text-danger small mt-1">
                        {errors.limitRequest}
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

