"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import WebViewModal from "@/components/Modals/WebViewModal";

export default function SwippedSkillTradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const webViewUrl = "https://skill-trade.swipped.com"; // Replace with actual URL

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 4V10H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.49 15C19.84 16.84 18.73 18.5 17.26 19.77C15.79 21.04 14.02 21.88 12.13 22.19C10.24 22.5 8.29 22.27 6.5 21.53C4.71 20.79 3.15 19.57 1.99 18C0.83 16.43 0.11 14.57 0 12.66C-0.11 10.75 0.41 8.85 1.33 7.19C2.25 5.53 3.52 4.18 5.01 3.28C6.5 2.38 8.16 1.97 9.84 2.08" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 20V14H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Skill-for-Skill Exchange",
      description: "Offer your skill and receive others in return."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">S</text>
        </svg>
      ),
      title: "Skill Tokens System",
      description: "Earn tokens for work and spend them on services."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12H22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 2C15.31 2 18.31 3.43 20.31 5.69C21.31 6.69 22.31 8.31 22.31 10.31C22.31 12.31 21.31 13.93 20.31 14.93C18.31 17.19 15.31 18.62 12 18.62C8.69 18.62 5.69 17.19 3.69 14.93C2.69 13.93 1.69 12.31 1.69 10.31C1.69 8.31 2.69 6.69 3.69 5.69C5.69 3.43 8.69 2 12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Global Skill Marketplace",
      description: "Trade skills locally or worldwide."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 10C8 10 9 9 10 9C11 9 12 10 12 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 10C12 10 13 9 14 9C15 9 16 10 16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 14C8 14 9 13 10 13C11 13 12 14 12 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14C12 14 13 13 14 13C15 13 16 14 16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 18C6 18 7 17 8 17C9 17 10 18 10 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 18C14 18 15 17 16 17C17 17 18 18 18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Community-Powered Economy",
      description: "Built on trust, ratings, and value exchange."
    }
  ];

  return (
    <div className="flex items-center justify-center p-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-4">
        {/* App Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
           

            <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center bg-app-icon">
            <img  src="/assets/img/mini-apps/skill_for_skill.png" 
                alt="Swipped Skill Trade"  className="w-12 h-12 object-contain" />

                    </div>
            
            {/* Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
                Swipped Skill Trade
              </h1>
              <p className="text-gray-600 text-base">
                Trade your skills for real value — no money needed.
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
        title="Swipped Skill Trade"
      />
    </div>
  );
}

