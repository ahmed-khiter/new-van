"use client";
import { useState, useRef, useEffect } from 'react';
import { FiCamera, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { FaRedo } from 'react-icons/fa';

const MediaDeviceHandler = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Check for MediaRecorder support and determine MIME type
  const getSupportedMimeType = () => {
    if (MediaRecorder.isTypeSupported("video/mp4")) {
      return "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      return "video/webm;codecs=vp9,opus";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
      return "video/webm;codecs=vp8,opus";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      return "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      return "video/webm;codecs=vp8";
    } else {
      return "";
    }
  };

  // Initialize camera
  const initializeCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser");
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      streamRef.current = mediaStream;

      // Set video source when video element is available
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

    } catch (err) {
      console.error("Camera access error:", err);
      
      let errorMessage = "Failed to access camera";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No camera device found on this device.";
      } else if (err.name === 'NotSupportedError') {
        errorMessage = "Camera is not supported in this browser.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setStream(null);
      streamRef.current = null;
    }
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      if (blob) {
        // Create file object
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        setCapturedImage(file);
      }
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to capture photo");
    } finally {
      setIsCapturing(false);
    }
  };

  // Retry camera initialization
  const retryCamera = () => {
    setError(null);
    setCapturedImage(null);
    initializeCamera();
  };

  // Retake photo - restart camera stream
  const retakePhoto = () => {
    setCapturedImage(null);
    // The useEffect will handle reconnecting the video element
  };

  // Send captured photo
  const sendPhoto = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
      setCapturedImage(null);
      stopCamera();
      onClose();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Initialize camera when component mounts
  useEffect(() => {
    initializeCamera();
  }, []);

  // Handle video element reconnection when retaking photo
  useEffect(() => {
    if (!capturedImage && stream && videoRef.current) {
      // When capturedImage becomes null (retake case) and we have a stream
      // Reconnect the video element to the stream
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(error => {
        console.error("Error restarting video after retake:", error);
      });
    }
  }, [capturedImage, stream]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Take Photo</h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Initializing camera...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <FiCamera className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm font-medium">Camera Error</p>
              </div>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <button
                onClick={retryCamera}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {stream && !capturedImage && (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-80 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white rounded-lg opacity-50"></div>
                </div>
              </div>

              {/* Capture Button */}
              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCapturing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <FiCamera className="w-5 h-5" />
                  )}
                  <span>{isCapturing ? "Capturing..." : "Capture Photo"}</span>
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(capturedImage)}
                  alt="Captured photo"
                  className="w-full h-80 object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <FaRedo className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={sendPhoto}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaDeviceHandler;
