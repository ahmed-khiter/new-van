"use client";
import { useState, useRef, useMemo } from "react";
import { FiX, FiImage, FiMessageCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/routing";
import { getServiceName, fullDateFormate, CategoryIcon } from "@/utils/helper";

// Issue types mapped by service category
const ISSUE_TYPES_BY_CATEGORY = {
  "Cleaning": [
    "Cleaner did not arrive",
    "Cleaner arrived late",
    "Job not completed fully",
    "Poor cleaning quality",
    "Areas missed",
    "Unprofessional behaviour",
    "Damage to property",
    "Price charged incorrectly",
    "Booking/app issue",
    "Other"
  ],
  "Locksmith": [
    "Locksmith did not arrive",
    "Arrived late",
    "Could not complete the job",
    "Lock/key issue not resolved",
    "Damage caused to door/lock",
    "Overcharged / price dispute",
    "Unprofessional behaviour",
    "Emergency response delay",
    "Booking/app issue",
    "Other"
  ],
  "Click & Collect": [
    "Driver did not arrive",
    "Collection delayed",
    "Item not collected",
    "Wrong item collected",
    "Item damaged during transport",
    "Store pickup issue",
    "Delivery delayed",
    "Price issue",
    "App/tracking issue",
    "Other"
  ],
  "Dry Cleaning Pick-Up": [
    "Driver did not arrive",
    "Pickup delayed",
    "Drop-off delayed",
    "Items missing",
    "Items damaged",
    "Wrong items returned",
    "Poor handling of clothes",
    "Price issue",
    "App/tracking issue",
    "Other"
  ],
  "Luggage Storage": [
    "Unable to access storage",
    "Staff did not arrive",
    "Luggage delayed",
    "Luggage damaged",
    "Luggage missing",
    "Wrong luggage returned",
    "Storage location issue",
    "Price issue",
    "App/booking issue",
    "Other"
  ],
  "Recovery": [
    "Recovery vehicle did not arrive",
    "Long delay in arrival",
    "Vehicle not recovered",
    "Wrong destination drop-off",
    "Damage to vehicle",
    "Driver behaviour issue",
    "Emergency response issue",
    "Price dispute",
    "App/tracking issue",
    "Other"
  ],
  "Car Key Replacement": [
    "Technician did not arrive",
    "Arrived late",
    "Key not working",
    "Wrong key provided",
    "Job not completed",
    "Vehicle issue caused",
    "Overcharged / price issue",
    "Unprofessional behaviour",
    "Booking/app issue",
    "Other"
  ],
  "Removals": [
    "Team did not arrive",
    "Arrived late",
    "Rubbish not fully removed",
    "Items left behind",
    "Property damage",
    "Incorrect disposal",
    "Price charged incorrectly",
    "Unprofessional behaviour",
    "Booking/app issue",
    "Other"
  ],
  "restaurant": [
    "Rider did not arrive",
    "Food delivery delayed",
    "Cold food",
    "Wrong order delivered",
    "Missing items",
    "Food damaged/spilled",
    "Restaurant issue",
    "Rider behaviour issue",
    "Price issue",
    "App/tracking issue",
    "Other"
  ],
  "shop": [
    "Driver did not arrive",
    "Delivery delayed",
    "Item damaged",
    "Item missing",
    "Wrong item delivered",
    "Package opened/tampered",
    "Price issue",
    "Seller issue",
    "App/tracking issue",
    "Other"
  ],
  "supermarket": [
    "Delivery delayed",
    "Missing items",
    "Wrong items delivered",
    "Damaged items",
    "Expired products",
    "Poor substitutions",
    "Rider behaviour issue",
    "Price charged incorrectly",
    "App/tracking issue",
    "Other"
  ],
  "Van": [
    "Driver did not arrive",
    "Delivery delayed",
    "Item damaged",
    "Item missing",
    "Wrong item delivered",
    "Package opened/tampered",
    "Price issue",
    "App/tracking issue",
    "Other"
  ]
};

// Default issue types for unknown categories
const DEFAULT_ISSUE_TYPES = [
  "Service provider did not arrive",
  "Service delayed",
  "Service not completed",
  "Poor service quality",
  "Damage caused",
  "Price issue",
  "Unprofessional behaviour",
  "Booking/app issue",
  "Other"
];

const DESIRED_ACTIONS = [
  { value: "refund", label: "Refund" },
  { value: "redo", label: "Redo the job" },
  { value: "partial_refund", label: "Partial refund" },
  { value: "just_report", label: "Just report the issue (no action needed)" }
];

// Function to get issue types based on category
const getIssueTypes = (category) => {
  if (!category) return DEFAULT_ISSUE_TYPES;
  return ISSUE_TYPES_BY_CATEGORY[category] || DEFAULT_ISSUE_TYPES;
};

function ReportIssueModal({ job, isOpen, onClose, onSubmit }) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [desiredAction, setDesiredAction] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Get issue types based on job category
  const issueTypes = useMemo(() => {
    return getIssueTypes(job?.category);
  }, [job?.category]);

  if (!isOpen || !job) return null;

  const handleFileSelect = (files) => {
    const newFiles = Array.from(files || []);
    const validFiles = newFiles.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type. Please use JPG or PNG.`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    const totalFiles = evidenceFiles.length + validFiles.length;
    if (totalFiles > 5) {
      toast.error("You can upload a maximum of 5 images.");
      const remainingSlots = 5 - evidenceFiles.length;
      validFiles.splice(remainingSlots);
    }

    setEvidenceFiles(prev => [...prev, ...validFiles]);
    setEvidencePreviews(prev => [
      ...prev,
      ...validFiles.map(file => URL.createObjectURL(file))
    ]);
  };

  const handleUploadFromGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeEvidence = (index) => {
    setEvidenceFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });
    setEvidencePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!issueType) {
      toast.error("Please select an issue type.");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe the issue.");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Please provide more details about the issue (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('jobId', job.id);
      formData.append('issueType', issueType);
      formData.append('description', description.trim());
      formData.append('desiredAction', desiredAction);
      formData.append('notifyByEmail', notifyByEmail);
      formData.append('notifyInApp', notifyInApp);

      // Append evidence files
      evidenceFiles.forEach((file, index) => {
        formData.append('evidence', file);
      });

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default API call if no custom submit handler
        const response = await fetch('/api/reports', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(data.message || "Issue reported successfully. We'll review it and get back to you.");
          handleClose();
        } else {
          toast.error(data.error || "Failed to submit report. Please try again.");
        }
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setIssueType("");
    setDescription("");
    setDesiredAction("");
    // Revoke object URLs before clearing
    evidencePreviews.forEach(url => URL.revokeObjectURL(url));
    setEvidenceFiles([]);
    setEvidencePreviews([]);
    setNotifyByEmail(true);
    setNotifyInApp(true);
    onClose();
  };

  const handleOpenAdminChat = async () => {
    try {
      setIsOpeningChat(true);
      const response = await fetch('/api/chats/support', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        handleClose();
        router.push(`/customer/chats?chatId=${data.id}`);
      } else {
        toast.error(data.error || "Failed to open support chat.");
      }
    } catch (error) {
      console.error('Error opening support chat:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsOpeningChat(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-white rounded-xl shadow-lg relative z-[10000] max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 md:px-5 py-2 sm:py-3 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Report an Issue</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close modal"
            >
              <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 py-3 sm:py-4 space-y-4 sm:space-y-5">
          {/* Job Information Card */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex-shrink-0">
                <CategoryIcon 
                  category={job?.category} 
                  className="text-orange-600 text-base sm:text-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{job.title || "Product Delivery"}</h3>
                <p className="text-xs sm:text-sm text-gray-600 capitalize mb-1">
                  {getServiceName(job.category) || "Deliveries & Couriers"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <i className="fa fa-calendar text-gray-400" aria-hidden="true"></i>
                  <span>{job.createdAt ? fullDateFormate(job.createdAt) : "Date: N/A"}</span>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 mb-0">
              Let us know what went wrong with this job. We'll review it and get back to you.
            </p>
          </div>

          {/* Issue Type */}
          <div>
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              <span>Issue Type <span className="text-red-500">*</span></span>
              <i className="fa fa-exclamation-triangle text-yellow-500 text-xs sm:text-sm" aria-hidden="true"></i>
            </label>
            <p className="text-xs text-gray-600 mb-2 sm:mb-2.5">Select the issue that best describes the problem</p>
            <div className="relative">
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-xs sm:text-sm"
              >
                <option value="">Select the issue</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                <i className="fa fa-chevron-down text-gray-400 text-xs" aria-hidden="true"></i>
              </div>
            </div>
          </div>

          {/* Describe the Issue */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Describe the Issue <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail. Include dates, times, and what outcome you expect."
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-xs sm:text-sm"
              rows={4}
              maxLength={1000}
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 mt-1.5">
              <p className="text-xs text-gray-500 mb-0">
                The more details you provide, the faster we can help.
              </p>
              <p className="text-xs text-gray-500 mb-0">
                {description.length} / 1000 Characters
              </p>
            </div>
          </div>

          {/* Upload Evidence */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Upload Evidence <span className="text-gray-500 text-xs font-normal">(Optional)</span>
            </label>
            <button
              type="button"
              onClick={handleUploadFromGallery}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-2"
            >
              <FiImage className="w-4 h-4 text-gray-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Upload from Gallery</span>
            </button>
            <p className="text-xs text-gray-500">
              You can upload up to 5 images (JPG, PNG).
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {/* Evidence Preview */}
            {evidencePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {evidencePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-16 sm:h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeEvidence(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 sm:p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <FiX className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What would you like us to do? */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              What would you like us to do? <span className="text-gray-500 text-xs font-normal">(Optional)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DESIRED_ACTIONS.map((action) => (
                <label
                  key={action.value}
                  className="flex items-center gap-2 p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={action.value}
                    checked={desiredAction === action.value}
                    onChange={(e) => {
                      setDesiredAction(e.target.checked ? action.value : "");
                    }}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 rounded border-gray-300 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-700">{action.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Preference */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              Contact Preference
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyByEmail}
                  onChange={(e) => setNotifyByEmail(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 flex-shrink-0"
                />
                <span className="text-xs sm:text-sm text-gray-700">Notify me by email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyInApp}
                  onChange={(e) => setNotifyInApp(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 flex-shrink-0"
                />
                <span className="text-xs sm:text-sm text-gray-700">Notify me in the app</span>
              </label>
            </div>
          </div>

          {/* Notice Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              Notice
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-4 h-4 text-green-600 rounded border-gray-300 flex-shrink-0"
                />
                <span className="text-xs sm:text-sm text-gray-700">All reports are reviewed by our support team</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-4 h-4 text-green-600 rounded border-gray-300 flex-shrink-0"
                />
                <span className="text-xs sm:text-sm text-gray-700">You will be notified of the resolution</span>
              </label>
            </div>
          </div>

          {/* Live Chat Section - general chat with admin */}
          <div className="pt-1 border-t border-gray-100">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
              or message us on live chat
            </p>
            <button
              type="button"
              onClick={handleOpenAdminChat}
              disabled={isOpeningChat}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOpeningChat ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiMessageCircle className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {isOpeningChat ? "Opening chat..." : "Chat with Admin"}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 sm:px-4 md:px-2 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !issueType || !description.trim()}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIssueModal;

