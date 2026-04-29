"use client";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { jobCategories, services } from "@/utils/helper";

export default function EarningsCalculator() {
  const t = useTranslations("PublicPages.earningsCalculator");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showEarnings, setShowEarnings] = useState(false);

  const availableServices = jobCategories.filter(cat => 
    ['Van', 'Recovery', 'Cleaning', 'Locksmith', 'Car Key Replacement', 'Removals', 'Click & Collect'].includes(cat.value)
  );

  const serviceDailyWages = useMemo(() => {
    return services.reduce((acc, service) => {
      acc[service.id] = service.basePrice;
      return acc;
    }, {});
  }, []);

  const pricing = {
    UK: 1,
    Saudi: 1,
  };

  const monthlyEarnings = useMemo(() => {
    if (!selectedCountry || selectedServices.length === 0) return 0;
    const weeksPerMonth = 4;
    
    const totalEarnings = selectedServices.reduce((total, serviceValue) => {
      const dailyWage = serviceDailyWages[serviceValue] || 0;
      const serviceEarnings = dailyWage * daysPerWeek * weeksPerMonth;
      return total + serviceEarnings;
    }, 0);
    
    return totalEarnings * pricing[selectedCountry];
  }, [selectedServices, daysPerWeek, selectedCountry, serviceDailyWages]);

  const handleServiceChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedServices(options);
  };

  const handleDaysChange = (e) => {
    setDaysPerWeek(parseInt(e.target.value));
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (selectedServices.length > 0 && daysPerWeek > 0) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (selectedCountry) {
        setCurrentStep(3);
        setShowEarnings(true);
      }
    }
  };

  const handleEdit = (step) => {
    setCurrentStep(step);
    if (step === 1) {
      setShowEarnings(false);
    } else if (step === 2) {
      setShowEarnings(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedServices([]);
    setDaysPerWeek(5);
    setSelectedCountry(null);
    setShowEarnings(false);
  };

  return (
    <div className="mb-5 mt-3">
      <div className="card shadow-sm border-0 earnings-calculator-card-wrapper">
        <div className="card-body p-2 p-lg-5 sm:p-4">
          <div className="row g-4">
            <div className="col-lg-5 d-flex flex-column justify-content-center earnings-calculator-marketing">
              <h1>
                {t("title").split(". ").map((line, idx, arr) => {
                  const colors = ["text-red-500", "text-yellow-500", "text-green-500"];
                  return (
                    <span key={idx} className={colors[idx] || ""}>
                      {line}
                      {idx < arr.length - 1 && "."}
                      {idx < arr.length - 1 && <><br /></>}
                    </span>
                  );
                })}
              </h1>
              <p>
                {t("subtitle")}
              </p>
            
            </div>

            <div className="col-lg-7">
              <div className="earnings-calculator-card">
            <h2 className="earnings-calculator-title">
              {t("calculate_title")}
            </h2>

            <div className="earnings-calculator-progress">
              <div className="earnings-calculator-progress-line"></div>
              
              <div className="earnings-calculator-steps">
                <div className="earnings-calculator-step">
                  <div className={`earnings-calculator-step-indicator ${
                    currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''
                  }`}>
                    {currentStep > 1 && (
                      <span className="checkmark">✓</span>
                    )}
                  </div>
                  <div className="earnings-calculator-step-content">
                    <div className="earnings-calculator-step-header">
                      <h3 className="earnings-calculator-step-title">
                        {t("step1.title")}
                      </h3>
                      {currentStep > 1 && showEarnings && (
                        <button
                          onClick={() => handleEdit(1)}
                          className="earnings-calculator-edit-btn"
                        >
                          <i className="fa fa-pencil me-1"></i>{t("step1.edit")}
                        </button>
                      )}
                    </div>
                    {currentStep === 1 && (
                      <>
                        <p className="earnings-calculator-step-question">
                          {t("step1.question")}
                        </p>
                        <div className="mb-4">
                          <label className="earnings-calculator-vehicle-label">
                            {t("step1.select_services")}
                          </label>
                          <select
                            
                            value={selectedServices}
                            onChange={handleServiceChange}
                            className="earnings-calculator-vehicle-select"
                          >
                            {availableServices.map((service) => (
                              <option key={service.value} value={service.value}>
                                {service.label}
                              </option>
                            ))}
                          </select>
                          
                        </div>
                        <div className="mt-4">
                          <label className="earnings-calculator-vehicle-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                            {t("step1.days_question")}
                          </label>
                          <div>
                            <div className="earnings-calculator-mileage-display">
                              <span className="earnings-calculator-mileage-value">
                                {daysPerWeek}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="7"
                              step="1"
                              value={daysPerWeek}
                              onChange={handleDaysChange}
                              className="earnings-calculator-slider"
                            />
                            <div className="d-flex justify-content-between mt-1">
                              <span style={{ fontSize: "0.75rem", color: "#718096" }}>1</span>
                              <span style={{ fontSize: "0.75rem", color: "#718096" }}>7</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {currentStep > 1 && (
                      <div>
                        <p className="earnings-calculator-step-summary">
                          {selectedServices.length} {selectedServices.length === 1 ? t("common.service") : t("common.services")} • {daysPerWeek} {t("common.days_per_week")}
                        </p>
                        {selectedServices.map((serviceValue) => {
                          const service = availableServices.find(s => s.value === serviceValue);
                          return (
                            <p key={serviceValue} className="earnings-calculator-step-detail">
                              {service?.label || serviceValue}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {currentStep >= 2 && (
                  <div className="earnings-calculator-step">
                    <div className={`earnings-calculator-step-indicator ${
                      currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''
                    }`}>
                      {currentStep > 2 && (
                        <span className="checkmark">✓</span>
                      )}
                    </div>
                    <div className="earnings-calculator-step-content">
                      <div className="earnings-calculator-step-header">
                        <h3 className="earnings-calculator-step-title">
                          {t("step2.title")}
                        </h3>
                        {currentStep > 2 && showEarnings && (
                          <button
                            onClick={() => handleEdit(2)}
                            className="earnings-calculator-edit-btn"
                          >
                            <i className="fa fa-pencil me-1"></i>{t("step2.edit")}
                          </button>
                        )}
                      </div>
                      {currentStep === 2 && (
                        <>
                          <p className="earnings-calculator-step-question">
                            {t("step2.question")}
                          </p>
                          <div className="earnings-calculator-region-grid">
                            {Object.keys(pricing).map((country) => (
                              <button
                                key={country}
                                onClick={() => handleCountrySelect(country)}
                                className={`earnings-calculator-region-btn ${selectedCountry === country ? 'selected' : ''}`}
                              >
                                <span className="earnings-calculator-radio"></span>
                                {country}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {currentStep > 2 && selectedCountry && (
                        <p className="earnings-calculator-step-summary">
                          {selectedCountry}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 3 && showEarnings && (
                  <div className="earnings-calculator-step">
                    <div className="earnings-calculator-step-indicator active"></div>
                    <div className="earnings-calculator-step-content">
                      <h3 className="earnings-calculator-step-title" style={{ marginBottom: "1rem" }}>
                        {t("step3.title")}
                      </h3>
                      <div className="earnings-calculator-earnings-box">
                        <p className="earnings-calculator-earnings-label">
                          {t("step3.label")}
                        </p>
                        <h2 className="earnings-calculator-earnings-amount">
                          {selectedCountry === "UK" ? "£" : "SAR "}
                          {monthlyEarnings.toLocaleString()}
                          <span className="earnings-calculator-earnings-period">{t("step3.period")}</span>
                        </h2>
                        <p className="earnings-calculator-earnings-summary">
                          {selectedServices.length} {selectedServices.length === 1 ? t("common.service") : t("common.services")} • {daysPerWeek} {t("common.days_per_week")} • {selectedCountry}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="earnings-calculator-actions">
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={handleReset}
                    className="earnings-calculator-reset-btn"
                  >
                    <i className="fa fa-undo me-1"></i>{t("common.reset")}
                  </button>
                )}
              </div>
              <div className="earnings-calculator-continue-section">
                {currentStep < 3 && (
                  <span className="earnings-calculator-hint">
                    {currentStep === 1 ? t("common.takes_30_seconds") : t("common.almost")}
                  </span>
                )}
                {currentStep < 3 && (
                  <button
                    onClick={handleContinue}
                    disabled={(currentStep === 1 && selectedServices.length === 0) || (currentStep === 2 && !selectedCountry)}
                    className="earnings-calculator-continue-btn"
                  >
                    {currentStep === 1 ? t("common.continue") : t("common.calculate")}
                    {currentStep === 2 && (
                      <i className="fa fa-star ms-2" style={{ fontSize: "0.75rem" }}></i>
                    )}
                  </button>
                )}
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

