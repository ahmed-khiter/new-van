"use client";
import React, { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";

// Define the validation schema using Yup
const schema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
});

const ForgotPasswordPage = () => {
  const t = useTranslations("AuthPages.forgotPassword");
  const tCommon = useTranslations("Auth");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    const { email } = data;
    setIsLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || t("success_toast"));
        router.replace("/login");
      } else {
        toast.error(result.message || result.error || t("error_toast"));
      }
      setIsLoading(false);
    } catch (err) {
      toast.error(t("generic_error_toast"));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="no-underline">
            <span className="text-[28px] font-black uppercase italic tracking-[-0.05em] text-[#1a1a2e]">
              swipped.
            </span>
          </Link>
        </div>

        <div className="rounded-[24px] border border-[#ebebeb] bg-white px-8 py-8 shadow-[0_4px_40px_rgba(0,0,0,0.08)]">
          <h1 className="mb-1 text-[22px] font-bold tracking-[-0.02em] text-[#1a1a2e]">
            {t("title")}
          </h1>
          <p className="mb-6 text-[14px] text-[#6b7280]">
            {t("subtitle")}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                {t("email_label")}
              </label>
              <input
                type="text"
                id="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`h-[52px] w-full rounded-[14px] border px-4 text-[15px] text-[#1a1a2e] outline-none transition placeholder:text-[#9ca3af] focus:ring-0 ${
                  errors.email
                    ? "border-[#ef4444] focus:border-[#ef4444]"
                    : "border-[#d1d5db] focus:border-[#1a1a2e]"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-[12px] text-[#ef4444]">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="mt-2 flex h-[52px] w-full items-center justify-center rounded-full bg-[#1a1a2e] text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {tCommon("loading")}
                </span>
              ) : (
                t("submit")
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[14px] text-[#6b7280]">
            <Link href="/login" className="font-semibold text-[#1a1a2e] no-underline hover:underline">
              {t("back_to_login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
