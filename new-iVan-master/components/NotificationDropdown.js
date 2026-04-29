"use client";
import React, { useState, useEffect, useRef } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useNotificationCount } from "@/lib/hooks/useNotificationCount";

const NotificationDropdown = ({ role, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { count: notificationCount, refetch } = useNotificationCount();

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notifications", {
        credentials: 'include',
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        console.log('Fetched notifications:', data.notifications?.length || 0);
      } else {
        console.error('Failed to fetch notifications:', response.status);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
      refetch();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "chat":
        return "bi bi-chat-dots text-primary";
      case "document_approved":
        return "bi bi-check-circle text-success";
      case "document_rejected":
        return "bi bi-x-circle text-danger";
      case "payment":
        return "bi bi-cash-stack text-success";
      default:
        return "bi bi-bell text-info";
    }
  };

  const getNotificationTitle = (notification) => {
    // Use title from database
    return notification.title || "Notification";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification) => {
    // If notification has a jobId, navigate to job description page
    if (notification.jobId) {
      if (role === "customer" || role === "visitor") {
        return `/customer/jobs/view/${notification.jobId}`;
      } else if (role === "provider") {
        return `/provider/jobs/${notification.jobId}`;
      } else if (role === "admin") {
        return `/admin/jobs/view/${notification.jobId}`;
      }
    }

    switch (notification.type) {
      case "chat":
        return `/customer/chats${notification.chatId ? `?chat=${notification.chatId}` : ""}`;
      case "document_approved":
      case "document_rejected":
        return `/${role}/profile${notification.documentId ? `#document-${notification.documentId}` : ""}`;
      case "payment":
        return `/${role}/payouts`;
      default:
        return `/${role}/dashboard`;
    }
  };

  const isPublicLayout = className.includes("text_orange");
  
  return (
    <div className={`position-relative ${className}`} ref={dropdownRef}>
      <button
        className={`nav-link nav-profile d-flex align-items-center p-0 border-0 position-relative ${isPublicLayout ? "relative flex justify-center items-center w-[40px] h-[40px] rounded-full" : ""}`}
        style={{ cursor: "pointer", background: "none", border: "none", color: "inherit" }}
        onClick={handleToggle}
        title="Notifications"
      >
        <i className={`bi bi-bell ${isPublicLayout ? "text_orange text-xl" : "fs-5"}`}></i>
        {notificationCount > 0 && (
          <span className={`position-absolute top-0 right-0 translate-x-[30%] translate-y-[-30%] min-h-5 min-w-5 text-[12px] font-bold flex justify-center items-center text-white rounded-full ${isPublicLayout ? "bg_orange" : "bg-danger"}`} style={!isPublicLayout ? { fontSize: '0.65rem' } : {}}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="dropdown-menu dropdown-menu-start show position-absolute"
          style={{
            minWidth: "260px",
            maxWidth: "400px",
            maxHeight: "500px",
            overflowY: "auto",
            left:"auto",
            right:0,
            zIndex: 1050,
            marginTop: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            border: "1px solid #dee2e6",
            borderRadius: "0.5rem",
            backgroundColor: "#fff"
          }}
        >
          <div className="dropdown-header d-flex justify-content-between align-items-center px-3 py-2 bg-light">
            <h6 className="mb-0 fw-bold">Notifications</h6>
            <button
              className="btn btn-sm btn-link text-muted p-0"
              onClick={() => setIsOpen(false)}
              style={{ fontSize: "0.875rem", lineHeight: "1" }}
              title="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="dropdown-divider m-0"></div>
          
          {isLoading ? (
            <div className="text-center p-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="bi bi-bell-slash fs-3 mb-2 d-block"></i>
              <p className="mb-0">No notifications</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((notification, index) => (
                <Link
                  key={notification.id}
                  href={getNotificationLink(notification)}
                  className="list-group-item list-group-item-action px-3 py-2"
                  style={{ 
                    textDecoration: "none",
                    transition: "background-color 0.2s",
                    borderBottom: index < notifications.length - 1 ? "1px solid #e9ecef" : "none"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                  onClick={async (e) => {
                    e.preventDefault();
                    const notificationLink = getNotificationLink(notification);
                    
                    // Mark as read when clicked and remove from list
                    if (notification.status === 'unread') {
                      try {
                        await fetch('/api/notifications', {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({ notificationId: notification.id })
                        });
                        // Remove notification from local state immediately
                        setNotifications(prev => 
                          prev.filter(n => n.id !== notification.id)
                        );
                        refetch(); // Refresh count
                      } catch (error) {
                        console.error('Error marking notification as read:', error);
                      }
                    } else {
                      // Even if already read, remove it from the list when clicked
                      setNotifications(prev => 
                        prev.filter(n => n.id !== notification.id)
                      );
                    }
                    setIsOpen(false);
                    // Navigate to the notification link
                    router.push(notificationLink);
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0 me-3 mt-1">
                      <i className={`${getNotificationIcon(notification.type)} fs-5`}></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between">
                        <p className={`mb-1 fw-semibold ${notification.status === 'unread' ? '' : 'text-muted'}`} style={{ fontSize: "0.875rem", lineHeight: "1.3" }}>
                          {getNotificationTitle(notification)}
                        </p>
                        {notification.status === 'unread' && (
                          <span className="badge bg-primary rounded-pill" style={{ fontSize: "0.65rem" }}>New</span>
                        )}
                      </div>
                      <small className="text-muted">{formatDate(notification.createdAt)}</small>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

