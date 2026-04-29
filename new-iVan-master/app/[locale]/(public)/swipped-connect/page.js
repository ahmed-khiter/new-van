"use client";
import { useState } from 'react';

export default function SwippedConnectPage() {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background - blue to purple to pink */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #ec4899 100%)',
        }}
      />

      {/* Floating hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute left-[10%] bottom-[20%] w-12 h-12 opacity-80 animate-bounce"
          style={{ animationDuration: '3s', animationDelay: '0s' }}
        >
          <svg viewBox="0 0 24 24" fill="#ec4899" className="w-full h-full drop-shadow-lg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div 
          className="absolute left-[15%] bottom-[40%] w-10 h-10 opacity-70 animate-bounce"
          style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
        >
          <svg viewBox="0 0 24 24" fill="#ec4899" className="w-full h-full drop-shadow-lg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div 
          className="absolute top-[15%] right-[25%] w-14 h-14 opacity-75 animate-bounce"
          style={{ animationDuration: '3.5s', animationDelay: '1s' }}
        >
          <svg viewBox="0 0 24 24" fill="#ec4899" className="w-full h-full drop-shadow-lg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div 
          className="absolute top-[25%] right-[20%] w-11 h-11 opacity-65 animate-bounce"
          style={{ animationDuration: '2.8s', animationDelay: '1.5s' }}
        >
          <svg viewBox="0 0 24 24" fill="#ec4899" className="w-full h-full drop-shadow-lg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 px-4">
        
        {/* Left Side - 3D Smartphone */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-2 lg:order-1">
          <div className="relative" style={{ perspective: '1000px' }}>
            {/* 3D Smartphone */}
            <div 
              className="relative"
              style={{
                transform: 'rotateY(-15deg) rotateX(5deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Phone Frame */}
              <div 
                className="relative rounded-[2.5rem] p-3 shadow-2xl"
                style={{
                  width: '280px',
                  height: '560px',
                  background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  boxShadow: '0 20px 60px rgba(124, 58, 237, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Phone Screen */}
                <div 
                  className="w-full h-full rounded-[2rem] overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  }}
                >
                  {/* Profile Cards Container */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                    {/* Top Profile Card */}
                    <div 
                      className="w-full rounded-2xl p-4 backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Person Icon - Blue */}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: '#3b82f6' }}
                        >
                          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        {/* Loading Lines */}
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="h-2 bg-blue-500 rounded w-16"></div>
                          <div className="h-2 bg-blue-500 rounded w-12"></div>
                        </div>
                        {/* Heart Icon */}
                        <div className="w-6 h-6">
                          <svg viewBox="0 0 24 24" fill="#ec4899" className="w-full h-full">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Profile Card */}
                    <div 
                      className="w-full rounded-2xl p-4 backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Person Icon - Pink */}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: '#ec4899' }}
                        >
                          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        {/* Loading Lines */}
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="h-2 bg-pink-500 rounded w-16"></div>
                          <div className="h-2 bg-pink-500 rounded w-12"></div>
                        </div>
                        {/* Heart Icon */}
                        <div className="w-6 h-6">
                          <svg viewBox="0 0 24 24" fill="#ec4899" className="w-full h-full">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-2">
          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
            LOVE IS LOADING..
          </h1>

          {/* Subheading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8">
            Join the Waiting List
          </h2>

          {/* Join the Waitlist Section */}
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-6 py-4 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm text-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                />
              </div>

              {/* Join Button - Yellow to Orange Gradient */}
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-4 rounded-xl font-bold text-white text-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-98 shadow-lg"
                style={{
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 100%)',
                }}
              >
                {isSubmitting ? 'Joining...' : 'Join'}
              </button>
            </form>
          ) : (
            <div className="w-full max-w-md space-y-4">
              <div className="w-16 h-16 mx-auto lg:mx-0 bg-green-500 rounded-full flex items-center justify-center mb-4">
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
              <p className="text-white opacity-90 text-lg">
                We'll notify you when swipped Connect is ready.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-4 text-white underline opacity-80 hover:opacity-100 text-lg"
              >
                Join another email
              </button>
            </div>
          )}

          {/* Powered by swipped */}
          <p className="mt-8 text-white text-sm opacity-80">
            Powered by swipped
          </p>
        </div>
      </div>
    </div>
  );
}

