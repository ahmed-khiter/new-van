"use client";
import React, { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import PasswordForm from '@/components/Fields/PasswordForm'
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

const schema = yup.object().shape({
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")

    .required("Password is required")
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], "Passwords must match")
    .required("Confirm password is required"),
});

const ResetPasswordPage = () => {
  const router = useRouter();
  const t = useTranslations("AuthPages.resetPassword");
  const tCommon = useTranslations("Auth");
  const searchParams = useSearchParams();
  const isSetupPassword = searchParams.get("setup");
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    const { newPassword } = data;

    if (!token) {
      toast.error("Invalid reset link. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword , isSetupPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || t("success_toast"));
        router.replace("/login");
      } else {
        toast.error(result.message || result.error || t("error_toast"));
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(t("error_toast"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7 d-flex flex-column align-items-center justify-content-center">
          <div className="card mb-0 rounded-4">
            <div className="card-body">
              <div className="pt-4 pb-2">
                <h5 className="card-title text-center pb-0 fs-4">
                  {t("title")}
                </h5>
              </div>
              <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="col-12 eye-password">
                  <PasswordForm
                    name={"newPassword"}
                    label={t("new_password_label")}
                    getFieldValues={register}
                    fieldErrors={errors}
                    icon="bi-eye"
                  />
                </div>
                <div className="col-12 eye-password">
                  <PasswordForm
                    name={"confirmPassword"}
                    label={t("confirm_password_label")}
                    getFieldValues={register}
                    fieldErrors={errors}
                    icon="bi-eye"
                  />
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    className="custom_btn_solid w-100"
                    disabled={!isValid || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {tCommon("loading")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </button>
                </div>
              </form>
              <div className="mt-3 text-center">
                <Link href="/login" className="link_orange">
                  {tCommon("back_to_login")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
