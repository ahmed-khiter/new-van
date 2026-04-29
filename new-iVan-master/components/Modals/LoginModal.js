"use client";
import { yupResolver } from "@hookform/resolvers/yup";
import { signIn, useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import { useOnBoard } from "@/lib/hooks/useOnBoard";
import { useTranslations } from "next-intl";
import { FiEye, FiEyeOff } from "react-icons/fi";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const t = useTranslations("AuthPages.login");
  const tCommon = useTranslations("Auth");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const { checkOnBoardStatus } = useOnBoard();
  const [isCredLogin, setIsCredLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    const { email, password } = data;
    setIsLoading(true);
    setIsCredLogin(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res.error) {
        toast.error(res?.error || t("error_toast"));
        setIsLoading(false);
        return;
      }

      if (res.ok) {
        toast.success(t("success_toast"));
        reset();
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        onClose();
      }
    } catch (error) {
      toast.error(tCommon("something_went_wrong"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      setShowPassword(false);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1055] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-[420px] rounded-[24px] border border-[#ebebeb] bg-white px-8 py-8 shadow-[0_4px_40px_rgba(0,0,0,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f5] text-[#6b7280] hover:bg-[#ebebeb] transition"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="mb-1 text-[22px] font-bold tracking-[-0.02em] text-[#1a1a2e]">
          {t("modal_title")}
        </h2>
        <p className="mb-6 text-[14px] text-[#6b7280]">{t("subtitle")}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="modal-email" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
              {t("email_label")}
            </label>
            <input
              type="text"
              id="modal-email"
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

          <div>
            <label htmlFor="modal-password" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
              {t("password_label")}
            </label>
            <div className="relative">
              <input
                id="modal-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`h-[52px] w-full rounded-[14px] border px-4 pr-12 text-[15px] text-[#1a1a2e] outline-none transition placeholder:text-[#9ca3af] focus:ring-0 ${
                  errors.password
                    ? "border-[#ef4444] focus:border-[#ef4444]"
                    : "border-[#d1d5db] focus:border-[#1a1a2e]"
                }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#1a1a2e] transition"
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[12px] text-[#ef4444]">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="flex h-[52px] w-full items-center justify-center rounded-full bg-[#1a1a2e] text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t("loading")}
              </span>
            ) : t("submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#6b7280]">
          {t("signup_prompt")}{" "}
          <Link href="/register" className="font-semibold text-[#1a1a2e] no-underline hover:underline">
            {t("signup_link")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
