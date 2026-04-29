"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import WebViewModal from "@/components/Modals/WebViewModal";

export default function SwippedGamingArenaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const webViewUrl = "https://gaming-arena.swipped.com"; // Replace with actual URL

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="8" width="12" height="8" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="10" cy="12" r="1" fill="white"/>
          <circle cx="14" cy="12" r="1" fill="white"/>
          <path d="M12 10V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8" cy="16" r="1.5" fill="white"/>
          <circle cx="16" cy="16" r="1.5" fill="white"/>
        </svg>
      ),
      title: "Competitive Tournaments",
      description: "Join skill-based and casual competitions."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="6" width="16" height="12" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="6" y="9" width="8" height="6" rx="1" fill="white"/>
          <circle cx="9" cy="12" r="1" fill="currentColor" className="text-blue-500"/>
          <path d="M18 8L22 6V18L18 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Live Game Streaming",
      description: "Stream matches directly to Swipped Live."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9H4C2.89543 9 2 9.89543 2 11V19C2 20.1046 2.89543 21 4 21H6C7.10457 21 8 20.1046 8 19V11C8 9.89543 7.10457 9 6 9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 6H11C9.89543 6 9 6.89543 9 8V19C9 20.1046 9.89543 21 11 21H13C14.1046 21 15 20.1046 15 19V8C15 6.89543 14.1046 6 13 6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 3H18C16.8954 3 16 3.89543 16 5V19C16 20.1046 16.8954 21 18 21H20C21.1046 21 22 20.1046 22 19V5C22 3.89543 21.1046 3 20 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="4" r="1" fill="white"/>
        </svg>
      ),
      title: "Rewards & Rankings",
      description: "Earn rewards through performance"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12H22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 2C15.31 2 18.31 3.43 20.31 5.69C21.31 6.69 22.31 8.31 22.31 10.31C22.31 12.31 21.31 13.93 20.31 14.93C18.31 17.19 15.31 18.62 12 18.62C8.69 18.62 5.69 17.19 3.69 14.93C2.69 13.93 1.69 12.31 1.69 10.31C1.69 8.31 2.69 6.69 3.69 5.69C5.69 3.43 8.69 2 12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Community Gaming Hub",
      description: "Connect with gamers globally in one arena"
    }
  ];

  return (
    <div className="flex items-center justify-center p-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-4">
        {/* App Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
           

            <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center bg-app-icon">
            <img src="/assets/img/mini-apps/gaming_arena.png" 
                alt="Swipped Gaming Arena" className="w-12 h-12 object-contain" />

                    </div>
            
            {/* Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
                Swipped Gaming Arena
              </h1>
              <p className="text-gray-600 text-base">
                Compete, stream, and earn inside the Swipped ecosystem.
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
        title="Swipped Gaming Arena"
      />
    </div>
  );
}

