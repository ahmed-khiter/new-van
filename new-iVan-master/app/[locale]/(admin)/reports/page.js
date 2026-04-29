"use client";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { fullDateFormate, DEFAULT_PAGINATION, getFileUrl } from "@/utils/helper";
import Pagination from "@/components/Pagination";
import { useSession } from "next-auth/react";
import { Modal, Button } from "react-bootstrap";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" }
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/reports?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data?.reports || []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        }));
      }
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleViewDetails = async (reportId) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error("Failed to fetch report details");
      const data = await response.json();
      setSelectedReport(data.report);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Failed to load report details");
    }
  };

  const handleStatusChange = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNotes(report.adminNotes || "");
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport || !newStatus) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: newStatus,
          adminNotes: adminNotes || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update report");
      
      toast.success("Report status updated successfully");
      setShowStatusModal(false);
      fetchReports();
    } catch (error) {
      toast.error("Failed to update report status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      in_review: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Issue Reports</h2>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <input
            type="text"
            className="form-control"
            placeholder="Search by issue type, description, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No reports found</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Job</th>
                  <th>Issue Type</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <code className="text-xs">{report.id.substring(0, 8)}...</code>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{report.job?.title || "N/A"}</div>
                        <small className="text-muted">{report.job?.category || ""}</small>
                      </div>
                    </td>
                    <td>{report.issueType}</td>
                    <td>
                      {report.reportedBy
                        ? `${report.reportedBy.firstName} ${report.reportedBy.lastName || ""}`
                        : "N/A"}
                      <br />
                      <small className="text-muted">{report.reportedByRole}</small>
                    </td>
                    <td>
                      <span
                        className={`badge ${getStatusBadge(report.status)}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td>{fullDateFormate(report.createdAt)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(report.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleStatusChange(report)}
                        >
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
          />
        </>
      )}

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Report Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Report ID:</strong>
                  <p className="mb-0">
                    <code>{selectedReport.id}</code>
                  </p>
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong>
                  <p className="mb-0">
                    <span className={`badge ${getStatusBadge(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Job:</strong>
                  <p className="mb-0">{selectedReport.job?.title || "N/A"}</p>
                  <small className="text-muted">{selectedReport.job?.category || ""}</small>
                </div>
                <div className="col-md-6">
                  <strong>Issue Type:</strong>
                  <p className="mb-0">{selectedReport.issueType}</p>
                </div>
              </div>

              <div className="mb-3">
                <strong>Description:</strong>
                <p className="mb-0">{selectedReport.description}</p>
              </div>

              {selectedReport.desiredAction && (
                <div className="mb-3">
                  <strong>Desired Action:</strong>
                  <p className="mb-0">{selectedReport.desiredAction}</p>
                </div>
              )}

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Reported By:</strong>
                  <p className="mb-0">
                    {selectedReport.reportedBy
                      ? `${selectedReport.reportedBy.firstName} ${selectedReport.reportedBy.lastName || ""}`
                      : "N/A"}
                  </p>
                  <small className="text-muted">
                    {selectedReport.reportedBy?.email || ""}
                  </small>
                  <br />
                  <small className="text-muted">Role: {selectedReport.reportedByRole}</small>
                </div>
                <div className="col-md-6">
                  <strong>Date:</strong>
                  <p className="mb-0">{fullDateFormate(selectedReport.createdAt)}</p>
                </div>
              </div>

              {selectedReport.evidenceFiles && Array.isArray(selectedReport.evidenceFiles) && selectedReport.evidenceFiles.length > 0 && (
                <div className="mb-3">
                  <strong>Evidence Files:</strong>
                  <div className="row mt-2">
                    {selectedReport.evidenceFiles.map((file, index) => (
                      <div key={index} className="col-md-3 mb-2">
                        <img
                          src={getFileUrl(file)}
                          alt={`Evidence ${index + 1}`}
                          className="img-thumbnail w-100"
                          style={{ height: "100px", objectFit: "cover" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.adminNotes && (
                <div className="mb-3">
                  <strong>Admin Notes:</strong>
                  <p className="mb-0">{selectedReport.adminNotes}</p>
                </div>
              )}

              {selectedReport.resolvedAt && (
                <div className="mb-3">
                  <strong>Resolved At:</strong>
                  <p className="mb-0">{fullDateFormate(selectedReport.resolvedAt)}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Report Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.filter((opt) => opt.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Admin Notes</label>
            <textarea
              className="form-control"
              rows="4"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this report..."
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus} disabled={updating}>
            {updating ? "Updating..." : "Update Status"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

