"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Button } from "react-bootstrap";
import ConfirmationDialog from "@/components/Modals/ConfirmationModal";
import TeamMemberDetailModal from "@/components/Modals/TeamMemberDetailModal";

export default function TeamMembersPage() {
  const t = useTranslations("AdminPages.teamMembers");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [editingMember, setEditingMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [filters, setFilters] = useState({
    role: "all",
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch team members
  const fetchMembers = async () => {
    try {
      // Only show full loading on initial load, use filtering indicator for subsequent loads
      if (members.length === 0) {
        setLoading(true);
      } else {
        setIsFiltering(true);
      }

      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (filters.role && filters.role !== "all") params.append('role', filters.role);

      const response = await fetch(`/api/team-members?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch team members");
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      toast.error("Failed to fetch team members");
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearchQuery, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setFilters({ role: "all" });
  };

  // Handle add team member
  const handleAdd = () => {
    setModalMode("add");
    setEditingMember(null);
    setShowModal(true);
  };

  // Handle edit
  const handleEdit = (member) => {
    setModalMode("edit");
    setEditingMember(member);
    setShowModal(true);
  };

  // Handle modal success
  const handleModalSuccess = (result, mode) => {
    if (mode === "add") {
      // Add new member to state
      setMembers(prev => [result.user, ...prev]);
    } else if (mode === "edit") {
      // Update member in state
      setMembers(prev => prev.map(member => 
        member.id === editingMember.id 
          ? { 
              ...member, 
              firstName: result.user?.firstName || member.firstName,
              lastName: result.user?.lastName || member.lastName,
              email: result.user?.email || member.email,
              role: result.user?.role || member.role,
              updatedAt: new Date().toISOString()
            }
          : member
      ));
    }
  };

  // Handle delete
  const handleOpenConfirmDelete = (member) => {
    setMemberToDelete(member);
    setIsOpenConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    
    setIsOpenConfirmation(false);
    
    try {
      const response = await fetch(`/api/team-members/${memberToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team member");
      }

      toast.success("Team member deleted successfully");
      
      // Update state and stats instead of refetching
      setMembers(prevMembers => 
        prevMembers.filter(member => member.id !== memberToDelete.id)
      );
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting team member:", error);
    } finally {
      setMemberToDelete(null);
    }
  };

  const handleCloseConfirmation = () => {
    setIsOpenConfirmation(false);
    setMemberToDelete(null);
  };


  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "danger";
      case "team-member":
        return "primary";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (member) => {
    if (member.isActive && member.password) {
      return "success"; // Active and has set up password
    } else if (member.isActive && !member.password) {
      return "warning"; // Active but hasn't set up password yet
    } else {
      return "secondary"; // Inactive
    }
  };

  const getStatusText = (member) => {
    if (member.isActive && member.password) {
      return "Active";
    } else if (member.isActive && !member.password) {
      return "Pending Setup";
    } else {
      return "Inactive";
    }
  };

  return (
    <div className="pagetitle">
      <h1>Team Members</h1>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/admin-dashboard">Home</a>
          </li>
          <li className="breadcrumb-item active">Team Members</li>
        </ol>
      </nav>


      {/* Team Members Table */}
      <div className="card">
        <div className="card-body !pt-[20px] overflow-auto">
            
        <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title p-0">All Team Members</h5>
                                    <button className="btn btn-primary" onClick={handleAdd}>
                                        <i className="bi bi-plus-circle"></i> Add Team Member
                                    </button>
                                </div>

                                {/* Search and Filters */}
                                <div className="row mb-3">
                                    <div className="col-md-7">
                                        <div className="search-bar">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search team members by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={filters.role}
                                            onChange={(e) => handleFilterChange("role", e.target.value)}
                                        >
                                            <option value="">Filter By Role</option>
                                            <option value="admin">Admin</option>
                                            <option value="team-member">Team Member</option>
                                        </select>
                                    </div>
                                    <div className="col-md-1">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={handleClearFilters}
                                            style={{ height: '38px' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading || isFiltering ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">
                            {loading ? 'Loading...' : 'Filtering...'}
                          </span>
                        </div>
                        <p className="mt-2 text-muted mb-0">
                          {loading ? 'Loading team members...' : 'Applying filters...'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : members.length > 0 ? (
                  members.map((member) => (
                    <tr key={member.id}>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <div>
                            <div className="fw-bold">
                              {member?.firstName} {member?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">{member.email}</td>
                      <td className="align-middle">
                          {member.role === "team-member" ? "Team Member" : member.role === "admin" ? "Admin" : member.role}
                      </td>
                      <td className="align-middle">
                        <div>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="align-middle">
                        <span
                            title="Edit Team Member"
                            className="text-primary me-2"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleEdit(member)}
                            >
                            <i className="bi bi-pencil"></i>
                        </span>
                        <span
                            title="Delete Team Member"
                            className="text-danger me-2"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleOpenConfirmDelete(member)}
                          >
                            <i className="bi bi-trash"></i>
                          </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <i className="bi bi-people text-muted text-3xl"></i>
                        <h6 className="mt-2 text-muted mb-0">No Team Members Found</h6>
                        <p className="text-muted mb-0">No team members match your current filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Team Member Detail Modal */}
      <TeamMemberDetailModal
        show={showModal}
        onHide={() => setShowModal(false)}
        mode={modalMode}
        member={editingMember}
        onSuccess={handleModalSuccess}
      />

      {/* Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isOpenConfirmation}
        onClose={handleCloseConfirmation}
        handleConfirm={handleConfirmDelete}
        alertMessage={`Are you sure you want to delete this team member?`}
      />
    </div>
  );
}
