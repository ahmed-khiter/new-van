"use client";
import { useState, useEffect } from "react";
import PhoneInputWithCountry from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function PhoneInput({
  value = "",
  onChange,
  onBlur,
  className = "",
  placeholder,
  id,
  name,
  required = false,
  disabled = false,
  countryCode = null,
  ...props
}) {
  const [defaultCountry, setDefaultCountry] = useState("GB");
  const [selectedCountry, setSelectedCountry] = useState("GB");

  useEffect(() => {
    const detectCountry = () => {
      if (countryCode) {
        const normalizedCode = String(countryCode).trim().toUpperCase();
        const country =
          normalizedCode === "UK"
            ? "GB"
            : /^[A-Z]{2}$/.test(normalizedCode)
            ? normalizedCode
            : null;
        if (country) {
          setDefaultCountry(country);
          setSelectedCountry(country);
          return;
        }
      }

      if (typeof window !== "undefined") {
        try {
          const savedLocation = localStorage.getItem("selectedLocation");
          if (savedLocation) {
            const location = JSON.parse(savedLocation);
            if (location.code === "SA" || location.id === "sa") {
              setDefaultCountry("SA");
              setSelectedCountry("SA");
              return;
            }
            if (location.code === "GB" || location.id === "uk") {
              setDefaultCountry("GB");
              setSelectedCountry("GB");
              return;
            }
          }
        } catch (e) {
          console.warn("Error reading location from localStorage:", e);
        }

        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (
            timezone.includes("Riyadh") ||
            timezone.includes("Asia/Riyadh") ||
            timezone.includes("Asia/Dammam") ||
            timezone.includes("Asia/Jeddah")
          ) {
            setDefaultCountry("SA");
            setSelectedCountry("SA");
            return;
          }
          if (timezone.includes("London") || timezone.includes("Europe/London")) {
            setDefaultCountry("GB");
            setSelectedCountry("GB");
            return;
          }
        } catch (e) {
          console.warn("Error detecting timezone:", e);
        }

        try {
          const locale = navigator.language || navigator.userLanguage;
          if (locale.includes("ar") || locale.includes("SA")) {
            setDefaultCountry("SA");
            setSelectedCountry("SA");
            return;
          }
          if (locale.includes("en-GB") || locale.includes("GB")) {
            setDefaultCountry("GB");
            setSelectedCountry("GB");
            return;
          }
        } catch (e) {
          console.warn("Error detecting locale:", e);
        }
      }

      setDefaultCountry("GB");
      setSelectedCountry("GB");
    };

    detectCountry();

    const handleLocationChange = () => {
      detectCountry();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("locationChanged", handleLocationChange);
      window.addEventListener("storage", handleLocationChange);

      return () => {
        window.removeEventListener("locationChanged", handleLocationChange);
        window.removeEventListener("storage", handleLocationChange);
      };
    }
  }, [countryCode]);

  const handleChange = (phoneValue) => {
    if (onChange) {
      onChange({
        target: {
          value: phoneValue || "",
          name: name,
        },
      });
    }
  };

  const handleCountryChange = (country) => {
    if (country) {
      setSelectedCountry(country);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const wrapperStyle = props.style || {};
  const { style: inputStyle, ...restProps } = props;

  return (
    <div 
      className={`phone-input-wrapper ${className}`} 
      style={{ position: "relative", ...wrapperStyle }}
    >
      <PhoneInputWithCountry
        international
        defaultCountry={defaultCountry}
        country={selectedCountry}
        value={value}
        onChange={handleChange}
        onCountryChange={handleCountryChange}
        onBlur={handleBlur}
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="phone-input"
        numberInputProps={{
          style: {
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            fontSize: "inherit",
            fontFamily: "inherit",
          }
        }}
        style={{
          "--PhoneInputCountryFlag-height": "1.2em",
          "--PhoneInputCountryFlag-width": "1.5em",
          "--PhoneInputCountryFlag-borderRadius": "2px",
          ...inputStyle,
        }}
        {...restProps}
      />
    </div>
  );
}
