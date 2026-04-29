"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

const ActivatePage = () => {
  const t = useTranslations("AuthPages.activate");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [activationStatus, setActivationStatus] = useState(null);
  const [isActivated, setIsActivated] = useState(false); // Flag to prevent multiple activations
  const [isLoading, setIsLoading] = useState(false); // Flag to track the loading state

  // useRef to track if the toast has been shown
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (token && !isActivated && !isLoading) { // Only trigger activation once
      activateAccount();
    }
  }, [token, isActivated, isLoading]); // Dependencies: token, isActivated, isLoading

  const activateAccount = async () => {
    setIsLoading(true); // Set loading state to true

    try {
      const res = await fetch(`/api/activate?token=${token}`, {
        method: "GET",
      });

      if (res.ok) {
        const data = await res.json();
        setIsActivated(true); // Set flag to prevent re-execution
        
        // If user was invited, redirect to setup password page
        if (data.isInvited && data.redirectTo) {
          router.replace(data.redirectTo);
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.success("Please set up your password to continue.", { duration: 2000 });
          }
        } else {
          // Regular activation - redirect to login
          router.replace("/login");
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.success(t("success_toast"), { duration: 2000 });
          }
        }
      } else {
        const { message } = await res.json();
        setActivationStatus(message || t("error_message"));
        toast.error(message || t("error_toast"));
      }
    } catch (err) {
      setActivationStatus(t("generic_error_message"));
      toast.error(t("error_toast"));
    } finally {
      setIsLoading(false); // Reset loading state after activation attempt
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">
          <div className="card mb-0">
            <div className="card-body text-center px-5 py-3">
              <h5 className="card-title mb-0">{t("title")}</h5>
              {activationStatus && (
                <div className="alert alert-danger mt-3">
                  {activationStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivatePage;
