"use client";
import { useState } from 'react';
import Image from 'next/image';

export default function VirtualWorldPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call - replace with actual API endpoint later
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center p-2 relative overflow-hidden">
      {/* Dark gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at top left, #4a3f8f 0%, #2d1b4e 50%, #1a0d2e 100%)',
        }}
      >
        {/* Subtle glowing patterns */}
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center bottom, rgba(79, 70, 229, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          A Virtual World
          <br />
          is Coming
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-white mb-8 opacity-90">
          Be among the first to experience it.
        </p>

        {/* 3D Character */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64">
            <Image
              src="/assets/img/mini-apps/virtual-land.png"
              alt="Virtual World Character"
              width={256}
              height={256}
              className="object-contain w-full h-full"
              priority
            />
          </div>
        </div>

        {/* Join the Waitlist Section */}
        {!isSubmitted ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Join the Waitlist
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-base sm:text-lg"
                  style={{
                    backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  }}
                />
              </div>

              {/* Join Button */}
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-4 rounded-xl font-semibold text-white text-lg sm:text-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-98"
                style={{
                  backgroundColor: '#2563eb',
                }}
              >
                {isSubmitting ? 'Joining...' : 'Join'}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              You're on the list!
            </h2>
            <p className="text-white opacity-80">
              We'll notify you when the Virtual World is ready.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 text-white underline opacity-80 hover:opacity-100"
            >
              Join another email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

