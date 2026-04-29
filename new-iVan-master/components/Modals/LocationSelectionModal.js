'use client';

import { Modal } from "react-bootstrap";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronRight, FiMapPin, FiX } from "react-icons/fi";
import { getLocationOptions } from "@/utils/helper";
import LanguageSelectionModal from "./LanguageSelectionModal";
import { LOCALES, LOCALE_NAMES } from "@/i18n/routing";
import { LOCALE_FLAGS } from "@/utils/localeFlags";

const getAvailableLanguages = (locationCode) => {
  if (!locationCode) return [];

  switch (locationCode) {
    case "SA":
    case "AE":
    case "EG":
      return [
        { code: "en", name: "English", nativeName: LOCALE_NAMES.en },
        { code: "ar", name: "Arabic", nativeName: LOCALE_NAMES.ar },
      ];
    case "MA":
      return [
        { code: "en", name: "English", nativeName: LOCALE_NAMES.en },
        { code: "ar", name: "Arabic", nativeName: LOCALE_NAMES.ar },
        { code: "fr", name: "French", nativeName: LOCALE_NAMES.fr },
      ];
    case "CY":
      return [
        { code: "en", name: "English", nativeName: LOCALE_NAMES.en },
        { code: "el", name: "Greek", nativeName: LOCALE_NAMES.el },
      ];
    default:
      return [{ code: "en", name: "English", nativeName: LOCALE_NAMES.en }];
  }
};

const getLanguageFlag = (location, languageCode) => {
  if (location?.flag) {
    if (languageCode === "ar" && ["SA", "AE", "EG", "MA"].includes(location?.code)) {
      return location.flag;
    }
    if (languageCode === "el" && location?.code === "CY") {
      return location.flag;
    }
  }

  return LOCALE_FLAGS[languageCode] || "🌐";
};

