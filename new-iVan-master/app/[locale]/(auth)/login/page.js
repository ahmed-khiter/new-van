"use client";
import { yupResolver } from "@hookform/resolvers/yup";
import { signIn, useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
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

const LoginPage = () => {
  const t = useTranslations("AuthPages.login");
  const tCommon = useTranslations("Auth");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const { checkOnBoardStatus } = useOnBoard()
  const [isCredLogin, setIsCredLogin] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });


  const onSubmit = async (data) => {
    const { email, password } = data;
    setIsLoading(true);
    setIsCredLogin(true)
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
        await checkOnBoardStatus();
        toast.success(t("success_toast"));
      }
    } catch (error) {
      toast.error(tCommon("something_went_wrong"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const runCheck = async () => {
      if (sessionStatus === "authenticated" && !isCredLogin) {
        await checkOnBoardStatus();
        toast.success(t("success_toast"));
      }
    };

    runCheck();
  }, [sessionStatus, checkOnBoardStatus, isCredLogin]);

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
          <p className="mb-6 text-[14px] text-[#6b7280]">{t("subtitle")}</p>

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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-semibold text-[#374151]">
                  {t("password_label")}
                </label>
                <Link href="/forgot-password" className="text-[12px] font-medium text-[#1a1a2e] underline-offset-2 hover:underline no-underline">
                  {t("forgot_password_link")}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
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
            <Link href="/register" className="font-semibold text-[#1a1a2e] underline-offset-2 hover:underline no-underline">
              {t("signup_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
