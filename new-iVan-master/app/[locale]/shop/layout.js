"use client";
import React, { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOut, useSession } from "next-auth/react";
import { Dropdown } from "react-bootstrap";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { AppContext } from "@/lib/contexts/context";
import { useTranslations } from "next-intl";
import NotificationDropdown from "@/components/NotificationDropdown";
import { getServiceConfig } from "@/utils/serviceConfig";

export default function ShopOwnerLayout({ children }) {
  const t = useTranslations("ShopOwnerPages.layout");
  const router = useRouter();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [shopStatus, setShopStatus] = useState(null);
  const [showInactiveAlert, setShowInactiveAlert] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopImage, setShopImage] = useState(null);
  const [shopType, setShopType] = useState("shop"); // Default to shop
  const [serviceConfig, setServiceConfig] = useState(null);
  const productsMenuLabel = shopType === "restaurant"
    ? "Menu Items"
    : (serviceConfig?.hasReservations && !serviceConfig?.hasOrders ? "Services" : "Products");
  
  
  // Use the custom auth redirect hook
  useAuthRedirect("shop-owner");

  const isActivePath = (path) => pathname.startsWith(path);


  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        setUserName(`${data?.profile?.firstName || ""} ${data?.profile?.lastName || ""}`.trim());

        // Check shop status for shop owners - now supports all types
        if (data.shop) {
          const detectedShopType = data.shop.type || "shop";
          setShopType(detectedShopType);
          setServiceConfig(getServiceConfig(detectedShopType));
          
          setShopStatus(data.shop.status);
          setShopName(data.shop.name || "");
          setShopImage(data.shop.imageUrl || null);
          
          // Show alert if shop is inactive
          if (data.shop.status === 'inactive') {
            setShowInactiveAlert(true);
          }
        } else {
          // No shop found, use default
          setServiceConfig(getServiceConfig("shop"));
        }
      } catch (e) {
        toast.error("Failed to load profile");
        setServiceConfig(getServiceConfig("shop")); // Fallback
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  // Don't render until we have service config
  if (!serviceConfig) {
    return <div>Loading...</div>;
  }

  return (
    <div id="app">
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        <div className="d-flex align-items-center justify-content-between">
          <Link
            href="/shop/dashboard"
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
              <NotificationDropdown role="shop-owner" />
            </li>
            <li className="nav-item dropdown me-3">
              <Dropdown align="end">
                <Dropdown.Toggle
                  as="a"
                  className="nav-link nav-profile d-flex align-items-center p-0 border-0"
                  style={{ cursor: "pointer" }}
                >
                  {shopImage ? (
                    <Image
                      src={shopImage}
                      alt={shopName || serviceConfig.label}
                      width={40}
                      height={40}
                      className="rounded-2"
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
                        {(shopName || serviceConfig.label).substring(0, 1)}
                      </span>
                    </div>
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-arrow profile p-0">
                  <Dropdown.Header>
                    <div className="d-flex align-items-center">
                      {shopImage ? (
                        <Image
                          src={shopImage}
                          alt={shopName || serviceConfig.label}
                          width={40}
                          height={40}
                          className="rounded-2 me-2"
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
                            {(shopName || serviceConfig.label).substring(0, 1)}
                          </span>
                        </div>
                      )}
                      <div className="text-start d-flex flex-column justify-content-center text-capitalize">
                        <h6 className="lh-1 mb-0">{shopName || serviceConfig.label}</h6>
                        <small className="text-muted">{serviceConfig.ownerLabel}</small>
                      </div>
                    </div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    as={Link}
                    href="/shop/details"
                    className="d-flex align-items-center"
                  >
                    <i className={`bi ${serviceConfig.icon}`} />
                    <span>{serviceConfig.detailsTitle}</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/shop/change-password"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-key" />
                    <span>Change Password</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/shop/wallet"
                    className="flex items-center"
                  >
                    <i className="bi bi-credit-card" />
                    <span>{t("menu_wallet")}</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as={Link}
                    href="/shop/support"
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
                href="/shop/dashboard"
                className={`nav-link ${
                  isActivePath("/shop/dashboard") ? "active" : "collapsed"
                }`}
              >
                <i className="bi bi-grid" />
                <span>Dashboard</span>
              </Link>
            </li>
            {/* Products/Menu Items - Show for shops and restaurants */}
            {(serviceConfig.hasProducts) && (
              <li className="nav-item">
                <Link
                  href={shopType === "restaurant" ? "/restaurant/menu-items" : "/shop/products"}
                  className={`nav-link ${
                    isActivePath(shopType === "restaurant" ? "/restaurant/menu-items" : "/shop/products") 
                      ? "active" 
                      : "collapsed"
                  }`}
                >
                  <i className="bi bi-box" />
                  <span>{productsMenuLabel}</span>
                </Link>
              </li>
            )}

            {/* Orders - Show for shops and restaurants */}
            {serviceConfig.hasOrders && (
              <li className="nav-item">
                <Link
                  href={shopType === "restaurant" ? "/restaurant/orders" : "/shop/orders"}
                  className={`nav-link ${
                    isActivePath(shopType === "restaurant" ? "/restaurant/orders" : "/shop/orders") 
                      ? "active" 
                      : "collapsed"
                  }`}
                >
                  <i className="bi bi-cart-check" />
                  <span>Orders</span>
                </Link>
              </li>
            )}

            {/* Reservations - Show for reservation services */}
            {serviceConfig.hasReservations && (
              <li className="nav-item">
                <Link
                  href={shopType === "restaurant" ? "/restaurant/reservations" : "/shop/reservations"}
                  className={`nav-link ${
                    isActivePath(shopType === "restaurant" ? "/restaurant/reservations" : "/shop/reservations") 
                      ? "active" 
                      : "collapsed"
                  }`}
                >
                  <i className="bi bi-calendar-check" />
                  <span>{serviceConfig.reservationsLabel || "Reservations"}</span>
                </Link>
              </li>
            )}

            {/* Payouts - Always show */}
            <li className="nav-item">
              <Link
                href="/shop/payouts"
                className={`nav-link ${
                  isActivePath("/shop/payouts") ? "active" : "collapsed"
                }`}
              >
                <i className="bi bi-cash-stack" />
                <span>Payouts</span>
              </Link>
            </li>
            {/* Support - Always show */}
            <li className="nav-item">
              <Link
                href="/shop/support"
                className={`nav-link ${
                  isActivePath("/shop/support") ? "active" : "collapsed"
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
        {/* Inactive Service Alert */}
        {showInactiveAlert && shopStatus === "inactive" && (
          <div
            className="alert alert-warning alert-dismissible fade show"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Your {serviceConfig.label.toLowerCase()} is currently inactive.</strong> Your {serviceConfig.label.toLowerCase()} 
            {serviceConfig.hasProducts ? " and products" : ""} are not visible to customers. Please contact the
            administrator to activate your {serviceConfig.label.toLowerCase()}.
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
            shopType,
            serviceConfig,
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

