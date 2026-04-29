"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ReportIssueModal from "./Modals/ReportIssueModal";

export default function JobCTA({ 
  onViewClick,
  onCompleteClick,
  onReportClick,
  onCancelClick,
  onChatClick,
  onPayClick,
  onTrackClick,
  onDeleteClick,
  enableView = true,
  enableComplete = true,
  enableReport = true,
  enableCancel = true,
  enableChat = true,
  enablePay = false,
  enableTrack = false,
  enableDelete = false,
  isDisabled = false,
  isCompleting = false,
  isCancelling = false,
  isPaying = false,
  isDeleting = false,
  job = null,
  className = ""
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMenuItemClick = (handler) => {
    if (handler && typeof handler === 'function') {
      handler();
    }
    setIsOpen(false);
  };

  // Check if job is a service (not shop, restaurant, or supermarket)
  const isServiceJob = () => {
    if (!job?.category) return false;
    const nonServiceCategories = ['shop', 'restaurant', 'supermarket'];
    return !nonServiceCategories.includes(job.category.toLowerCase());
  };

  // Get the appropriate message label based on job category
  const getContactLabel = () => {
    if (!job?.category) return "Message";
    
    const category = job.category.toLowerCase();
    
    // Message shop for click and collect, shop, and supermarket (Retail Stores)
    if (category === 'click & collect' || category === 'shop' || category === 'supermarket') {
      return "Message shop";
    }
    
    // Message restaurant for restaurant (Restaurants)
    if (category === 'restaurant') {
      return "Message restaurant";
    }
    
    // Message service provider for service categories
    // Cleaning, Car Key Replacement, Removals (Rubbish removals), Recovery (Breakdown Assistance), Van (Courier), Locksmith
    return "Message service provider";
  };

  // Consolidated handler for all contact actions - navigate to chat
  const handleContact = () => {
    if (!job?.chatId) {
      return;
    }
    
    const role = session?.user?.role;
    let chatPath = '/customer/chats'; // default fallback
    
    if (role === 'admin') {
      chatPath = '/admin-chats';
    } else if (role === 'provider') {
      chatPath = '/provider/chats';
    } else if (role === 'visitor') {
      chatPath = '/customer/chats';
    }
    
    router.push(`${chatPath}?chatId=${job.chatId}`);
  };

  const menuItems = [];
  
  // if (enableView && onViewClick) {
  //   menuItems.push({
  //     label: "View job description",
  //     onClick: onViewClick
  //   });
  // }
  
  // if (enableComplete && onCompleteClick) {
  //   menuItems.push({
  //     label: "Mark as completed",
  //     onClick: onCompleteClick,
  //     disabled: isCompleting || isCancelling
  //   });
  // }
  
  if (enablePay && onPayClick) {
    menuItems.push({
      label: isPaying ? "Processing..." : "Pay Now",
      onClick: onPayClick,
      disabled: isPaying || isDeleting || isCancelling
    });
  }
  
  if (enableTrack && onTrackClick) {
    menuItems.push({
      label: "Track",
      onClick: onTrackClick
    });
  }
  
  if (enableReport) {
    menuItems.push({
      label: "Report issue",
      onClick: () => {
        setIsReportModalOpen(true);
        setIsOpen(false);
        // Still call onReportClick if provided for backwards compatibility
        if (onReportClick && typeof onReportClick === 'function') {
          onReportClick();
        }
      }
    });
  }


  // Add contact option with appropriate label based on job category
  // For service jobs with assigned provider, show "Contact driver", otherwise show category-specific label
  // On provider side, always show "Contact customer"
  if (job?.chatId) {
    const role = session?.user?.role;
    if (role === 'provider') {
      menuItems.push({
        label: "Contact customer",
        onClick: handleContact
      });
    } else if (isServiceJob() && job?.acceptedById) {
      menuItems.push({
        label: "Contact driver",
        onClick: handleContact
      });
    } else {
      menuItems.push({
        label: getContactLabel(),
        onClick: handleContact
      });
    }
  }

  
  if (enableDelete && onDeleteClick) {
    menuItems.push({
      label: isDeleting ? "Deleting..." : "Delete",
      onClick: onDeleteClick,
      disabled: isDeleting || isPaying || isCancelling
    });
  }
  
  if (enableCancel && onCancelClick) {
    menuItems.push({
      label: isCancelling ? "Cancelling..." : "Cancel job",
      onClick: onCancelClick,
      disabled: isCompleting || isCancelling
    });
  }

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`relative ${className}`} ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isDisabled}
          className={`rounded-full transition-all duration-200 ${
            isOpen 
              ? ' text-gray-700' 
              : ' text-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Open job actions menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <i className="fa fa-ellipsis-v" aria-hidden="true"></i>
        </button>

        {isOpen && (
          <div 
            className="absolute right-0 mt-2 min-w-[200px] bg-white shadow-xl rounded-lg py-2 border border-gray-200 z-50"
            role="menu"
            style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          >
            {menuItems.map((item, index) => (
              <button
                key={index}
                type="button"
                className={`w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150 ${
                  item.disabled 
                    ? 'opacity-50 cursor-not-allowed hover:bg-transparent' 
                    : 'cursor-pointer'
                } ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                onClick={() => !item.disabled && handleMenuItemClick(item.onClick)}
                disabled={item.disabled}
                role="menuitem"
              >
                <span className="block">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {enableReport && job && (
        <ReportIssueModal
          job={job}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </>
  );
}
