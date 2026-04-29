"use client";
import React, { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOut, useSession } from "next-auth/react";
import { Dropdown } from "react-bootstrap";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { AppContext } from "@/lib/contexts/context";
import NotificationDropdown from "@/components/NotificationDropdown";

export default function RestaurantLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [restaurantStatus, setRestaurantStatus] = useState(null);
  const [showInactiveAlert, setShowInactiveAlert] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantImage, setRestaurantImage] = useState(null);
  
  
  // Use the custom auth redirect hook
  useAuthRedirect("restaurant");

  const isActivePath = (path) => pathname.startsWith(path);


  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        setUserName(`${data?.profile?.firstName || ""} ${data?.profile?.lastName || ""}`.trim());

        // Check restaurant status for restaurant owners
        if (data.shop || data.restaurant) {
          const shopData = data.shop || data.restaurant;
          setRestaurantStatus(shopData.status);
          setRestaurantName(shopData.name || "");
          setRestaurantImage(shopData.imageUrl || null);
          
          // Show alert if restaurant is inactive
          if (shopData.status === 'inactive') {
            setShowInactiveAlert(true);
          }
        }
      } catch (e) {
        toast.error("Failed to load profile");
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <div id="app">
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        <div className="d-flex align-items-center justify-content-between">
          <Link
            href="/restaurant/dashboard"
            className="logo d-flex align-items-center"
          >
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
              <NotificationDropdown role="restaurant" />
            </li>
            <li className="nav-item dropdown me-3">
              <Dropdown align="end">
                <Dropdown.Toggle
                  as="a"
                  className="nav-link nav-profile d-flex align-items-center p-0 border-0"
                  style={{ cursor: "pointer" }}
                >
                  {restaurantImage ? (
                    <Image
                      src={restaurantImage}
                      alt={restaurantName || "Restaurant"}
                      width={40}
                      height={40}
                      className="rounded-3"
                      style={{
                        width: "38px",
                        height: "38px",
                        objectFit: "cover",
                        display: "block",
                      }}
                      unoptimized
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center nav-image-bg text-capitalize"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <span className="profileText">
                        {(restaurantName || "R").substring(0, 1)}
                      </span>
                    </div>
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-arrow profile p-0">
                  <Dropdown.Header>
                    <div className="d-flex align-items-center">
                      {restaurantImage ? (
                        <Image
                          src={restaurantImage}
                          alt={restaurantName || "Restaurant"}
                          width={40}
                          height={40}
                          className="rounded-3 me-2"
                          style={{
                            width: "38px",
                            height: "38px",
                            objectFit: "cover",
                            display: "block",
                          }}
                          unoptimized
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center nav-image-bg me-2"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <span className="profileText">
                            {(restaurantName || "R").substring(0, 1)}
                          </span>
                        </div>
                      )}
                      <div className="text-start d-flex flex-column justify-content-center text-capitalize">
                        <h6 className="lh-1 mb-0">
                          {restaurantName || "Restaurant"}
                        </h6>
                        <small className="text-muted">Restaurant Owner</small>
                      </div>
                    </div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    as={Link}
                    href="/restaurant/details"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-shop" />
                    <span>Restaurant Details</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/restaurant/change-password"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-key" />
                    <span>Change Password</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/restaurant/wallet"
                    className="flex items-center"
                  >
                    <i className="bi bi-credit-card" />
                    <span>Wallet Management</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/restaurant/support"
                    className="flex items-center"
                  >
                    <i className="bi bi-question-circle" />
                    <span>Support</span>
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
            <li className="nav-item">
              <Link
                href="/restaurant/dashboard"
                className={`nav-link ${
                  isActivePath("/restaurant/dashboard") ? "active" : "collapsed"
                }`}
              >
                <i className="bi bi-grid" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/restaurant/menu-items"
                className={`nav-link ${
                  isActivePath("/restaurant/menu-items")
                    ? "active"
                    : "collapsed"
                }`}
              >
                <i className="bi bi-menu-button-wide" />
                <span>Menu Items</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/restaurant/orders"
                className={`nav-link ${
                  isActivePath("/restaurant/orders") ? "active" : "collapsed"
                }`}
              >
                <i className="bi bi-cart-check" />
                <span>Orders</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/restaurant/reservations"
                className={`nav-link ${
                  isActivePath("/restaurant/reservations")
                    ? "active"
                    : "collapsed"
                }`}
              >
                <i className="bi bi-calendar-check" />
                <span>Reservations</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/restaurant/payouts"
                className={`nav-link ${
                  isActivePath("/restaurant/payouts") ? "active" : "collapsed"
                }`}
              >
                <i className="bi bi-cash-stack" />
                <span>Payouts</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/restaurant/support"
                className={`nav-link ${
                  isActivePath("/restaurant/support") ? "active" : "collapsed"
                }`}
              >
                <i className="bi bi-question-circle" />
                <span>Support</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      <main id="main" className="main">
        {/* Inactive Restaurant Alert */}
        {showInactiveAlert && restaurantStatus === "inactive" && (
          <div
            className="alert alert-warning alert-dismissible fade show"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Your restaurant is currently inactive.</strong> Your
            restaurant and menu items are not visible to customers. Please
            contact the administrator to activate your restaurant.
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowInactiveAlert(false)}
              aria-label="Close"
            ></button>
          </div>
        )}

        <AppContext.Provider
          value={{
            setUserName,
          }}
        >
          {children}
        </AppContext.Provider>
      </main>
      <footer id="footer" className="footer">
        <div className="copyright">© 2025 Swipped</div>
      </footer>
    </div>
  );
}

