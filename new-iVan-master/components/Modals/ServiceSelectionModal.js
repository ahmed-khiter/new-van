"use client";
import { services } from "@/utils/helper";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ServicesFilter from "@/components/ServicesFilter";

const ServiceSelectionModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const t = useTranslations("PublicPages.home");
  const tService = useTranslations("PublicPages.home.service_selection");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState("");

  const handleServiceSelection = async (serviceId) => {
    setIsLoading(true);
    try {
      // Redirect to booking page with selected service
      router.push(`/booking?service=${encodeURIComponent(serviceId)}`);
      onClose();
    } catch (error) {
      console.error("Error selecting service:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceFilterChange = (serviceId) => {
    setSelectedService(serviceId);
    // If it's not "shop", "supermarket", or "restaurant", trigger the service selection
    if (serviceId && serviceId !== "shop" && serviceId !== "supermarket" && serviceId !== "restaurant") {
      handleServiceSelection(serviceId);
    } else if (serviceId === "shop" || serviceId === "supermarket") {
      // Handle shop and supermarket navigation (both go to shops page)
      router.push("/shops");
      onClose();
    } else if (serviceId === "restaurant") {
      // Handle restaurant navigation
      router.push("/restaurants");
      onClose();
    } else if(serviceId === "Book a Table") {
      router.push("/reservations");
      onClose();
    }else if(serviceId === "Luggage Storage") {
      router.push("/booking?service=Luggage Storage");
      onClose();
    } else if(serviceId === "Dry Cleaning Pick-Up") {
      router.push("/booking?service=cleaning");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl relative z-[10000] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200  rounded-t-2xl z-10 p-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-0">{tService("title")}</h2>
              <p className="text-gray-600 text-sm mb-0">{tService("subtitle")}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Services Filter */}
        <div className="px-2 sm:px-6 pt-4 pb-2 bg-white border-b border-gray-100">
          <ServicesFilter
            selectedService={selectedService}
            onServiceChange={handleServiceFilterChange}
            className="mb-2 justify-center"
            scrollable={false}
            showSupermarket={true}
            showRestaurant={true}
          />
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl z-[10001]">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-600">{tService("loading_text")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSelectionModal;
