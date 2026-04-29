"use client";
import NotificationDropdown from "@/components/NotificationDropdown";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { AppContext } from "@/lib/contexts/context";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { useChatCount } from "@/lib/hooks/useChatCount";
import { getFormattedName, getNameInitials } from "@/utils/helper";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { FiMenu, FiX } from "react-icons/fi";

export default function PostLoginLayout({ children }) {
  const t = useTranslations("ProviderPages.layout");
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Use the custom auth redirect hook
  useAuthRedirect("provider");
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(null);
  
  // Chat notification count
  const { count: chatCount, hasNotifications: hasChatNotifications } = useChatCount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [showSuspendedAlert, setShowSuspendedAlert] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isEncourage, setIsEncourage] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const pathname = usePathname();

  const isActivePath = (path) => pathname.startsWith(path);


  const handleSignOut = async () => {
    localStorage.clear();
    await signOut({ redirect: false });
    
    // Redirect to default language (English) without locale prefix
    window.location.href = "/login";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };



  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error("Failed to fetch user data");
      const data = await response.json();
      setUserName(data.profile.firstName + " " + data.profile.lastName);
      
      // Set profile picture if available
      if (data.profile.profilePictureUrl) {
        setProfileImage(data.profile.profilePictureUrl);
        localStorage.setItem("userProfilePicture", data.profile.profilePictureUrl);
      }

      // Check provider account status
      if (data.profile.status) {
        setUserStatus(data.profile.status);
        
        // Show alert if account is suspended
        if (data.profile.status === 'suspended') {
          setShowSuspendedAlert(true);
        }
      }
    } catch (error) {
      toast.error(t("toast_fetch_failed"));
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status]);

  const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const res = await fetch('/api/plans');
        const data = await res.json();
        console.log('Fetched plans:', data);
        if (res.ok && data.data) {
          setPlans(data.data);
        } else {
          console.warn('Failed to fetch plans:', data);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setPlansLoading(false);
      }
    };

  // Fetch subscription plans once and keep in layout state to reuse across provider pages
  useEffect(() => {
    fetchPlans();
  }, []);

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = (event) => {
      setProfileImage(event.detail.profilePictureUrl);
    };

    // Check localStorage on mount
    const savedProfilePicture = localStorage.getItem("userProfilePicture");
    if (savedProfilePicture) {
      setProfileImage(savedProfilePicture);
    }

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);


  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/status");
      const data = await response.json();

      if (response.ok) {
        setSubscription(data.subscription);
        setIsEncourage(data.isEncourage || false);
      } else {
        console.error("Failed to fetch subscription:", data.error);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

    // Fetch subscription status on component mount and every 10 minutes
  useEffect(() => {
      fetchSubscription();
      // Set up interval to fetch subscription every 15 minutes
      const interval = setInterval(fetchSubscription, 15 * 60 * 1000);

      return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div id="app">
        <header
          id="header"
          className="header fixed-top flex items-center justify-between !px-[30px]"
        >
          {/* Left: Logo */}
          <div className="d-flex align-items-center">
            <Link href="/provider/dashboard" className="logo d-flex align-items-center">
              <img src="/assets/img/logo.png" alt="Logo" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-toggle d-lg-none d-flex align-items-center justify-content-center"
            onClick={toggleMobileMenu}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#333',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>

          {/* Desktop Navigation */}
          <nav className="header-nav d-none d-lg-block">
            <ul className="d-flex align-items-center justify-content-center mb-0 gap-4">
              <li className="nav-item">
                <Link
                  href="/provider/dashboard"
                  className={`nav-link pb-2 ${isActivePath("/provider/dashboard")
                    ? "text-primary border-bottom border-2 border-primary fw-semibold"
                    : "text-dark"
                    }`}
                >
                  <i className="bi bi-grid mr-2" />
                  {t("nav_dashboard")}
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  href="/provider/jobs"
                  className={`nav-link pb-2 ${isActivePath("/provider/jobs")
                    ? "text-primary border-bottom border-2 border-primary fw-semibold"
                    : "text-dark"
                    }`}
                >
                  <i className="bi bi-briefcase mr-2" />
                  {t("nav_jobs")}
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  href="/provider/payouts"
                  className={`nav-link pb-2 ${isActivePath("/provider/payouts")
                    ? "text-primary border-bottom border-2 border-primary fw-semibold"
                    : "text-dark"
                    }`}
                >
                  <i className="bi bi-cash-stack mr-2" />
                  {t("nav_payouts")}
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  href="/provider/chats"
                  className={`nav-link pb-2 ${isActivePath("/provider/chats")
                    ? "text-primary border-bottom border-2 border-primary fw-semibold"
                    : "text-dark"
                    }`}
                >
                  <i className="bi bi-chat-dots mr-2" />
                  Chats
                  {hasChatNotifications && (
                    <span className="badge bg-danger ms-2 rounded-pill">
                      {chatCount}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Desktop Profile Dropdown */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            <NotificationDropdown role="provider" />
            <Dropdown align="end">
              <Dropdown.Toggle
                as="a"
                className="nav-link nav-profile d-flex align-items-center p-0 border-0"
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex align-items-center justify-content-center nav-image-bg text-capitalize">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={getNameInitials(userName || "User")}
                      width={40}
                      height={40}
                      className="nav-image"
                      unoptimized
                    />
                  ) : (
                    <span className="profileText">
                      {getNameInitials(userName || "User")}
                    </span>
                  )}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-arrow profile p-0">
                <Dropdown.Header>
                  <div className="d-flex">
                    <div className="d-flex align-items-center justify-content-center nav-image-bg">
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt={getNameInitials(userName || "User")}
                          width={40}
                          height={40}
                          className="nav-image"
                          unoptimized
                        />
                      ) : (
                        <span className="profileText">
                          {getNameInitials(userName || "User")}
                        </span>
                      )}
                    </div>
                    <div className="ms-2 text-start text-capitalize flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <div>
                          <h6 className="lh-1 mb-0">
                            {getFormattedName(userName) || "User"}
                          </h6>
                          <small className="text-muted">{t("role")}</small>
                        </div>
                       
                      </div>
                      {isEncourage && (
                          <button
                            className="btn btn-sm btn-primary text-[12px] py-1 px-2 mt-2"
                            onClick={(e) => {
                              e.preventDefault();
                              closeMobileMenu();
                              router.push("/provider/pricing");
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                          >
                            {t("upgrade")}
                          </button>
                        )}
                    </div>
                  </div>
                </Dropdown.Header>

                <Dropdown.Divider />

                <Dropdown.Item as={Link} href="/provider/profile" className="flex items-center" onClick={closeMobileMenu}>
                  <i className="bi bi-person" />
                  <span>{t("menu_profile")}</span>
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/provider/change-password" className="flex items-center" onClick={closeMobileMenu}>
                  <i className="bi bi-lock" />
                  <span>{t("menu_change_password")}</span>
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/provider/settings?services=true" className="flex items-center" onClick={closeMobileMenu}>
                  <i className="bi bi-briefcase" />
                  <span>{t("menu_services")}</span>
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/provider/settings?support=true" className="flex items-center" onClick={closeMobileMenu}>
                  <i className="bi bi-question-circle" />
                  <span>{t("menu_support")}</span>
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/provider/settings?payments=true" className="flex items-center" onClick={closeMobileMenu}>
                  <i className="bi bi-credit-card" />
                  <span>{t("menu_wallet")}</span>
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/provider/pricing" className="flex items-center" onClick={closeMobileMenu}>
                  <i className="bi bi-star" />
                  <span>{t("menu_subscription_plans")}</span>
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/provider/billing-history" className="flex items-center" onClick={closeMobileMenu}>
                  <i className="bi bi-receipt" />
                  <span>{t("menu_billing_history")}</span>
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item
                  as="a"
                  style={{ cursor: "pointer" }}
                  onClick={() => { closeMobileMenu(); handleSignOut(); }}
                >
                  <i className="bi bi-box-arrow-right" />
                  <span>{t("menu_logout")}</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMobileMenu} />
        )}

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <div className="mobile-menu-content">
            {/* Mobile Menu Header with Close Button and Profile */}
            <div className="mobile-menu-header d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex gap-3 align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div onClick={closeMobileMenu}>
                  <NotificationDropdown role="provider" />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center justify-content-center nav-image-bg text-capitalize me-3">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={getNameInitials(userName || "User")}
                      width={40}
                      height={40}
                      className="nav-image"
                      unoptimized
                    />
                  ) : (
                    <span className="profileText" style={{ fontSize: '16px' }}>
                      {getNameInitials(userName || "User")}
                    </span>
                  )}
                </div>
                <div className="text-start text-capitalize mr-4">
                  <h6 className="lh-1 mb-0">
                    {getFormattedName(userName) || "User"}
                  </h6>
                  <small className="text-muted">{t("role")}</small>
                </div>
                {isEncourage && (
                          <button
                            className="btn btn-sm btn-primary text-[12px] py-1 px-2 mt-2 "
                            onClick={(e) => {
                              e.preventDefault();
                              router.push("/provider/pricing");
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                          >
                            {t("upgrade")}
                          </button>
                        )}
              </div>
              </div>
              <button
                className="mobile-menu-close-btn"
                onClick={closeMobileMenu}
              >
                <FiX />
              </button>
            </div>
            <Dropdown.Divider />
            {/* Mobile Navigation */}
            <nav className="mobile-nav">
              <ul className="list-unstyled mb-0">
                <li className="mobile-nav-item">
                  <Link
                    href="/provider/dashboard"
                    className={`mobile-nav-link ${isActivePath("/provider/dashboard") ? "active" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <i className="bi bi-grid me-3" />
                    {t("nav_dashboard")}
                  </Link>
                </li>

                <li className="mobile-nav-item">
                  <Link
                    href="/provider/jobs"
                    className={`mobile-nav-link ${isActivePath("/provider/jobs") ? "active" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <i className="bi bi-briefcase me-3" />
                    {t("nav_jobs")}
                  </Link>
                </li>

                <li className="mobile-nav-item">
                  <Link
                    href="/provider/payouts"
                    className={`mobile-nav-link ${isActivePath("/provider/payouts") ? "active" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <i className="bi bi-cash-stack me-3" />
                    {t("nav_payouts")}
                  </Link>
                </li>

                <li className="mobile-nav-item">
                  <Link
                    href="/provider/chats"
                    className={`mobile-nav-link ${isActivePath("/provider/chats") ? "active" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <i className="bi bi-chat-dots me-3" />
                    Chats
                    {hasChatNotifications && (
                      <span className="badge bg-danger ms-2 rounded-pill">
                        {chatCount}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Mobile Profile Menu */}
            <div className="mobile-profile-menu">
              {/* <div className="mobile-menu-divider"></div> */}
              <Link
                href="/provider/profile"
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-person me-3" />
                {t("menu_profile")}
              </Link>

              <Link
                href="/provider/change-password"
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-lock me-3" />
                {t("menu_change_password")}
              </Link>

              <Link
                href="/provider/settings?services=true"
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-briefcase me-3" />
                {t("menu_services")}
              </Link>

              <Link
                href="/provider/settings?support=true"
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-question-circle me-3" />
                {t("menu_support")}
              </Link>

              <Link
                href="/provider/settings?payments=true"
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-credit-card me-3" />
                {t("menu_payments")}
              </Link>

              <Link
                href="/provider/pricing"
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-star me-3" />
                {t("menu_subscription_plans")}
              </Link>

              <Link
                href="/provider/billing-history"
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-receipt me-3" />
                {t("menu_billing_history")}
              </Link>

              <div className="mobile-menu-divider"></div>

              <button
                className="mobile-menu-item mobile-logout-btn"
                onClick={() => {
                  closeMobileMenu();
                  handleSignOut();
                }}
              >
                <i className="bi bi-box-arrow-right me-3" />
                {t("menu_logout")}
              </button>
            </div>
          </div>
        </div>


      <main id="main" className="main !ml-0">
        {/* Suspended Account Alert */}
        {showSuspendedAlert && userStatus === 'suspended' && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-octagon me-2"></i>
            <strong>Your account has been suspended.</strong> You cannot accept new jobs or access certain features. Please contact administrator for assistance.
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowSuspendedAlert(false)}
              aria-label="Close"
            ></button>
          </div>
        )}

        <AppContext.Provider value={{ setProfileImage, setUserName, plans, plansLoading , fetchPlans , subscription , fetchSubscription , setSubscription}}>
          {children}
        </AppContext.Provider>
      </main>

        <footer id="footer" className="footer">
          <div className="copyright">
            © 2025 Swipped <strong></strong>. All Rights Reserved.
          </div>
        </footer>
      </div>


    </>
  );
}

