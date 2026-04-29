"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import WebViewModal from "@/components/Modals/WebViewModal";

export default function InvoiceGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const webViewUrl = "https://invoice-generator.swipped.com"; // Replace with actual URL

  const features = [
    {
      icon: (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 13H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 right-0">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ),
      title: "Invoice Creation",
      description: "Generate professional invoices with ease."
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Customization Options",
      description: "Add your business details, item, and terms."
    },
    {
      icon: (
        <div className="text-white font-bold text-sm">PDF</div>
      ),
      title: "PDF Download",
      description: "Download invoices as PDF files for sharing."
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Track Payments",
      description: "Mark invoices as paid and monitor payment status."
    }
  ];

  return (
    <div className="flex items-center justify-center p-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-4">
        {/* App Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
          
            <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center bg-app-icon">
            <img src="/assets/img/mini-apps/invoice_generator.png" 
                alt="Invoice Generator"  className="w-12 h-12 object-contain" />

                    </div>
            
            {/* Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
                Invoice Generator
              </h1>
              <p className="text-gray-600 text-base">
                Create quick and easy invoices in minutes.
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
        title="Invoice Generator"
      />
    </div>
  );
}

