"use client";
import React, { useEffect, useState, useRef } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOut, useSession } from "next-auth/react";
import { Dropdown } from "react-bootstrap";
import Image from "next/image";
import { AppContext } from "@/lib/contexts/context";
import toast from "react-hot-toast";
import { getFormattedName, getNameInitials } from "@/utils/helper";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslations } from "next-intl";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { useVerificationCount } from "@/lib/hooks/useVerificationCount";
import { useChatCount } from "@/lib/hooks/useChatCount";
import NotificationDropdown from "@/components/NotificationDropdown";

export default function PostLoginLayout({ children }) {
  const t = useTranslations("AdminPages.layout");
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const isAffiliateAccount = userRole === "affiliate";
  const canManageAffiliateSettings = userRole === "admin" || userRole === "team-member";
  // Use the custom auth redirect hook
  useAuthRedirect(userRole);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(null);
  
  const { count: verificationCount, hasNotifications } = useVerificationCount();
  const { count: chatCount, hasNotifications: hasChatNotifications } = useChatCount();
  const pathname = usePathname()
  const isActivePath = (path) => {
    return pathname.startsWith(path)
  }

  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  const closeSidebarOnMobile = () => {
    if (isMobile()) {
      document.body.classList.remove("toggle-sidebar");
    }
  };

  const handleSignOut = async () => {
    localStorage.clear();
    await signOut({ redirect: false });
    
    // Redirect to default language (English) without locale prefix
    window.location.href = "/login";
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
    } catch (error) {
      toast.error("Failed to fetch user data");
    }
  };

  useEffect(() => {
    fetchUserData()
  }, [])

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        document.body.classList.remove("toggle-sidebar");
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('sidebar');
      const toggleBtn = document.querySelector('.toggle-sidebar-btn');
      
      if (isMobile() && 
          sidebar && 
          !sidebar.contains(event.target) && 
          !toggleBtn.contains(event.target) &&
          document.body.classList.contains('toggle-sidebar')) {
        document.body.classList.remove("toggle-sidebar");
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div id="app">
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        <div className="d-flex align-items-center justify-content-between">
          <Link href="/admin-dashboard" className="logo d-flex align-items-center">
            <img src="/assets/img/logo.png" alt="Logo" />
          </Link>
          <i
            className="bi bi-list toggle-sidebar-btn"
            onClick={() => document.body.classList.toggle("toggle-sidebar")}
            style={{ cursor: "pointer" }}
          />
        </div>
        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            <li className="nav-item me-3">
              <NotificationDropdown role={userRole || "admin"} />
            </li>
            <li className="nav-item dropdown me-3">
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
                    <div className="d-flex align-items-center ">
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
                      <div className="ms-2 text-start d-flex flex-column justify-content-center text-capitalize">
                        <h6 className="lh-1 mb-0">
                          {getFormattedName(userName) || "User"}
                        </h6>
                        <small className="text-muted">
                          {userRole === "affiliate" ? "Affiliate" : userRole === "admin" ? "Admin" : "Team Member"}
                        </small>
                      </div>
                    </div>
                  </Dropdown.Header>

                  <Dropdown.Divider />
                  <Dropdown.Item
                    as={Link}
                    href="/profile"
                    className="d-flex align-items-center"
                    onClick={closeSidebarOnMobile}
                  >
                    <i className="bi bi-person" />
                    <span>{t("menu_profile")}</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/change-password"
                    className="d-flex align-items-center"
                    onClick={closeSidebarOnMobile}
                  >
                    <i className="bi bi-bag" />
                    <span>{t("menu_change_password")}</span>
                  </Dropdown.Item>
                  {isAffiliateAccount && (
                    <Dropdown.Item
                      as={Link}
                      href="/wallet"
                      className="d-flex align-items-center"
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="bi bi-credit-card" />
                      <span>Wallet Management</span>
                    </Dropdown.Item>
                  )}

                  <Dropdown.Divider />

                  <Dropdown.Item
                    as="a"
                    className="d-flex align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={handleSignOut}
                  >
                    <i className="bi bi-box-arrow-right" />
                    <span>{t("menu_logout")}</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </li>
          </ul>
        </nav>
      </header>
      <aside id="sidebar" className="sidebar d-flex flex-column">
        <div className="sidebar-content flex-grow-1">
          <ul className="sidebar-nav" id="sidebar-nav">
            <li className="nav-item">
              <Link 
                href="/admin-dashboard" 
                className={`nav-link ${isActivePath('/admin-dashboard') ? 'active' : 'collapsed'}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="bi bi-grid" />
                <span>{isAffiliateAccount ? "Dashboard" : t("nav_dashboard")}</span>
              </Link>
            </li>

            {!isAffiliateAccount && (
              <li className="nav-item">
                <Link 
                  href="/jobs" 
                  className={`nav-link ${isActivePath('/jobs') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-briefcase" />
                  <span>{t("nav_jobs")}</span>
                </Link>
              </li>
            )}

            {!isAffiliateAccount && (
              <li className="nav-item">
                <Link 
                  href="/services" 
                  className={`nav-link ${isActivePath('/services') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-tools" />
                  <span>Services</span>
                </Link>
              </li>
            )}

            {(isAffiliateAccount || userRole === "admin" || userRole === "team-member") && (
              <li className="nav-item">
                <Link 
                  href="/users" 
                  className={`nav-link ${isActivePath('/users') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-people" />
                  <span>Users</span>
                </Link>
              </li>
            )}
          {(userRole === "admin" || userRole === "affiliate") && !isAffiliateAccount && (
            <li className="nav-item">
              <Link 
                href="/team-members" 
                className={`nav-link ${isActivePath('/team-members') ? 'active' : 'collapsed'}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="bi bi-people-fill" />
                <span>Team Members</span>
              </Link>
            </li>
            )}
            {!isAffiliateAccount && (
              <li className="nav-item">
                <Link 
                  href="/verifications" 
                  className={`nav-link ${isActivePath('/verifications') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-check2-square" />
                  <span>{t("nav_verifications")}</span>
                  {hasNotifications && (
                    <span className="badge bg-danger ms-2 rounded-pill">
                      {verificationCount}
                    </span>
                  )}
                </Link>
              </li>
            )}

            {(isAffiliateAccount || canManageAffiliateSettings) && (
              <li className="nav-item">
                <Link
                  href="/affiliate-businesses"
                  className={`nav-link ${isActivePath('/affiliate-businesses') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-shop-window" />
                  <span>{isAffiliateAccount ? "Businesses" : "Affiliate Businesses"}</span>
                </Link>
              </li>
            )}

            <li className="nav-item">
              <Link 
                href="/payouts" 
                className={`nav-link ${isActivePath('/payouts') ? 'active' : 'collapsed'}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="bi bi-cash-stack" />
                <span>{t("nav_payouts")}</span>
              </Link>
            </li>

            {!isAffiliateAccount && (
              <li className="nav-item">
                <Link 
                  href="/transactions" 
                  className={`nav-link ${isActivePath('/transactions') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-receipt" />
                  <span>Transactions</span>
                </Link>
              </li>
            )}

            {!isAffiliateAccount && (
              <li className="nav-item">
                <Link 
                  href="/admin-chats" 
                  className={`nav-link ${isActivePath('/admin-chats') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-chat-dots" />
                  <span>Chats</span>
                  {hasChatNotifications && (
                    <span className="badge bg-danger ms-2 rounded-pill">
                      {chatCount}
                    </span>
                  )}
                </Link>
              </li>
            )}

            {canManageAffiliateSettings && (
              <li className="nav-item">
                <Link 
                  href="/affiliate-settings" 
                  className={`nav-link ${isActivePath('/affiliate-settings') ? 'active' : 'collapsed'}`}
                  onClick={closeSidebarOnMobile}
                >
                  <i className="bi bi-percent" />
                  <span>Affiliate Settings</span>
                </Link>
              </li>
            )}

            {userRole !== "affiliate" && (
              <>
                <li className="nav-item">
                  <Link
                    href="/reports"
                    className={`nav-link ${isActivePath('/reports') ? 'active' : 'collapsed'}`}
                    onClick={closeSidebarOnMobile}
                  >
                    <i className="bi bi-exclamation-triangle" />
                    <span>Issue Reports</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/products"
                    className={`nav-link ${isActivePath('/products') ? 'active' : 'collapsed'}`}
                    onClick={closeSidebarOnMobile}
                  >
                    <i className="bi bi-box" />
                    <span>Products</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/orders"
                    className={`nav-link ${isActivePath('/orders') ? 'active' : 'collapsed'}`}
                    onClick={closeSidebarOnMobile}
                  >
                    <i className="bi bi-cart-check" />
                    <span>Orders</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link href="/shop-owners" className={`nav-link ${isActivePath('/shop-owners') ? 'active' : 'collapsed'}`}>
                    <i className="bi bi-shop" />
                    <span>Shops/ Restaurants</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/categories"
                    className={`nav-link ${isActivePath('/categories') ? 'active' : 'collapsed'}`}
                    onClick={closeSidebarOnMobile}
                  >
                    <i className="bi bi-tags" />
                    <span>Categories</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/luggage-items"
                    className={`nav-link ${isActivePath('/luggage-items') ? 'active' : 'collapsed'}`}
                    onClick={closeSidebarOnMobile}
                  >
                    <i className="bi bi-bag" />
                    <span>Luggage</span>
                  </Link>
                </li>
              </>
            )}
          </ul>

        </div>
      </aside>

      <main id="main" className="main">
        <AppContext.Provider
          value={{
            setProfileImage,
            setUserName
          }}
        >
          {children}
        </AppContext.Provider>
      </main>
      <footer id="footer" className="footer">
        <div className="copyright">
          © 2025 Swipped
          <strong>
            <span />
          </strong>
          . All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
