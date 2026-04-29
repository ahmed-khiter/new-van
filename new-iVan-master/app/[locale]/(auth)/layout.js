"use client";
import { LOCALES, LOCALE_NAMES } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LOCALE_FLAGS } from "@/utils/localeFlags";

export default function PreLoginLayout({ children }) {
  const locale = useLocale();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);



  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showLanguageDropdown && !event.target.closest('.language-selector')) {
        setShowLanguageDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  const handleLanguageChange = (newLocale) => {
    setShowLanguageDropdown(false);

    // Get the current URL path
    const currentPath = window.location.pathname;
    let newPath;

    // Create a regex pattern for all non-default locales
    const nonDefaultLocales = LOCALES.filter(locale => locale !== 'en');
    const localePattern = nonDefaultLocales.join('|');
    const localeRegex = new RegExp(`^/(${localePattern})(/|$)`);

    // Handle URL construction based on locale prefix configuration
    if (newLocale === 'en') {
      // English is default locale, remove any locale prefix
      if (localeRegex.test(currentPath)) {
        newPath = currentPath.replace(localeRegex, '/');
        // Handle case where we end up with just a slash
        if (newPath === '/') {
          newPath = '/';
        }
      } else {
        newPath = currentPath;
      }
    } else {
      // For non-default locales
      if (localeRegex.test(currentPath)) {
        // Replace existing locale with new one
        newPath = currentPath.replace(localeRegex, `/${newLocale}$2`);
      } else {
        // Add locale prefix to path
        newPath = `/${newLocale}${currentPath}`;
      }
    }

    // Navigate to the new URL
    window.location.href = newPath;
  };

  // Removed automatic redirects - let users choose where to go

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Subtle glow — matches homepage hero palette */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: "80vw", height: "55vh", background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,200,180,0.22) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "10%", left: "-10%", width: "50vw", height: "50vh", background: "radial-gradient(ellipse 70% 60% at 20% 40%, rgba(255,180,200,0.13) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: "5%", right: "-5%", width: "45vw", height: "45vh", background: "radial-gradient(ellipse 60% 55% at 80% 30%, rgba(200,180,255,0.11) 0%, transparent 60%)" }} />
      </div>
      {/* Minimal language switcher — top right only */}
      <div className="language-selector absolute right-4 top-4 z-20">
        <button
          type="button"
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#6b7280] transition hover:bg-[#f5f5f3]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </button>
        {showLanguageDropdown && (
          <div className="absolute right-0 top-full mt-2 w-[180px] rounded-xl border border-[#e5e5e5] bg-white py-1 shadow-lg">
            {LOCALES.map((langLocale) => (
              <button
                key={langLocale}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-[#f5f5f3] ${
                  langLocale === locale ? "font-semibold text-[#1a1a2e]" : "text-[#6b7280]"
                }`}
                onClick={() => handleLanguageChange(langLocale)}
              >
                <span>{LOCALE_FLAGS[langLocale] || "🌐"}</span>
                <span>{LOCALE_NAMES[langLocale]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
