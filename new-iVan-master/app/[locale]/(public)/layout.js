"use client";
import { useSession, signOut } from "next-auth/react";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { LOCALES, LOCALE_NAMES } from "@/i18n/routing";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/lib/contexts/CartContext";
import toast from "react-hot-toast";
import NotificationDropdown from "@/components/NotificationDropdown";
import { LOCALE_FLAGS } from "@/utils/localeFlags";
import { LocationModalContext } from "./location-modal-context";

export default function PublicLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const t = useTranslations("PublicPages.layout");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const { cartCount } = useCart();

  useEffect(() => {
    function handleClickOutside(event) {
      if (showLanguageDropdown && !event.target.closest('.language-selector')) {
        setShowLanguageDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageDropdown]);

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.role && session.user.role !== 'visitor') {
      let dashboardPath;
      if (session.user.role === 'super-admin' || session.user.role === 'affiliate' || session.user.role === 'team-member') {
        dashboardPath = '/admin-dashboard';
      } else {
        dashboardPath = '/customer/dashboard';
      }
      router.replace(dashboardPath);
    }
  }, [session, status, router]);

  const handleLanguageChange = (newLocale) => {
    setShowLanguageDropdown(false);
    const currentPath = window.location.pathname;
    let newPath;
    const nonDefaultLocales = LOCALES.filter(l => l !== 'en');
    const localePattern = nonDefaultLocales.join('|');
    const localeRegex = new RegExp(`^/(${localePattern})(/|$)`);

    if (newLocale === 'en') {
      newPath = localeRegex.test(currentPath) ? currentPath.replace(localeRegex, '/') : currentPath;
      if (newPath === '') newPath = '/';
    } else {
      newPath = localeRegex.test(currentPath)
        ? currentPath.replace(localeRegex, `/${newLocale}$2`)
        : `/${newLocale}${currentPath}`;
    }
    window.location.href = newPath;
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const locationModalOpenerRef = useRef(null);

  useEffect(() => {
    function handleClickOutsideProfile(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideProfile);
    return () => document.removeEventListener("mousedown", handleClickOutsideProfile);
  }, []);

  const hideFooter =
    pathname.includes('/mini-apps/virtual-world') ||
    pathname.includes('/reservations') ||
    pathname.includes('/swipped-connect') ||
    pathname.includes('/mini-apps/digital-land-exchange') ||
    pathname.includes('/invest') ||
    pathname.includes('/swipped-rides') ||
    pathname.includes('/purchase') ||
    pathname.includes('/preview/checkout');

  const isShopsListPage = pathname === "/shops";
  const isRestaurantsListPage = pathname === "/restaurants";
  const headerTransparent = isShopsListPage || isRestaurantsListPage;

  const iconBtnClass = (transparent) => `flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${
    transparent
      ? "border-white/25 text-white hover:bg-white/10"
      : "border-[#e5e5e5] text-[#1a1a2e] hover:bg-[#f5f5f3]"
  }`;

  return (
    <LocationModalContext.Provider value={{
      open: () => locationModalOpenerRef.current?.(),
      registerOpener: (fn) => { locationModalOpenerRef.current = fn; },
    }}>
      <header
        className={`w-full z-50 transition-colors duration-300 ${
          headerTransparent ? "absolute top-0 left-0 right-0" : "relative"
        }`}
      >
        <div className="container">
          <nav className="flex items-center justify-between h-[56px] sm:h-[64px] md:h-[72px]">
            <Link href="/" className="shrink-0 no-underline">
              <span className={`text-[20px] sm:text-[22px] md:text-[24px] font-black uppercase italic tracking-[-0.05em] ${headerTransparent ? "text-white" : "text-[#1a1a2e]"}`}>
                swipped.
              </span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-1.5">
              {session?.user?.role === "visitor" && (
                <button
                  type="button"
                  onClick={() => {
                    if (cartCount === 0) {
                      toast.error("Your cart is empty. Add a product to continue to checkout.");
                    } else {
                      router.push("/purchase");
                    }
                  }}
                  className={`relative ${iconBtnClass(headerTransparent)}`}
                >
                  <FaShoppingCart className="text-[14px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] font-bold flex items-center justify-center text-white rounded-full bg-[#ff385c]">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {session?.user?.role && (
                <NotificationDropdown
                  role={session.user.role}
                  className={headerTransparent ? "text-white" : "text_orange"}
                />
              )}

              {/* Location */}
              {(isShopsListPage || isRestaurantsListPage) && (
                <button
                  type="button"
                  onClick={() => locationModalOpenerRef.current?.()}
                  className={iconBtnClass(headerTransparent)}
                  title="Change location"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </button>
              )}

              {/* Language */}
              <div className="language-selector relative">
                <button
                  className={iconBtnClass(headerTransparent)}
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </button>
                {showLanguageDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-[180px] rounded-xl bg-white border border-[#e5e5e5] shadow-lg py-1 z-50">
                    {LOCALES.map((langLocale) => (
                      <button
                        key={langLocale}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors hover:bg-[#f5f5f3] ${
                          langLocale === locale ? "font-semibold text-[#1a1a2e]" : "text-[#6b7280]"
                        }`}
                        onClick={() => handleLanguageChange(langLocale)}
                      >
                        <span className="text-base">{LOCALE_FLAGS[langLocale] || '🌐'}</span>
                        <span>{LOCALE_NAMES[langLocale]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile / Account */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={iconBtnClass(headerTransparent)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[200px] rounded-xl bg-white border border-[#e5e5e5] shadow-lg py-1 z-50">
                    {session ? (
                      <>
                        <div className="px-4 py-3 border-b border-[#f0f0ee]">
                          <p className="text-sm font-semibold text-[#1a1a2e] mb-0 truncate">{session.user?.name}</p>
                          <p className="text-xs text-[#9ca3af] mb-0 truncate">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/customer/jobs"
                          className="block px-4 py-2.5 text-sm text-[#1a1a2e] hover:bg-[#f5f5f3] transition-colors no-underline"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Dashboard
                        </Link>
                        <div className="border-t border-[#f0f0ee] mt-1 pt-1">
                          <button
                            type="button"
                            onClick={() => { setShowProfileMenu(false); signOut({ callbackUrl: "/" }); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#e53a3a] hover:bg-[#fff5f5] transition-colors"
                          >
                            Log out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2.5 text-sm text-[#1a1a2e] hover:bg-[#f5f5f3] transition-colors no-underline"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          {t("login")}
                        </Link>
                        <Link
                          href="/register"
                          className="block px-4 py-2.5 text-sm text-[#1a1a2e] hover:bg-[#f5f5f3] transition-colors no-underline"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          {t("signup")}
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>
      {children}
      {!hideFooter && (
      <footer className="bg-[#0a0a0a]">
        <div className="container">
          {/* Brand row */}
          <div className="border-b border-white/[0.06] py-8 text-center">
            <p className="mb-1 text-[clamp(2rem,5vw,3.2rem)] font-black uppercase italic leading-none tracking-[-0.05em] text-white">
              swipped.
            </p>
            <p className="mb-4 text-[13px] text-white/35">
              Order, book, connect &amp; earn — all from one platform.
            </p>
            <div className="flex items-center justify-center gap-2">
              <a href="#" className="block transition hover:opacity-75">
                <img src="/assets/img/appstore.png" alt="App Store" className="h-[30px] w-auto rounded-md" />
              </a>
              <a href="#" className="block transition hover:opacity-75">
                <img src="/assets/img/googleplay.png" alt="Google Play" className="h-[30px] w-auto rounded-md" />
              </a>
            </div>
          </div>

          {/* Links row */}
          <div className="grid grid-cols-3 gap-6 py-8 text-[13px] sm:gap-10">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">Explore</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li><a href="/" className="text-white/45 no-underline transition hover:text-white">{t("nav_home")}</a></li>
                <li><Link href="/shops" className="text-white/45 no-underline transition hover:text-white">{t("nav_shop")}</Link></li>
                <li><Link href="/restaurants" className="text-white/45 no-underline transition hover:text-white">{t("nav_order_food")}</Link></li>
                <li><Link href="/" className="text-white/45 no-underline transition hover:text-white">{t("nav_services")}</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">Company</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li><Link href="/about" className="text-white/45 no-underline transition hover:text-white">{t("nav_about")}</Link></li>
                <li><Link href="/partner-with-us" className="text-white/45 no-underline transition hover:text-white">{t("nav_partner")}</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">Legal</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li><Link href="/terms" className="text-white/45 no-underline transition hover:text-white">{t("footer_terms")}</Link></li>
                <li><Link href="/privacy-policy" className="text-white/45 no-underline transition hover:text-white">{t("footer_privacy")}</Link></li>
                <li><a href="#" className="text-white/45 no-underline transition hover:text-white">{t("footer_cookies")}</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/[0.06] py-4">
            <p className="mb-0 text-center text-[11px] text-white/25">
              {t("footer_copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
      )}
    </LocationModalContext.Provider>
  );
}