export default function LocationSelectionModal({
  isOpen,
  onLocationSelect,
  onCancel = null,
  currentLocation = null,
  presentation = "modal",
}) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const locations = getLocationOptions();

  useEffect(() => {
    if (isOpen) {
      let persistedLocation = currentLocation;

      if (!persistedLocation) {
        try {
          const savedLocationRaw = localStorage.getItem("selectedLocation");
          persistedLocation = savedLocationRaw ? JSON.parse(savedLocationRaw) : null;
        } catch (error) {
          console.error("Error loading location from localStorage:", error);
          persistedLocation = null;
        }
      }

      setSavedLocation(persistedLocation);

      if (currentLocation) {
        setSelectedLocation(currentLocation);
      } else {
        try {
          const savedLocation = localStorage.getItem("selectedLocation");
          setSelectedLocation(savedLocation ? JSON.parse(savedLocation) : null);
        } catch (error) {
          console.error("Error loading location from localStorage:", error);
          setSelectedLocation(null);
        }
      }
    } else {
      setSelectedLocation(null);
      setSavedLocation(null);
      setShowLanguageModal(false);
      setSelectedLanguage(null);
    }
  }, [isOpen, currentLocation]);

  useEffect(() => {
    if (!showLanguageModal || !selectedLocation?.code) {
      return;
    }

    const availableLanguages = getAvailableLanguages(selectedLocation.code);
    const savedLanguage = typeof window !== "undefined"
      ? localStorage.getItem("selectedLanguage")
      : null;

    if (savedLanguage && availableLanguages.find((language) => language.code === savedLanguage)) {
      setSelectedLanguage(savedLanguage);
      return;
    }

    setSelectedLanguage(availableLanguages[0]?.code || null);
  }, [showLanguageModal, selectedLocation?.code]);

  useEffect(() => {
    if (presentation !== "page" || !isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen, presentation]);

  const handleLocationCardClick = (location) => {
    setSelectedLocation(location);
    if (showLanguageModal) {
      setShowLanguageModal(false);
    }
  };

  const handleClose = () => {
    if (!savedLocation) {
      return;
    }

    onCancel?.();
  };

  const handleLanguageSelect = (languageCode) => {
    if (!selectedLocation) {
      return;
    }

    const locationData = {
      ...selectedLocation,
      postCode: "",
    };

    localStorage.setItem("selectedLocation", JSON.stringify(locationData));

    const currentPath = window.location.pathname;
    const nonDefaultLocales = LOCALES.filter((locale) => locale !== "en");
    const localePattern = nonDefaultLocales.join("|");
    const localeRegex = new RegExp(`^/(${localePattern})(/|$)`);

    let newPath;
    if (languageCode === "en") {
      if (localeRegex.test(currentPath)) {
        newPath = currentPath.replace(localeRegex, "/");
        if (newPath === "" || newPath === "/") {
          newPath = "/";
        }
      } else {
        newPath = currentPath || "/";
      }
    } else if (localeRegex.test(currentPath)) {
      newPath = currentPath.replace(localeRegex, `/${languageCode}$2`);
    } else {
      const basePath = currentPath === "/" ? "" : currentPath;
      newPath = `/${languageCode}${basePath}`;
    }

    onLocationSelect(locationData);
    setShowLanguageModal(false);
    window.location.href = newPath;
  };

  const handleContinue = () => {
    if (showLanguageModal) {
      if (!selectedLanguage) {
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("selectedLanguage", selectedLanguage);
      }

      handleLanguageSelect(selectedLanguage);
      return;
    }

    if (!selectedLocation) {
      return;
    }

    if (selectedLocation.code === "GB" || selectedLocation.code === "US") {
      handleLanguageSelect("en");
      return;
    }

    const availableLanguages = getAvailableLanguages(selectedLocation.code);
    if (availableLanguages.length > 1) {
      setShowLanguageModal(true);
      return;
    }

    const locationData = {
      ...selectedLocation,
      postCode: "",
    };

    localStorage.setItem("selectedLocation", JSON.stringify(locationData));
    onLocationSelect(locationData);
  };

  if (!isOpen) {
    return null;
  }

  const canDismiss = Boolean(savedLocation);
  const isPagePresentation = presentation === "page";
  const hasExistingLocation = Boolean(savedLocation);
  const pageEyebrow = hasExistingLocation && !showLanguageModal
    ? `Currently browsing ${savedLocation.flag} ${savedLocation.name}`
    : null;
  const pageTitle = showLanguageModal
    ? "Which language do you prefer to continue in?"
    : hasExistingLocation
    ? "Changing your location?"
    : "Hey! Which country are you in?";
  const pageDescription = showLanguageModal
    ? selectedLocation
      ? `Selected location: ${selectedLocation.name} ${selectedLocation.flag}`
      : null
    : hasExistingLocation
    ? "Switch markets to refresh the shops, services and local experiences shown across the platform."
    : "Select your location to browse the right shops, services and local experiences.";

  const locationCards = locations.map((location, index) => {
    const isSelected = selectedLocation?.id === location.id;

    return (
      <button
        key={location.id}
        type="button"
        className={`location-selector-card${isSelected ? " is-selected" : ""}`}
        onClick={() => handleLocationCardClick(location)}
        aria-pressed={isSelected}
        style={{ animationDelay: `${index * 55}ms` }}
      >
        <span className="location-selector-card__flag" aria-hidden="true">
          {location.flag}
        </span>
        <span className="location-selector-card__copy">
          <span className="location-selector-card__title">{location.name}</span>
        </span>
        <span className="location-selector-card__icon" aria-hidden="true">
          {isSelected ? <FiCheck /> : <FiChevronRight />}
        </span>
      </button>
    );
  });

  const languageCards = getAvailableLanguages(selectedLocation?.code).map((language, index) => {
    const isSelected = selectedLanguage === language.code;

    return (
      <button
        key={language.code}
        type="button"
        className={`location-selector-card location-selector-card--language${isSelected ? " is-selected" : ""}`}
        onClick={() => setSelectedLanguage(language.code)}
        aria-pressed={isSelected}
        style={{ animationDelay: `${index * 65}ms` }}
      >
        <span className="location-selector-card__flag" aria-hidden="true">
          {getLanguageFlag(selectedLocation, language.code)}
        </span>
        <span className="location-selector-card__copy location-selector-card__copy--language">
          <span className="location-selector-card__title">{language.name}</span>
          <span className="location-selector-card__meta">{language.nativeName}</span>
        </span>
        <span className="location-selector-card__icon" aria-hidden="true">
          {isSelected ? <FiCheck /> : <FiChevronRight />}
        </span>
      </button>
    );
  });

  if (isPagePresentation) {
    const pageOverlay = (
      <div
        className="location-selector-page"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-selection-page-title"
        onClick={canDismiss ? handleClose : undefined}
      >
        <div
          className={`location-selector-page__panel${showLanguageModal ? " is-language-step" : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          {canDismiss && (
            <button
              type="button"
              className="location-selector-page__close"
              onClick={handleClose}
              aria-label="Close location selection"
            >
              <FiX />
            </button>
          )}

          <div className="location-selector-page__body">
            <section className="location-selector-page__hero">
              <div className="location-selector-page__art" aria-hidden="true">
                <span className="location-selector-page__shape location-selector-page__shape--one" />
                <span className="location-selector-page__shape location-selector-page__shape--two" />
                <span className="location-selector-page__shape location-selector-page__shape--three" />
                <span className="location-selector-page__pin location-selector-page__pin--primary">
                  <FiMapPin />
                </span>
                <span className="location-selector-page__pin location-selector-page__pin--secondary">
                  <FiMapPin />
                </span>
                <span className="location-selector-page__pin location-selector-page__pin--muted">
                  <FiMapPin />
                </span>
              </div>

              <h2 id="location-selection-page-title" className="location-selector-page__title">
                {pageTitle}
              </h2>
              {pageEyebrow && (
                <span className="location-selector-page__eyebrow">{pageEyebrow}</span>
              )}
              {pageDescription && (
                <p className="location-selector-page__description">{pageDescription}</p>
              )}
            </section>

            <section className="location-selector-page__choices">
              <div className={`location-selector-page__grid${showLanguageModal ? " is-language-grid" : ""}`}>
                {showLanguageModal ? languageCards : locationCards}
              </div>
            </section>
          </div>

          <div
            className={`location-selector-page__footer${
              !selectedLocation && !showLanguageModal ? " is-compact" : ""
            }`}
          >
            {selectedLocation && !showLanguageModal && (
              <div className="location-selector-page__summary">
                <span className="location-selector-page__summary-label">Selected location</span>
                <span className="location-selector-page__summary-value">
                  {selectedLocation.flag} {selectedLocation.name}
                </span>
              </div>
            )}

            {showLanguageModal && selectedLocation && (
              <div className="location-selector-page__summary">
                <span className="location-selector-page__summary-label">Selected location</span>
                <span className="location-selector-page__summary-value">
                  {selectedLocation.flag} {selectedLocation.name}
                </span>
              </div>
            )}

            <button
              type="button"
              className={`location-selector-continue${
                (showLanguageModal ? selectedLanguage : selectedLocation) ? " is-ready" : " is-disabled"
              }`}
              onClick={handleContinue}
              disabled={showLanguageModal ? !selectedLanguage : !selectedLocation}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );

    return typeof document !== "undefined" ? createPortal(pageOverlay, document.body) : null;
  }

  return (
    <>
        <LanguageSelectionModal
          isOpen={showLanguageModal}
          onLanguageSelect={handleLanguageSelect}
          location={selectedLocation}
        />
      <Modal
        size="md"
        show={isOpen && !showLanguageModal}
        onHide={handleClose}
        centered
        aria-labelledby="location-selection-modal"
        className="location-selection-modal p-2"
        backdrop="static"
        keyboard={false}
      >
        <div className="p-0">
          <Modal.Body className="!p-2 sm:!p-3">
            <div className="text-center mb-3">
              <div className="d-inline-flex align-items-center justify-content-center">📍</div>
              <h4 id="location-selection-modal" className="fw-bold mb-1">
                Select Your Location
              </h4>
              <p className="text-muted mb-0 small">
                Choose your location to see relevant shops and services
              </p>
            </div>

            <div className="row">
              {locations.map((location) => {
                const isSelected = selectedLocation?.id === location.id;
                return (
                  <div key={location.id} className="col-12">
                    <div
                      className="location-card border-1 position-relative overflow-hidden"
                      onClick={() => handleLocationCardClick(location)}
                      style={{
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        borderRadius: "10px",
                        borderColor: isSelected ? "#00403f" : "#dee2e6",
                        backgroundColor: isSelected ? "rgba(0, 64, 63, 0.2)" : "transparent",
                        boxShadow: isSelected ? "0 2px 8px rgba(0, 64, 63, 0.2)" : "none",
                        color: isSelected ? "#ffffff" : "#212529",
                        marginBottom: "10px",
                      }}
                    >
                      <div className="card-body p-1">
                        <div className="d-flex align-items-center">
                          <div className="flag-container me-3">
                            <div
                              className="flag-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                backgroundColor: isSelected ? "#00403f" : "#f8f9fa",
                                fontSize: "1.8rem",
                                transition: "all 0.3s ease",
                              }}
                            >
                              {location.flag}
                            </div>
                          </div>

                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <h6 className="mb-0 fw-bold" style={{ color: isSelected ? "#00403f" : "#212529" }}>
                                {location.name}
                              </h6>
                            </div>
                            <p
                              className="mb-0 text-nowrap"
                              style={{ fontSize: "0.8rem", color: isSelected ? "#00403f" : "#6c757d" }}
                            >
                              <span className="me-1">📍</span>
                              {location.cities?.join(", ") || ""}
                            </p>
                          </div>

                          <div className="ms-2">
                            {isSelected ? (
                              <span className="d-inline-flex align-items-center justify-content-center">📍</span>
                            ) : (
                              <i className="bi bi-chevron-right fs-5 text-muted" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2">
              <button
                type="button"
                className="custom_btn_solid w-100 px-4 py-2"
                onClick={handleContinue}
                disabled={!selectedLocation}
                style={{
                  opacity: !selectedLocation ? 0.6 : 1,
                  cursor: !selectedLocation ? "not-allowed" : "pointer",
                }}
              >
                <i className="bi bi-check-circle me-2" />
                Continue
              </button>
            </div>
          </Modal.Body>
        </div>
      </Modal>
    </>
  );
}
