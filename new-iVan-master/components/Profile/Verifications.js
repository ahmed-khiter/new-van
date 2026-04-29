'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getServiceName, courierVehicleTypes } from "@/utils/helper";

function ServiceVerification() {
    const [requirements, setRequirements] = useState([]);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasRequiredDocuments, setHasRequiredDocuments] = useState(false);
    const [selectedVehicleType, setSelectedVehicleType] = useState("");
    const [isVehicleTypeRequired, setIsVehicleTypeRequired] = useState(true);
    const router = useRouter()
    useEffect(() => {
        if (!category) return;

        const fetchRequirements = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/documents?category=${encodeURIComponent(category)}`);
                const data = await res.json();
                if (res.ok) {
                    setRequirements(data.requirements || []);
                    setHasRequiredDocuments(data.requirements.some(req => req.status === "Required" || req.status === "Rejected"));
                    if ((category === "Van" || category === "restaurant" || category === "shop") && data.selectedVehicleType) {
                        setIsVehicleTypeRequired(false);
                        setSelectedVehicleType(data.selectedVehicleType);
                    }
                } else {
                    console.error(data.error);
                }
            } catch (err) {
                console.error('Error fetching requirements:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequirements();
    }, [category]);

    const handleFileChange = (reqId, file) => {
        if (!file) return;
        setFormData(prev => ({
            ...prev,
            [reqId]: file,
        }));
    };

    const handleSubmit = async () => {
        const missingFiles = requirements
            .filter(req => req.status === "Required" || req.status === "Rejected")
            .filter(req => !formData[req.id]);

        if (missingFiles.length > 0) {
            toast.error(`Please upload file(s) for all required/rejected documents.`);
            return;
        }

        // Validate vehicle type for Van, restaurant, and shop services
        if ((category === "Van" || category === "restaurant" || category === "shop") && !selectedVehicleType) {
            toast.error("Please select a vehicle type.");
            return;
        }

        const fd = new FormData();

        requirements.forEach(req => {
            if (formData[req.id]) {
                fd.append('files', formData[req.id]);
                fd.append('ids', req.id);
            }
        });

        // Add vehicle type if Van, restaurant, or shop service is selected
        if ((category === "Van" || category === "restaurant" || category === "shop") && selectedVehicleType) {
            fd.append('vehicleType', selectedVehicleType);
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: fd,
            });
            const result = await res.json();

            if (res.ok) {
                toast.success("Documents submitted successfully!");
                setFormData({});
                setSelectedVehicleType("");
                router.push('/provider/dashboard')
            } else {
                toast.error(result.error || "Upload failed, please try again.");
            }
        } catch (err) {
            toast.error("Something went wrong while submitting");
            console.error('Error submitting:', err);
        } finally {
            setIsSubmitting(false)
        }
    };

    return (
        <div className="min-h-[calc(100dvh-108px)] flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <svg 
                            className="w-5 h-5 mr-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M15 19l-7-7 7-7" 
                            />
                        </svg>
                        Back
                    </button>
                </div>
                <h3 className="text-xl font-semibold text-center mb-6">
                    Verify Your Service <span className="text-blue-600">({getServiceName(category)})</span>
                </h3>

                {/* Vehicle Type Select for Van, Restaurant, and Shop Services */}
                {(category === "Van" || category === "restaurant" || category === "shop") && (
                    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                        {selectedVehicleType && !isVehicleTypeRequired ? (
                            <div>
                                <label className="block font-medium mb-2 text-sm text-gray-700">
                                    Selected Vehicle Type:
                                </label>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {courierVehicleTypes.find(vt => vt.value === selectedVehicleType)?.label}
                                </span>
                            </div>
                        ) : (
                        <>
                        <label className="block font-medium mb-2">
                             Select Vehicle Type <span className="text-red-500">*</span>
                         </label>
                         <select
                             value={selectedVehicleType}
                             onChange={(e) => setSelectedVehicleType(e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                             required
                         >
                             <option value="" hidden>Select Vehicle Type</option>
                             {courierVehicleTypes
                                 .map(vt => (
                                     <option key={vt.value} value={vt.value}>
                                         {vt.label}
                                     </option>
                                 ))}
                         </select>
                        </>
                    )}
                      
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {requirements.map(req => (
                            <div
                                key={req.id}
                                className="p-4 border rounded-lg bg-gray-50 hover:shadow-sm transition"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <label className="font-medium">{req.name}</label>
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded ${req.status === 'Approved'
                                            ? 'bg-green-100 text-green-700'
                                            : req.status === 'Rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : req.status === 'Waiting For Approval'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {req.status}
                                    </span>
                                </div>

                                {(req.status === 'Required' || req.status === 'Rejected') && (
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.docx"
                                        className="block w-full text-sm text-gray-700 
                                            file:mr-3 file:py-2 file:px-4
                                            file:rounded-lg file:border-0
                                            file:text-sm file:font-medium
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100"
                                        onChange={e =>
                                            handleFileChange(req.id, e.target.files?.[0])
                                        }
                                    />
                                )}

                                {req.status === 'Rejected' && req.reasonOfRejection && (
                                    <p className="text-xs text-red-500 mt-2 italic">
                                        Reason: {req.reasonOfRejection}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {hasRequiredDocuments && (
                    <button
                        className="btn btn-primary w-full mt-4"
                        disabled={isSubmitting || Object.keys(formData).length === 0 || ((category === "Van" || category === "restaurant" || category === "shop") && !selectedVehicleType)}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Submitting...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </button>
                )}

                {/* Show message and redirect button when all documents are already approved */}
                {!loading && !hasRequiredDocuments && requirements.length > 0 && requirements.every(req => req.status === "Approved") && (
                    <div className="mt-6 text-center">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-green-700 font-medium">All documents verified!</span>
                            </div>
                            <p className="text-sm text-green-600">
                                Your documents for this service have already been verified.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary w-full"
                            onClick={() => router.push('/provider/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default ServiceVerification;
