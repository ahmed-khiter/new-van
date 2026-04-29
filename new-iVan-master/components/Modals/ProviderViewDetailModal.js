"use client";
import { useState, useEffect } from "react";
import {
  getFileUrl,
  fullDateFormate,
  getShopStatusBadge,
  getServiceName,
} from "@/utils/helper";
import toast from "react-hot-toast";

// Role-based modal heading map
const ROLE_HEADINGS = {
  provider: "Provider Details",
  visitor: "Customer Details",
  "shop-owner": "Shop Owner Details",
  restaurant: "Restaurant Owner Details",
};

function ProviderViewDetailModal({
  providerId,
  userData,
  isOpen,
  onClose,
  onStatusUpdate,
  onUserDataUpdate,
  role,
}) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (isOpen && providerId) {
      // If userData is provided, use it directly; otherwise fetch from API
      if (userData && userData.details && userData.details.id === providerId) {
        setProvider(userData.details);
        // Only set plan if role is provider
        if (role === 'provider' && userData.details.plan) {
          setPlan(userData.details.plan);
        } else {
          setPlan(null);
        }
        setLoading(false);
      } else {
        fetchProviderDetails();
      }
    } else {
      // Reset state when modal closes
      setProvider(null);
      setPlan(null);
    }
  }, [isOpen, providerId, userData, role]);

 
  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/all-users/${providerId}`);

      if (response.ok) {
        const data = await response.json();
       
        setProvider(data.user);
        // Only set plan if role is provider
        if (data.user?.role === 'provider' && data.user.plan) {
          setPlan(data.user.plan);
        } else {
          setPlan(null);
        }
        
        // Notify parent component to update user data in state
        if (onUserDataUpdate && data.user) {
          onUserDataUpdate(providerId, data.user);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch user details");
        onClose?.();
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!provider) return;

    const newStatus = provider.status === "active" ? "suspended" : "active";

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/providers/${providerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setProvider((prev) => ({ ...prev, status: newStatus }));
        onStatusUpdate?.(providerId, newStatus);
        toast.success(data.message);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update provider status");
      }
    } catch (error) {
      console.error("Error updating provider status:", error);
      toast.error("Failed to update provider status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: "bg-success text-success-foreground", text: "Active" },
      suspended: {
        class: "bg-danger text-danger-foreground",
        text: "Suspended",
      },
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}
      >
        {config.text}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            { ROLE_HEADINGS[role] || "User Details"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : provider ? (
            <div className="p-6 space-y-6">
              {/* Provider Image and Basic Info */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Basic Information */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {provider.firstName} {provider.lastName}
                    </h3>
                    <div className="flex items-center gap-3">
                      {getShopStatusBadge(provider?.status)}
                      {provider?.role === 'provider' && (
                        <span className="badge badge-custom-sm bg-primary capitalize p-2 text-[14px] text-center text-white">
                          {provider?._count?.acceptedJobs || 0} jobs accepted
                        </span>
                      )}
                      {plan && (
                        <span className="badge badge-custom-sm bg-info capitalize p-2 text-[14px] text-center text-white">
                          {plan.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Contact Information
                    </h4>
                    <div className="space-y-1">
                      <p className="text-gray-700 mb-0">
                        <span className="font-medium">Email:</span>{" "}
                        {provider.email}
                      </p>
                      <p className="text-gray-700 mb-0">
                        <span className="font-medium">Account Status:</span>{" "}
                        {provider.isActive ? "Verified" : "Unverified"}
                      </p>
                      <p className="text-gray-700 mb-0">
                        <span className="font-medium">Joined At:</span>{" "}
                        {fullDateFormate(provider.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {(provider.address1 || provider.city || provider.country) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📍</span>
                    Address Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {provider.address1 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Address Line 1:
                        </span>
                        <p className="text-gray-800">{provider.address1}</p>
                      </div>
                    )}
                    {provider.address2 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Address Line 2:
                        </span>
                        <p className="text-gray-800">{provider.address2}</p>
                      </div>
                    )}
                    {provider.city && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          City:
                        </span>
                        <p className="text-gray-800">{provider.city}</p>
                      </div>
                    )}
                    {provider.postCode && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Postal Code:
                        </span>
                        <p className="text-gray-800">{provider.postCode}</p>
                      </div>
                    )}
                    {provider.country && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Country:
                        </span>
                        <p className="text-gray-800">{provider.country}</p>
                      </div>
                    )}
                    {/* {provider.latitude && provider.longitude && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Coordinates:
                        </span>
                        <p className="text-gray-800">
                          {provider.latitude}, {provider.longitude}
                        </p>
                      </div>
                    )} */}
                  </div>
                </div>
              )}
               {/* Services Information - Only for providers */}
               {provider.role === 'provider' && provider.settings?.services &&
                 provider.settings.services.length > 0 && (
                   <div className="bg-green-50 rounded-lg p-4">
                     <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                       <i className="bi bi-briefcase mr-2"></i>
                       Services ({provider.settings.services.length})
                     </h4>
                     <div className="flex flex-wrap gap-2">
                       {provider.settings.services.map((service, index) => (
                         <div
                           key={index}
                           className="flex items-center gap-2 px-3 py-2"
                         >
                           <span className="text-sm font-medium">
                             {getServiceName(service.name)}
                           </span>
                           <span
                             className={`badge ${
                               service.status === "Approved"
                                 ? "bg-success"
                                 : service.status === "Pending"
                                 ? "bg-warning"
                                 : "bg-danger"
                             } text-white text-xs`}
                           >
                             {service.status}
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              {/* Documents Section - Only for providers */}
              {provider.role === 'provider' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <i className="bi bi-file-earmark-text mr-2"></i>
                    Uploaded Documents (Approved) (
                    {provider.documents?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {provider.documents?.length > 0 ? (
                      provider.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border"
                        >
                          <div className="flex items-center flex-1">
                            <i className="bi bi-file-earmark-pdf text-red-500 mr-2"></i>
                            <div className="flex-1">
                              <span className="text-sm font-medium truncate">
                                {doc.name}
                              </span>
                              <a href={getFileUrl(doc.fileName)} target="_blank" className="text-xs ms-4">
                                View
                              </a>
                              {doc.category && (
                                <div className="text-xs text-gray-700 mt-1">
                                   {getServiceName(doc.category)}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {fullDateFormate(doc.createdAt)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No documents uploaded
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <i className="bi bi-exclamation-triangle text-4xl text-gray-400 mb-2"></i>
                <p className="text-gray-500">Failed to load provider details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProviderViewDetailModal;
