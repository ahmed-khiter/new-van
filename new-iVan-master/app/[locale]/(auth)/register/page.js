"use client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import PhoneInput from "@/components/Fields/PhoneInput";
import { useOnBoard } from "@/lib/hooks/useOnBoard";
import { useTranslations } from "next-intl";
import { getAllCountries, isBusinessAccountSupported, getLocationOptions } from "@/utils/helper";
import { FiEye, FiEyeOff } from "react-icons/fi";

const RegisterPage = () => {
  const t = useTranslations("AuthPages.register");
  const tCommon = useTranslations("Auth");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { checkOnBoardStatus } = useOnBoard();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("visitor");
  const [showShopName, setShowShopName] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = yup.object().shape({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phone: yup.string().optional(),
    role: yup
      .string()
      .required("Please select a role")
      .test("business-role-country", "Business accounts are only available in United Kingdom and Saudi Arabia", function(value) {
        const country = this.parent.country;
        if (!country) return true; // Country validation will handle this
        if (value === "provider" || value === "shop-owner" || value === "restaurant") {
          return isBusinessAccountSupported(country);
        }
        return true;
      }),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")

      .required("Password is required")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
    shopName: yup.string().when("role", (role, schema) => {
      return role && (role[0] === "shop-owner" || role[0] === "restaurant")
        ? schema.required(role[0] === "shop-owner" ? "Shop name is required for Shop Owner" : "Restaurant name is required for Restaurant Owner")
        : schema.optional();
    }),
    serviceType: yup.string().when("role", (role, schema) => {
      return role && role[0] === "shop-owner"
        ? schema.required("Please select a service type")
        : schema.optional();
    }),
    country: yup.string().required("Country is required"),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
    defaultValues: {
      role: "visitor",
      shopName: "",
      serviceType: "",
      country: "",
      phone: "",
    },
  });

  const onSubmit = async (data) => {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      shopName,
      serviceType,
      country,
      phone,
    } = data;
    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          role: role || selectedRole,
          password,
          phone: phone || null,
          shopName: showShopName ? shopName : undefined,
          serviceType: showShopName && selectedRole === "shop-owner" ? serviceType : undefined,
          country: country || null,
          latitude: selectedLocation?.lat || null,
          longitude: selectedLocation?.lng || null,
        }),
      });
      const registerResponse = await res.json();
      if (res.status === 400) {
        toast.error(registerResponse?.error);
      }
      if (res.status === 200) {
        toast.success(registerResponse?.message || t("success_toast"), { duration: 2000 });
        router.push("/login");
      }
      setIsLoading(false);
    } catch (error) {
      toast.error(t("error_toast"));
      setIsLoading(false);
    }
  };
  // Watch country field to sync with selectedCountry state
  const watchedCountry = watch("country");
  const selectedCountryCode =
    getAllCountries().find((c) => c.name === selectedCountry)?.code || null;
  
  useEffect(() => {
    if (watchedCountry && watchedCountry !== selectedCountry) {
      setSelectedCountry(watchedCountry);
      // Try to find location in getLocationOptions for coordinates
      const location = getLocationOptions().find(
        (loc) => loc.name === watchedCountry
      );
      setSelectedLocation(location || null);
      
      // If country doesn't support business accounts and a business role is selected, reset to visitor
      if (!isBusinessAccountSupported(watchedCountry)) {
        if (selectedRole === "provider" || selectedRole === "shop-owner" || selectedRole === "restaurant") {
          setSelectedRole("visitor");
          setValue("role", "visitor");
          setShowShopName(false);
        }
      }
    }
  }, [watchedCountry, selectedCountry, selectedRole, setValue]);

  useEffect(() => {
    const runCheck = async () => {
      if (sessionStatus === "authenticated") {
        await checkOnBoardStatus();
        toast.success(tCommon("login_successful"));
      }
    };

    runCheck();
  }, [sessionStatus, checkOnBoardStatus]);

  const inputClass = (hasError) =>
    `h-[50px] w-full rounded-[14px] border px-4 text-[15px] text-[#1a1a2e] outline-none transition placeholder:text-[#9ca3af] focus:ring-0 ${
      hasError ? "border-[#ef4444] focus:border-[#ef4444]" : "border-[#d1d5db] focus:border-[#1a1a2e]"
    }`;

  const selectClass = (hasError) =>
    `h-[50px] w-full rounded-[14px] border px-4 text-[15px] text-[#1a1a2e] outline-none transition focus:ring-0 appearance-none bg-white ${
      hasError ? "border-[#ef4444] focus:border-[#ef4444]" : "border-[#d1d5db] focus:border-[#1a1a2e]"
    }`;

  return (
    <div className="flex min-h-screen w-full items-start justify-center px-4 py-12">
      <div className="w-full max-w-[440px] sm:max-w-[560px]">
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
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                  {t("first_name_label")} <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  placeholder="Jane"
                  className={inputClass(!!errors.firstName)}
                  {...register("firstName")}
                />
                {errors.firstName && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                  {t("last_name_label")} <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  placeholder="Doe"
                  className={inputClass(!!errors.lastName)}
                  {...register("lastName")}
                />
                {errors.lastName && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                {t("email_label")} <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                id="email"
                placeholder="you@example.com"
                autoComplete="off"
                className={inputClass(!!errors.email)}
                {...register("email")}
              />
              {errors.email && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.email.message}</p>}
            </div>

            {/* Country */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                Country <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <select
                  className={selectClass(!!errors.country)}
                  {...register("country", {
                    onChange: (e) => {
                      const val = e.target.value;
                      setSelectedCountry(val);
                      setValue("country", val, { shouldValidate: true });
                      const loc = getLocationOptions().find((l) => l.name === val);
                      setSelectedLocation(loc || null);
                      if (!isBusinessAccountSupported(val)) {
                        if (selectedRole === "provider" || selectedRole === "shop-owner" || selectedRole === "restaurant") {
                          setSelectedRole("visitor");
                          setValue("role", "visitor");
                          setShowShopName(false);
                        }
                      }
                    },
                  })}
                >
                  <option value="">Select your country</option>
                  {getAllCountries().map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
              </div>
              {errors.country && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.country.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                Contact Number
              </label>
              <PhoneInput
                className="custom_phone_input"
                placeholder="Enter phone number"
                value={watch("phone") || ""}
                countryCode={selectedCountryCode}
                onChange={(e) => setValue("phone", e.target.value)}
                name="phone"
              />
              {errors.phone && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.phone.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                Account type <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <select
                  className={selectClass(!!errors.role)}
                  {...register("role", {
                    onChange: (e) => {
                      const val = e.target.value;
                      setSelectedRole(val);
                      setShowShopName(val === "shop-owner" || val === "restaurant");
                      if (val !== "shop-owner") { setSelectedServiceType(""); setValue("serviceType", ""); }
                      setValue("role", val, { shouldValidate: true });
                    },
                  })}
                  disabled={!selectedCountry}
                >
                  <option value="visitor">Basic account</option>
                  {isBusinessAccountSupported(selectedCountry) && (
                    <>
                      <option value="provider">Service Provider</option>
                      <option value="shop-owner">Shop Owner</option>
                      <option value="restaurant">Restaurant Owner</option>
                    </>
                  )}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
              </div>
              {!selectedCountry && (
                <p className="mt-1 text-[12px] text-[#9ca3af]">Select a country first to unlock business account types.</p>
              )}
              {errors.role && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.role.message}</p>}
            </div>

            {/* Business name + service type (conditional) */}
            {showShopName && (
              <>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                    {selectedRole === "shop-owner" ? "Business Name" : "Restaurant Name"} <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="text"
                    id="shopName"
                    placeholder={selectedRole === "shop-owner" ? "e.g. Acme Supplies" : "e.g. The Burger Place"}
                    className={inputClass(!!errors.shopName)}
                    {...register("shopName")}
                  />
                  {errors.shopName && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.shopName.message}</p>}
                </div>
                {selectedRole === "shop-owner" && (
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                      Service Type <span className="text-[#ef4444]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className={selectClass(!!errors.serviceType)}
                        id="serviceType"
                        {...register("serviceType", {
                          onChange: (e) => { setSelectedServiceType(e.target.value); setValue("serviceType", e.target.value, { shouldValidate: true }); },
                        })}
                      >
                        <option value="">Select service type</option>
                        <option value="shop">Retail Shop</option>
                        <option value="mot">MOT Center</option>
                        <option value="shisha">Shisha Lounge</option>
                        <option value="spa">Spa</option>
                        <option value="beauty">Beauty Salon</option>
                        <option value="healthcare">Healthcare Provider</option>
                        <option value="events">Events Provider</option>
                        <option value="entertainment">Entertainment Venue</option>
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                      </span>
                    </div>
                    {errors.serviceType && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.serviceType.message}</p>}
                  </div>
                )}
              </>
            )}

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                {t("password_label")} <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className={inputClass(!!errors.password) + " pr-12"}
                  {...register("password")}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#1a1a2e] transition">
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                {t("confirm_password_label")} <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  className={inputClass(!!errors.confirmPassword) + " pr-12"}
                  {...register("confirmPassword")}
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#1a1a2e] transition">
                  {showConfirmPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.confirmPassword.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-[#1a1a2e] text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {tCommon("loading")}
                </span>
              ) : t("submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#6b7280]">
            {t("login_prompt")}{" "}
            <Link href="/login" className="font-semibold text-[#1a1a2e] underline-offset-2 hover:underline no-underline">
              {t("login_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
