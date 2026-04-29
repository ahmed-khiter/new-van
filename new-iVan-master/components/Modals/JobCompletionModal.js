"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

function JobCompletionModal({ jobId, onClose, setJobs }) {
    const [requirements, setRequirements] = useState([]);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRequiredDocuments, setHasRequiredDocuments] = useState(false);
    const hasFetchedReqDocs = useRef(false);

    useEffect(() => {
        if (!jobId) return;
        if (hasFetchedReqDocs.current) return;
        hasFetchedReqDocs.current = true;

        const fetchRequirements = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/documents?jobId=${jobId}`);
                const data = await res.json();

                if (res.ok) {
                    setRequirements(data.requirements || []);
                    setHasRequiredDocuments(data.requirements.some(req => req.status === "Required" || req.status === "Rejected"));
                    const allApproved = data.requirements.every(
                        (doc) => doc.status === "Approved"
                    );

                    if (allApproved) {
                        setTimeout(() => {
                            setJobs((prevJobs) =>
                                prevJobs.map((j) =>
                                    j.id === jobId ? { ...j, status: "completed" } : j
                                )
                            );
                            toast.success(
                                "All your job documents have been approved! The job is now marked as completed. 🎉"
                            );
                            onClose?.();
                        }, 1000);
                    }
                } else {
                    console.error(data.error);
                }
            } catch (err) {
                console.error("Error fetching job requirements:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequirements();
    }, [jobId, setJobs, onClose]);

    const handleFileChange = (reqId, file) => {
        if (!file) return;
        setFormData((prev) => ({
            ...prev,
            [reqId]: file,
        }));
    };

    const handleSubmit = async () => {
        const missingFiles = requirements
            .filter((req) => req.status === "Required" || req.status === "Rejected")
            .filter((req) => !formData[req.id]);

        if (missingFiles.length > 0) {
            toast.error(`Please upload file(s) for all required/rejected documents.`);
            return;
        }
        const fd = new FormData();
        fd.append("isJob", "true");
        fd.append("jobId", jobId);

        requirements.forEach((req) => {
            if (formData[req.id]) {
                fd.append("files", formData[req.id]);
                fd.append("ids", req.id);
            }
        });

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/documents", {
                method: "POST",
                body: fd,
            });
            const result = await res.json();

            if (res.ok) {
                toast.success("Job documents submitted successfully!");
                setJobs(prevJobs =>
                    prevJobs.map(j => (j.id === jobId ? { ...j, status: "pending" } : j))
                );
                setFormData({});
                onClose?.();
            } else {
                toast.error(result.error || "Upload failed, please try again.");
            }
        } catch (err) {
            toast.error("Something went wrong while submitting");
            console.error("Error submitting:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 relative z-[10000]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>

                {/* Heading */}
                <h3 className="text-xl font-semibold text-center mt-4">
                    Complete Your Job Documents
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Please upload the required files to complete your job.
                    Rejected files must be re-uploaded for verification.
                </p>

                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                        {requirements.map((req) => (
                            <div
                                key={req.id}
                                className="p-4 border rounded-lg bg-gray-50 hover:shadow-sm transition"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <label className="font-medium">{req.name}</label>
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded ${req.status === "Approved"
                                            ? "bg-green-100 text-green-700"
                                            : req.status === "Rejected"
                                                ? "bg-red-100 text-red-700"
                                                : req.status === "Waiting For Approval"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {req.status}
                                    </span>
                                </div>

                                {(req.status === "Required" || req.status === "Rejected") && (
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.docx"
                                        className="block w-full text-sm text-gray-700 
                        file:mr-3 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                                        onChange={(e) =>
                                            handleFileChange(req.id, e.target.files?.[0])
                                        }
                                    />
                                )}

                                {req.status === "Rejected" && req.reasonOfRejection && (
                                    <p className="text-xs text-red-500 mt-2 italic">
                                        Reason: {req.reasonOfRejection}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit Button - Only show if there are documents available for upload */}
                {hasRequiredDocuments && (
                    <button
                        className="btn btn-primary w-full mt-4"
                        disabled={isSubmitting || Object.keys(formData).length === 0}
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
                            "Submit Job Documents"
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export default JobCompletionModal;
