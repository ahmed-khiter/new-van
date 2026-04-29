"use client";
import ConfirmationDialog from "@/components/Modals/ConfirmationModal";
import { Link, useRouter } from "@/i18n/routing";
import { getStatusBadge, getServiceName, services } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { Button } from "react-bootstrap";
import toast from "react-hot-toast";
import ChatIcon from "@/components/ChatIcon";
export default function Page() {
  const router = useRouter();
  const t = useTranslations("AdminPages.jobsList");
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) {
        params.append("title", debouncedSearchQuery.trim());
      }
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      if (categoryFilter) {
        params.append("categories", categoryFilter);
      }
      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();
      setJobs(data?.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error(error.message || "Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [debouncedSearchQuery, statusFilter, categoryFilter]);
  const handleAddJob = async () => {
    router.push("/jobs/create");
  };

  const handleEditJob = (job) => {
    router.push(`/jobs/${job.id}`);
  };

  const handleViewJob = (job) => {
    router.push(`/jobs/view/${job.id}`);
  };

  const handleOpenConfirmDelete = (id) => {
    setJobId(id);
    setIsOpenConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsOpenConfirmation(false);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
        toast.success(t("toast_delete_success"));
      } else {
        const { error } = await response.json();
        toast.error(`${t("toast_delete_error_prefix")} ${error}`);
      }
    } catch (error) {
      toast.error(t("toast_delete_generic_error"));
    }
  };
  const handleCloseConfirmation = () => {
    setIsOpenConfirmation(false);
    setJobId(null);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCategoryFilter("");
  };
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
            <div className="card">
              <div className="d-flex align-items-center my-4 !px-[20px] flex-wrap gap-3">
                {/* Search Input */}
                <div className="flex-grow-1 min-w-[200px]">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div className="min-w-[150px]">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="min-w-[180px]">
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleClearFilters}
                  style={{ height: "38px" }}
                >
                  Clear
                </button>
                {/* Add Job Button */}
                <Button className="btn btn-primary" onClick={handleAddJob}>
                  <i className="bi bi-plus-circle"></i> {t("add_job")}
                </Button>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">{t("table_number")}</th>
                      <th scope="col">{t("table_title")}</th>
                      <th scope="col">{t("table_category")}</th>
                      <th scope="col">{t("table_status")}</th>
                      <th scope="col">{t("table_action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <p className="mt-2 text-muted mb-0">
                              Loading jobs...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : jobs && jobs.length > 0 ? (
                      jobs.map((job, index) => {
                        const { title, category, status } = job;
                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{title}</td>
                            <td>{getServiceName(category)}</td>
                            <td>{getStatusBadge(status)}</td>
                            <td>
                              <span
                                title="View"
                                className="text-info me-2"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleViewJob(job)}
                              >
                                <i className="bi bi-eye"></i>
                              </span>
                              <span
                                title="Edit"
                                className="text-primary me-2"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleEditJob(job)}
                              >
                                <i className="bi bi-pencil"></i>
                              </span>
                              <span
                                title="Delete"
                                className="text-danger me-2"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleOpenConfirmDelete(job.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </span>
                              {/* Chat Icon */}
                              <ChatIcon
                                job={job}
                                className="d-inline-block align-middle"
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-0">
                        <td colSpan="5" className="text-center py-4 border-0">
                          <div className="d-flex flex-column align-items-center">
                            <i className="bi bi-briefcase text-muted text-3xl"></i>
                            <h6 className="mt-2 text-muted mb-0">
                              No jobs found
                            </h6>
                            <p className="text-muted mb-0">
                              Try adjusting your search or filters criteria
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ConfirmationDialog
        isOpen={isOpenConfirmation}
        onClose={handleCloseConfirmation}
        handleConfirm={handleConfirmDelete}
        alertMessage={t("confirm_delete")}
      />
    </>
  );
}
