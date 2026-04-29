"use client";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { AppContext } from "@/lib/contexts/context";
import { getFormattedName, getNameInitials } from "@/utils/helper";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { useFeedback } from "@/lib/hooks/useFeedback";
import { useChatCount } from "@/lib/hooks/useChatCount";
import NotificationDropdown from "@/components/NotificationDropdown";
import FeedbackModal from "@/components/Modals/FeedbackModal";

export default function VisitorLayout({ children }) {
  const t = useTranslations("VisitorPages.layout");
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Use the custom auth redirect hook
  useAuthRedirect("visitor");
  
  // Feedback system
  const {
    currentFeedback,
    showFeedbackModal,
    isLoading: feedbackLoading,
    hasMoreFeedbacks,
    totalCount: feedbackTotalCount,
    handleFeedbackSubmitted,
    closeFeedbackModal,
    fetchNextPendingFeedback
  } = useFeedback();
  
  // Chat notification count
  const { count: chatCount, hasNotifications: hasChatNotifications } = useChatCount();
  
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(null);
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
          <Link href="/" className="logo d-flex align-items-center">
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
              <NotificationDropdown role="visitor" />
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
                        <small className="text-muted">{t("role")}</small>
                      </div>
                    </div>
                  </Dropdown.Header>

                  <Dropdown.Divider />
                  <Dropdown.Item
                    as={Link}
                    href="/customer/profile"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-person" />
                    <span>Profile</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/customer/change-password"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-lock" />
                    <span>Change Password</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/customer/wallet"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-credit-card" />
                    <span>{t("menu_wallet")}</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/customer/support"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-question-circle" />
                    <span>{t("menu_support")}</span>
                  </Dropdown.Item>
                  <Dropdown.Divider />

                  <Dropdown.Item
                    as="a"
                    className="d-flex align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={handleSignOut}
                  >
                    <i className="bi bi-box-arrow-right" />
                    <span>Logout</span>
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
            {/* <li className="nav-item">
              <Link 
                href="/customer/dashboard" 
                className={`nav-link ${isActivePath('/customer/dashboard') ? 'active' : 'collapsed'}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="bi bi-grid" />
                <span>Dashboard</span>
              </Link>
            </li> */}

            <li className="nav-item">
              <Link 
                href="/customer/jobs" 
                className={`nav-link ${isActivePath('/customer/jobs') ? 'active' : 'collapsed'}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="bi bi-briefcase" />
                <span>My Activity</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                href="/customer/transactions" 
                className={`nav-link ${isActivePath('/customer/transactions') ? 'active' : 'collapsed'}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="bi bi-credit-card" />
                <span>Transactions</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                href="/customer/chats" 
                className={`nav-link ${isActivePath('/customer/chats') ? 'active' : 'collapsed'}`}
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
      
      {/* Feedback Modal */}
      <FeedbackModal
        feedback={currentFeedback}
        isOpen={showFeedbackModal}
        onClose={closeFeedbackModal}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}

