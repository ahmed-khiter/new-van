"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import WebViewModal from "@/components/Modals/WebViewModal";

export default function DigitalLandExchangeCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const webViewUrl = "https://digital-land-exchange.swipped.com"; // Replace with actual URL

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 7h8M8 12h8M8 17h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 7h2M3 12h2M3 17h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 7h2M19 12h2M19 17h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Buy & Sell Virtual Land",
      description: "Browse listings and trade digital properties."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="9" r="1" fill="white"/>
          <path d="M9 15h6M15 9v6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Property Management",
      description: "Manage your virtual properties easily."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 7v10M12 7v10M17 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Marketplace Analytics",
      description: "Gain insights with real-time market data."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Secure Transactions",
      description: "Built-in protections for safe trading."
    }
  ];

  return (
    <div className="flex items-center justify-center p-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-4">
        {/* App Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            {/* App Icon - Blue square with laptop/globe icon */}
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="14" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 8h20M6 4v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 10l4 4M14 10l-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            {/* Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
                Digital Land Exchange
              </h1>
              <p className="text-gray-600 text-base">
                Trade virtual land and properties in a digital marketplace.
              </p>
            </div>
          </div>

          {/* Download  Button */}
          <button
            onClick={() => {
              // Check if user is authenticated
              if (!session) {
                // Redirect to login if not authenticated
                router.push("/login");
                return;
              }
              // Open WebView if authenticated
              setIsWebViewOpen(true);
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Download 
          </button>
        </div>

        {/* Features Section */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Key Features</h2>
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              {/* Feature Icon - Square with rounded corners */}
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                {feature.icon}
              </div>
              
              {/* Feature Content */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WebView Modal */}
      <WebViewModal
        isOpen={isWebViewOpen}
        onClose={() => setIsWebViewOpen(false)}
        url={webViewUrl}
        title="Digital Land Exchange"
      />
    </div>
  );
}

