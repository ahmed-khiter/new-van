"use client";
import {
  formatAmountToCurrency,
  fullDateFormate,
  getUserFullName,
  getShopStatusBadge,
  DEFAULT_PAGINATION,
  getLocationOptions,
} from "@/utils/helper";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import CustomIllustration from "@/components/CustomIllustration";
import { Link } from "@/i18n/routing";
import { Button, Modal } from "react-bootstrap";
import ProviderViewDetailModal from "@/components/Modals/ProviderViewDetailModal";
import { useTranslations } from "next-intl";
import Pagination from "@/components/Pagination";
import { useSession } from "next-auth/react";

export default function Page() {
  const t = useTranslations("AdminPages.providers");
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === "admin";
  const isAffiliate = userRole === "affiliate";
  const canInvite = isAdmin || isAffiliate;
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    status: "",
  });
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  
  // Invite user modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    shopName: "",
    country: "GB"
  });
  const [inviteErrors, setInviteErrors] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      if (filters.role) {
        params.append("role", filters.role);
      }

      if (filters.status) {
        params.append("status", filters.status);
      }

      const response = await fetch(`/api/all-users?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch users data");
      const data = await response.json();
      setUsers(data?.users || []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        }));
      }
    } catch (error) {
      toast.error(t("toast_fetch_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filters, pagination.page, pagination.pageSize, t]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page: page }));
  };

  const handleViewUser = (userId, userData = null) => {
    setSelectedUserId(userId);
    setSelectedUserData(userData);
    setShowViewModal(true);
  };

  const handleStatusToggle = (user) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    setSelectedUser(user);
    setNewStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedUser) return;

    try {
      setUpdatingStatus(selectedUser.id);
      const response = await fetch(`/api/all-users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUser.id ? { ...user, status: newStatus } : user
          )
        );
        // Update user data if it's stored
        if (selectedUserData && selectedUserData.id === selectedUser.id) {
          setSelectedUserData((prev) => ({ ...prev, status: newStatus }));
        }
        toast.success(data.message || "Status updated successfully");
        setShowStatusModal(false);
        setSelectedUser(null);
        setNewStatus("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedUser(null);
    setNewStatus("");
  };

  const handleStatusUpdate = (userId, newStatus) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
    // Update selected user data if it matches
    if (selectedUserData && selectedUserData.id === userId) {
      setSelectedUserData((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleUserDataUpdate = (userId, userData) => {
    // Update user in the list with full details
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, details: userData } : user
      )
    );
  };

  const getRoleBadgeClass = (role) => {
    const badgeClasses = {
      provider: "bg-warning",
      visitor: "bg-primary",
      "shop-owner": "bg-secondary",
      restaurant: "bg-info",
      affiliate: "bg-dark",
    };
    return badgeClasses[role] || "bg-info";
  };

  // Invite user handlers
  const handleInviteInputChange = (e) => {
    const { name, value } = e.target;
    setInviteFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (inviteErrors[name]) {
      setInviteErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateInviteForm = () => {
    const newErrors = {};
    
    if (!inviteFormData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!inviteFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteFormData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!inviteFormData.role) {
      newErrors.role = "Role is required";
    }
    
    if ((inviteFormData.role === "shop-owner" || inviteFormData.role === "restaurant") && !inviteFormData.shopName.trim()) {
      newErrors.shopName = `${inviteFormData.role === "restaurant" ? "Restaurant" : "Shop"} name is required`;
    }
    
    setInviteErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateInviteForm()) {
      return;
    }

    setInviteLoading(true);
    
    try {
      const response = await fetch("/api/invite-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite user");
      }

      toast.success(data.message || "User invited successfully!");
      setShowInviteModal(false);
      resetInviteForm();
      // Refresh users list
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to invite user");
      console.error("Error inviting user:", error);
    } finally {
      setInviteLoading(false);
    }
  };

  const resetInviteForm = () => {
    setInviteFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      shopName: "",
      country: "GB"
    });
    setInviteErrors({});
  };

  const handleInviteClose = () => {
    setShowInviteModal(false);
    resetInviteForm();
  };

  const inviteNoteLines = isAdmin
    ? [
        "An invitation email with password setup link",
        "Affiliate access to onboard shops and restaurants",
        "Commission earnings based on order transactions from onboarded businesses",
      ]
    : [
        "An invitation email with password setup link",
        "2 months free trial subscription",
        "Access continues based on platform approval and policy",
      ];

  return (
    <>
      <div className="pagetitle">
        <h1>Users</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/admin-dashboard">{t("breadcrumb_home")}</Link>
            </li>
            <li className="breadcrumb-item">Users</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div
              className={`card ${
                isLoading || users?.length === 0 ? "card-custom-min-height" : ""
              }`}
            >
              <div className="card-body">
                {/* Header with Invite Button for Admin/Affiliate */}
                {canInvite && (
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="card-title mb-0">All Users</h5>
                    </div>
                    <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                      <i className="bi bi-person-plus me-2"></i>
                      Invite User
                    </Button>
                  </div>
                )}
                
                {/* Search and Filters */}
                <div className="row mb-3 pt-[20px]">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={filters.role}
                      onChange={(e) =>
                        handleFilterChange("role", e.target.value)
                      }
                    >
                      <option value="">Filter by Role</option>
                      <option value="provider">Provider</option>
                      <option value="visitor">Visitor</option>
                      <option value="shop-owner">Shop Owner</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="affiliate">Affiliate</option>
                    </select>
                  </div>
                  {/* <div className="col-md-4">
                                        <select
                                            className="form-select"
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange("status", e.target.value)}
                                        >
                                            <option value="">Filter by Status</option>
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div> */}
                </div>
                <div
                  className={`overflow-auto ${
                    isLoading || users.length === 0
                      ? "d-flex justify-content-center align-items-center"
                      : ""
                  }`}
                  style={{
                    minHeight:
                      isLoading || users.length === 0 ? "400px" : "auto",
                  }}
                >
                  {isLoading ? (
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">{t("loading")}</span>
                    </div>
                  ) : users && users?.length > 0 ? (
                    <>
                      <table className="table">
                        <thead>
                          <tr>
                            <th scope="col">{t("table_number")}</th>
                            <th scope="col">{t("table_name")}</th>
                            <th scope="col">{t("table_email")}</th>
                            <th scope="col">Role</th>
                            {/* <th scope="col">Status</th> */}
                            <th scope="col" className="text-center">
                              {t("table_action")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user, index) => (
                            <tr key={user.id}>
                              <td>
                                {(pagination.page - 1) * pagination.pageSize +
                                  index +
                                  1}
                              </td>
                              <td>
                                {getUserFullName(
                                  user?.firstName,
                                  user?.lastName
                                )}
                              </td>
                              <td>{user?.email}</td>
                              <td>
                                <span
                                  className={`badge ${getRoleBadgeClass(user.role)} text-capitalize`}
                                >
                                  {user?.role === "visitor"
                                    ? "Customer"
                                    : user?.role === "affiliate"
                                    ? "Affiliate"
                                    : user?.role}
                                </span>
                              </td>
                              {/* <td>
                                                            {getShopStatusBadge(user?.status || 'active')}
                                                        </td> */}
                              <td>
                                <div className="d-flex align-items-center gap-3 justify-content-center">
                                  {/* View Profile Icon */}
                                  <span
                                    title="View User Details"
                                    className="text-primary text-[18px] cursor-pointer"
                                    onClick={() =>
                                      handleViewUser(user.id, user)
                                    }
                                  >
                                    <i className="bi bi-person-fill"></i>
                                  </span>

                                  {/* Status Toggle Icon */}
                                  {/* {user?.status === 'active' ? (
                                                                    <span
                                                                        title="Suspend User"
                                                                        className="text-success text-[18px] cursor-pointer"
                                                                        onClick={() => handleStatusToggle(user)}
                                                                    >
                                                                        <i className="bi bi-check-circle-fill"></i>
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        title="Activate User"
                                                                        className="text-danger text-[18px] cursor-pointer"
                                                                        onClick={() => handleStatusToggle(user)}
                                                                    >
                                                                        <i className="bi bi-x-circle-fill"></i>
                                                                    </span>
                                                                )} */}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <CustomIllustration
                      page={"providers"}
                      illustrationHelperText={t("no_providers")}
                    />
                  )}
                </div>

                {/* Pagination */}
                {!isLoading && users.length > 0 && (
                  <div className="mt-4 ms-auto w-fit">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                      hasNextPage={pagination.page < pagination.totalPages}
                      hasPrevPage={pagination.page > 1}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("wallet_modal_title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWallet ? (
            <div>
              <p>
                <strong>{t("wallet_account_holder")}</strong>{" "}
                {selectedWallet.accountHolderName || "N/A"}
              </p>
              <p>
                <strong>{t("wallet_account_number")}</strong>{" "}
                {selectedWallet.accountNumber || "N/A"}
              </p>
              <p>
                <strong>{t("wallet_sort_code")}</strong>{" "}
                {selectedWallet.sortCode || "N/A"}
              </p>
              <p>
                <strong>{t("wallet_amount")}</strong>{" "}
                {formatAmountToCurrency(selectedWallet.amount)}
              </p>
              <p>
                <strong>{t("wallet_created_at")}</strong>{" "}
                {fullDateFormate(selectedWallet.createdAt)}
              </p>
            </div>
          ) : (
            <p>{t("wallet_not_found")}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {t("wallet_close")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User View Detail Modal */}
      <ProviderViewDetailModal
        providerId={selectedUserId}
        userData={selectedUserData}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUserData(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        onUserDataUpdate={handleUserDataUpdate}
        role={selectedUserData?.role}
      />

      {/* Status Confirmation Modal */}
      {showStatusModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {newStatus === "suspended"
                    ? "Suspend User Account"
                    : "Activate User Account"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeStatusModal}
                  disabled={updatingStatus === selectedUser?.id}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to{" "}
                  <strong
                    className={
                      newStatus === "suspended" ? "text-danger" : "text-success"
                    }
                  >
                    {newStatus === "suspended" ? "suspend" : "activate"}
                  </strong>{" "}
                  the account for{" "}
                  <strong>
                    {selectedUser?.firstName} {selectedUser?.lastName}
                  </strong>
                  ?
                </p>
                {newStatus === "suspended" && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    This will prevent the provider from accepting new jobs. They
                    will remain suspended until you reactivate their account.
                  </div>
                )}
                {newStatus === "active" && (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    This will allow the provider to accept new jobs and continue
                    their normal activities.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeStatusModal}
                  disabled={updatingStatus === selectedUser?.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${
                    newStatus === "suspended" ? "btn-danger" : "btn-success"
                  }`}
                  onClick={confirmStatusUpdate}
                  disabled={updatingStatus === selectedUser?.id}
                >
                  {updatingStatus === selectedUser?.id ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      {newStatus === "suspended" ? "Suspend" : "Activate"}{" "}
                      Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showStatusModal && <div className="modal-backdrop fade show"></div>}

      {/* Invite User Modal */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Invite User</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleInviteSubmit}>
          <Modal.Body>
            <div className="alert alert-info mb-3">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> Invited users will receive:
              <ul className="mb-0 mt-2">
                {inviteNoteLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  className={`form-control ${inviteErrors.firstName ? 'is-invalid' : ''}`}
                  value={inviteFormData.firstName}
                  onChange={handleInviteInputChange}
                  placeholder="Enter first name"
                />
                {inviteErrors.firstName && (
                  <div className="invalid-feedback">
                    {inviteErrors.firstName}
                  </div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  value={inviteFormData.lastName}
                  onChange={handleInviteInputChange}
                  placeholder="Enter last name"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${inviteErrors.email ? 'is-invalid' : ''}`}
                  value={inviteFormData.email}
                  onChange={handleInviteInputChange}
                  placeholder="Enter email address"
                />
                {inviteErrors.email && (
                  <div className="invalid-feedback">
                    {inviteErrors.email}
                  </div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Country *
                </label>
                <select
                  name="country"
                  className="form-select"
                  value={inviteFormData.country}
                  onChange={handleInviteInputChange}
                >
                  {getLocationOptions().map((location) => (
                    <option key={location.code} value={location.code}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Role *
                </label>
                <select
                  name="role"
                  className={`form-select ${inviteErrors.role ? 'is-invalid' : ''}`}
                  value={inviteFormData.role}
                  onChange={handleInviteInputChange}
                >
                  <option value="">Select role</option>
                  {isAdmin && <option value="affiliate">Affiliate</option>}
                  {isAffiliate && <option value="restaurant">Restaurant Owner</option>}
                  {isAffiliate && <option value="shop-owner">Shop Owner</option>}
                </select>
                {inviteErrors.role && (
                  <div className="invalid-feedback">
                    {inviteErrors.role}
                  </div>
                )}
              </div>

              {(inviteFormData.role === "shop-owner" || inviteFormData.role === "restaurant") && (
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    {inviteFormData.role === "restaurant" ? "Restaurant" : "Shop"} Name{" "}
                    *
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    className={`form-control ${inviteErrors.shopName ? 'is-invalid' : ''}`}
                    value={inviteFormData.shopName}
                    onChange={handleInviteInputChange}
                    placeholder={`Enter ${inviteFormData.role === "restaurant" ? "restaurant" : "shop"} name`}
                  />
                  {inviteErrors.shopName && (
                    <div className="invalid-feedback">
                      {inviteErrors.shopName}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleInviteClose} disabled={inviteLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={inviteLoading}>
              {inviteLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Inviting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Send Invitation
                </>
              )}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}
