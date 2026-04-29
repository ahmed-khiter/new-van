"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "@/i18n/routing";
import { Button, Modal, Form } from "react-bootstrap";
import CustomIllustration from "@/components/CustomIllustration";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { getServiceName } from "@/utils/helper";
export default function Page() {
    const t = useTranslations("AdminPages.verifications");
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedItem, setExpandedItem] = useState(null);
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [loadingAction, setLoadingAction] = useState({
        type: "",
        loading: false,
    });
    const [activeTab, setActiveTab] = useState("serviceDocs");

    const fetchDocuments = async () => {
        try {
            const response = await fetch("/api/pending-verifications");
            if (!response.ok) throw new Error("Failed to fetch documents");
            const data = await response.json();
            setDocuments(data?.pendingVerifications || []);
        } catch (error) {
            toast.error(t("toast_fetch_failed"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDocSelection = (docId, checked) => {
        setSelectedDocs((prev) =>
            checked ? [...prev, docId] : prev.filter((id) => id !== docId)
        );
    };

    const handleBulkAction = async (status) => {
        if (status === "Rejected" && !rejectReason.trim()) {
            toast.error("Reason is required for rejection");
            return;
        }

        setLoadingAction({ type: status, loading: true });

        try {
            const payload = { docIds: selectedDocs, status };
            if (status === "Rejected") payload.reasonOfRejection = rejectReason;

            const res = await fetch(`/api/documents/bulk-update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Update failed");

            toast.success(`Documents ${status.toLowerCase()}`);
            setDocuments((docs) => docs.filter((d) => !selectedDocs.includes(d.id)));
            setSelectedDocs([]);
            setShowRejectModal(false);
            setRejectReason("");
            
            // Dispatch event to update sidebar count
            window.dispatchEvent(new CustomEvent('verificationUpdated'));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoadingAction({ type: "", loading: false });
        }
    };

    const serviceDocs = documents.filter((doc) => !doc.jobId);
    const jobDocs = documents.filter((doc) => doc.jobId);

    const groupedServiceDocs = serviceDocs.reduce((acc, doc) => {
        const uid = doc.userId;
        if (!acc[uid]) acc[uid] = { user: doc.user, documents: [] };
        acc[uid].documents.push(doc);
        return acc;
    }, {});

    const groupedJobDocs = jobDocs.reduce((acc, doc) => {
        const jid = doc.jobId;
        if (!acc[jid]) acc[jid] = { jobTitle: doc.job?.title, documents: [] };
        acc[jid].documents.push(doc);
        return acc;
    }, {});

    const getCount = (type) => {
        return type === "serviceDocs" ? serviceDocs.length : jobDocs.length;
    };

    const renderGroupTable = (grouped, isJobGroup = false) => (
        <table className="table">
            <thead>
                <tr>
                    <th></th>
                    <th>{isJobGroup ? "Job Title" : "Service Provider"}</th>
                    <th>Category / Type</th>
                    <th>Documents</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(grouped).map(([key, group]) => (
                    <React.Fragment key={key}>
                        <tr>
                            <td
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    setExpandedItem(expandedItem === key ? null : key)
                                }
                                className={expandedItem === key ? "!border-b-0" : ""}
                            >
                                {expandedItem === key ? (
                                    <FaChevronUp size={14} />
                                ) : (
                                    <FaChevronDown size={14} />
                                )}
                            </td>
                            <td className={expandedItem === key ? "!border-b-0" : ""}>
                                {isJobGroup ? (
                                    group.jobTitle
                                ) : (
                                    <div>
                                        <div className="fw-semibold">
                                            {group.user.firstName} {group.user.lastName}
                                        </div>
                                        <small className="text-muted">
                                            {group.user.email}
                                        </small>
                                    </div>
                                )}
                            </td>
                            <td className={expandedItem === key ? "!border-b-0" : ""}>
                                {getServiceName(group.documents[0]?.category) || "-"}
                            </td>
                            <td className={expandedItem === key ? "!border-b-0" : ""}>
                                {group.documents.length} document(s)
                            </td>
                        </tr>
                        {expandedItem === key && (
                            <tr className="border-b border-transparent">
                                <td colSpan={1} className="!border-t-0"></td>
                                <td colSpan={3} className="!border-t-0">
                                    <table className="table table-sm mb-0">
                                        <thead>
                                            <tr>
                                                <th className="!border-t-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={group.documents.every(doc => selectedDocs.includes(doc.id))}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked;
                                                            const groupDocIds = group.documents.map(doc => doc.id);
                                                            if (isChecked) {
                                                                setSelectedDocs(prev => [...new Set([...prev, ...groupDocIds])]);
                                                            } else {
                                                                setSelectedDocs(prev => prev.filter(id => !groupDocIds.includes(id)));
                                                            }
                                                        }}
                                                    />
                                                </th>
                                                <th className="!border-t-0">Document</th>
                                                <th className="!border-t-0">View</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.documents.map((doc) => (
                                                <tr key={doc.id}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDocs.includes(doc.id)}
                                                            onChange={(e) =>
                                                                handleDocSelection(doc.id, e.target.checked)
                                                            }
                                                        />
                                                    </td>
                                                    <td>{doc.name}</td>
                                                    <td>
                                                        <a
                                                            href={doc.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            View
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );

    return (
        <>
            <div className="pagetitle">
                <h1>{t("title")}</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link href="/admin-dashboard">{t("breadcrumb_home")}</Link>
                        </li>
                        <li className="breadcrumb-item">{t("breadcrumb_current")}</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <div
                            className={`card ${isLoading
                                ? "card-custom-min-height"
                                : ""
                                }`}
                        >
                            <div
                                className={`card-body !pt-[20px] overflow-auto ${isLoading
                                    ? "d-flex justify-content-center align-items-center"
                                    : ""
                                    }`}
                            >
                                {/* Tabs */}
                                {!isLoading && (
                                    <div className="flex bg-white p-2 rounded-[8px] gap-2 mb-4 shadow-sm">
                                        {["serviceDocs", "jobDocs"].map((tab) => {
                                            const label = tab === "serviceDocs" ? t("tab_service") : t("tab_job");

                                            return (
                                                <div
                                                    key={tab}
                                                    className={`flex-1 text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200
                ${activeTab === tab
                                                            ? "bg-blue-600 text-white shadow-md"
                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                        }`}
                                                    onClick={() => {
                                                        setActiveTab(tab);
                                                        setSelectedDocs([]);
                                                    }}
                                                >
                                                    {label} ({getCount(tab)})
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Loading */}
                                {isLoading ? (
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">{t("loading")}</span>
                                    </div>
                                ) : (activeTab === "serviceDocs" ? serviceDocs : jobDocs)
                                    .length > 0 ? (
                                    <>
                                        {selectedDocs.length > 0 && (
                                            <div className="my-3 p-3 bg-light rounded border">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>{selectedDocs.length}</strong> {t("selected_count", { count: selectedDocs.length })}
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() => setSelectedDocs([])}
                                                        >
                                                            {t("cancel")}
                                                        </button>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleBulkAction("Approved")}
                                                            disabled={
                                                                loadingAction.loading &&
                                                                loadingAction.type === "Approved"
                                                            }
                                                        >
                                                            {loadingAction.loading &&
                                                                loadingAction.type === "Approved" ? (
                                                                <>
                                                                    <span
                                                                        className="spinner-border spinner-border-sm me-2"
                                                                        role="status"
                                                                    ></span>
                                                                    {t("approving")}
                                                                </>
                                                            ) : (
                                                                t("approve")
                                                            )}
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => setShowRejectModal(true)}
                                                        >
                                                            {t("reject")}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Table */}
                                        {activeTab === "serviceDocs"
                                            ? renderGroupTable(groupedServiceDocs)
                                            : renderGroupTable(groupedJobDocs, true)}
                                    </>
                                ) : (
                                    <CustomIllustration
                                        page="verifications"
                                        illustrationHelperText={
                                            activeTab === "serviceDocs" ? t("no_service_docs") : t("no_job_docs")
                                        }
                                    />

                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reject Modal */}
            <Modal
                show={showRejectModal}
                onHide={() => setShowRejectModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t("reject_modal_title")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>{t("reject_reason_label")}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                        {t("modal_cancel")}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleBulkAction("Rejected")}
                        disabled={
                            loadingAction.loading && loadingAction.type === "Rejected"
                        }
                    >
                        {loadingAction.loading && loadingAction.type === "Rejected" ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                ></span>
                                {t("rejecting")}
                            </>
                        ) : (
                            t("modal_reject")
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
