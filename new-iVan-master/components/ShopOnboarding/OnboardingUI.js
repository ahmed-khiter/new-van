"use client";
import { useState, useEffect } from "react";
import s from "./onboarding.module.css";

// ─── Constants ──────────────────────────────────────────────────────────────

export const STEPS = [
  { id: "businessInfo",   label: "Business" },
  { id: "openingHours",   label: "Hours" },
  { id: "paymentDetails", label: "Payments" },
  { id: "firstProduct",   label: "Product" },
];

export const ALL_DAYS = [
  { key: "monday",    label: "Monday",    short: "M" },
  { key: "tuesday",   label: "Tuesday",   short: "T" },
  { key: "wednesday", label: "Wednesday", short: "W" },
  { key: "thursday",  label: "Thursday",  short: "T" },
  { key: "friday",    label: "Friday",    short: "F" },
  { key: "saturday",  label: "Saturday",  short: "S" },
  { key: "sunday",    label: "Sunday",    short: "S" },
];

export const TITLES = [
  { h: "Let\u2019s set up your shop",       sub: "A few details and you\u2019ll be ready to go." },
  { h: "When are you open?",                sub: "Help customers know the best time to order." },
  { h: "How do you want to get paid?",      sub: "Connect a payout method \u2014 takes under a minute." },
  { h: "Show off your first product",       sub: "Give customers something to browse. You can add more anytime." },
];

export const DEFAULT_WEEKDAY_HOURS = [
  { key: "monday",    label: "Monday",    open: "09:00", close: "17:00" },
  { key: "tuesday",   label: "Tuesday",   open: "09:00", close: "17:00" },
  { key: "wednesday", label: "Wednesday", open: "09:00", close: "17:00" },
  { key: "thursday",  label: "Thursday",  open: "09:00", close: "17:00" },
  { key: "friday",    label: "Friday",    open: "09:00", close: "17:00" },
];

// ─── Icons ──────────────────────────────────────────────────────────────────

export const STEP_ICONS = [
  (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
  (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
];

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

export const BackArrow = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
);

export const PlusIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
);

export const CloseIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
);

export const ShieldIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

export const CameraIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);

export const SmallPlusIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
);

export const ClockIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#ccc" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
);

export const SuccessCheckIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#00403f" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export const CardPaymentIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
);

export const PRODUCT_CHECKLIST_ITEMS = [
  { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>, text: "Upload a product photo" },
  { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>, text: "Write a short description" },
  { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, text: "Set your price" },
  { icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, text: "Choose a category" },
];

// ─── Shared components ──────────────────────────────────────────────────────

export function Spinner() {
  return <span className={s.spinner} />;
}

export function StepSkeleton() {
  return (
    <div className={s.skeleton}>
      <div className={`${s.skelLine} ${s.skelW60}`} />
      <div className={`${s.skelLine} ${s.skelFull}`} />
      <div className={`${s.skelLine} ${s.skelFull}`} />
      <div className={`${s.skelLine} ${s.skelW40}`} />
    </div>
  );
}

export function SlideIn({ children, stepKey }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    setVis(false);
    const f = requestAnimationFrame(() => setVis(true));
    return () => cancelAnimationFrame(f);
  }, [stepKey]);
  return <div className={`${s.slide} ${vis ? s.slideIn : ""}`}>{children}</div>;
}

export function ProgressBar({ current, total }) {
  return (
    <div className={s.progTrack}>
      <div className={s.progFill} style={{ width: `${((current + 1) / total) * 100}%` }} />
    </div>
  );
}

export function StepIndicator({ steps, current, completed, onStepClick }) {
  return (
    <div className={s.steps}>
      {steps.map((step, idx) => {
        const done = completed[step.id] || idx < current;
        const active = idx === current;
        const clickable = idx <= current || completed[step.id];
        const dotCls = [
          s.siDot,
          active && s.siDotActive,
          done && !active && s.siDotDone,
          clickable && s.siDotClickable,
        ].filter(Boolean).join(" ");
        const labelCls = [
          s.siLabel,
          active && s.siLabelActive,
          done && s.siLabelDone,
        ].filter(Boolean).join(" ");

        const dotContent = done && !active
          ? <CheckIcon />
          : active
            ? STEP_ICONS[idx]("#fff")
            : <span className={s.siNum}>{idx + 1}</span>;

        return (
          <div key={step.id} className={s.siItem}>
            {idx > 0 && <div className={`${s.siLine} ${done ? s.siLineDone : ""}`} />}
            <div className={s.siCol}>
              <button type="button" onClick={() => clickable && onStepClick(idx)} className={dotCls}>
                {dotContent}
              </button>
              <span className={labelCls}>{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Field({ label, required, children }) {
  return (
    <div className={s.field}>
      <label className={s.label}>{label}{required && <span className={s.req}>*</span>}</label>
      {children}
    </div>
  );
}

export function StepHeader({ step }) {
  return (
    <div className={s.header}>
      <h1 className={s.h1}>{TITLES[step].h}</h1>
      <p className={s.sub}>{TITLES[step].sub}</p>
    </div>
  );
}

export function Confetti() {
  return (
    <div className={s.confetti}>
      {[...Array(8)].map((_, i) => <div key={i} className={`${s.cf} ${s[`cf${i}`]}`} />)}
    </div>
  );
}

export { s };
