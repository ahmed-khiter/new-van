"use client";
import PasswordForm from "@/components/Fields/PasswordForm";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import { useTranslations } from "next-intl";

const schema = yup.object().shape({
  password: yup
    .string()
    .required("New Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

const ChangePasswordPage = () => {
  const t = useTranslations("ProviderPages.changePassword");
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to change password");
        setIsLoading(false);
        return;
      }

      toast.success(result.message || "Password updated successfully");
      reset();
      setIsLoading(false);
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="pagetitle">
        <h1>{t("title")}</h1>
      </div>
      <section className="section">
        <div className="row">
          <div className="col-lg-4">
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                  <div className="mb-3 mt-4 eye-password">
                    <PasswordForm 
                      name={"password"} 
                      label={t("password_label")} 
                      getFieldValues={register} 
                      fieldErrors={errors} 
                      icon="bi-eye" 
                    />
                  </div>

                  <div className="mb-3 eye-password">
                    <PasswordForm 
                      name={"confirm_password"} 
                      label={t("confirm_password_label")} 
                      getFieldValues={register} 
                      fieldErrors={errors} 
                      icon="bi-eye" 
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={!isDirty || !isValid || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {t("loading")}
                      </>
                    ) : (
                      t("save")
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ChangePasswordPage;

