"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import WebViewModal from "@/components/Modals/WebViewModal";

export default function SwippedDatingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const webViewUrl = "https://dating.swipped.com"; // Replace with actual URL

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 10L12 6L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 14L12 18L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 2V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Swipe to Like",
      description: "Swipe through profiles to find potential matches"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="18" cy="6" r="1.5" fill="white"/>
        </svg>
      ),
      title: "Profile Customization",
      description: "Make your profile unique with photos and prompts"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Location-Based Matching",
      description: "Connect with people in your vicinity"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 10h.01M12 10h.01M16 10h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Instant Messaging",
      description: "Chat with matches through private messages"
    }
  ];

  return (
    <div className="flex items-center justify-center p-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-4">
        {/* App Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            {/* App Icon - Blue heart icon */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center bg-app-icon">
            <img src="/assets/img/mini-apps/heart.png" alt="Swipped Dating" className="w-12 h-12 object-contain" />

                    </div>
            {/* Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
                Swipped Dating
              </h1>
              <p className="text-gray-600 text-base">
                Find matches and connect with people nearby.
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
        title="Swipped Dating"
      />
    </div>
  );
}

