"use client";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { courierVehicleTypes } from "@/utils/helper";

export default function Page() {
  const router = useRouter();
  const t = useTranslations("AdminPages");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [courierService, setCourierService] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    pricePerMile: "",
    callOutCharge: "",
    isActive: true
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Courier
  useEffect(() => {
    const fetchCourierService = async () => {
      try {
        const response = await fetch(`/api/services`);
        const data = await response.json();
        const courier = data?.services?.find(s => 
          s.name.toLowerCase().includes('courier') || 
          s.name.toLowerCase().includes('van')
        );
        if (courier) {
          setCourierService(courier);
        }
      } catch (error) {
        console.error("Error fetching Courier:", error);
      }
    };

    fetchCourierService();
  }, []);

  const fetchVehicleTypes = async () => {
    if (!courierService) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("serviceId", courierService.id);
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);

      const response = await fetch(`/api/vehicle-types?${params.toString()}`);
      const data = await response.json();
      setVehicleTypes(data?.vehicleTypes || []);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      toast.error("Failed to fetch vehicle types");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courierService) {
      fetchVehicleTypes();
    }
  }, [courierService, debouncedSearchQuery]);

  const handleAddVehicleType = () => {
    setEditingVehicleType(null);
    setFormData({
      name: "",
      pricePerMile: "",
      callOutCharge: "",
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditVehicleType = (vehicleType) => {
    setEditingVehicleType(vehicleType);
    setFormData({
      name: vehicleType.name,
      pricePerMile: vehicleType.pricePerMile.toString(),
      callOutCharge: vehicleType.callOutCharge.toString(),
      isActive: vehicleType.isActive
    });
    setShowEditModal(true);
  };

  const handleSaveVehicleType = async (isEdit = false) => {
    if (!courierService) {
      toast.error("Courier not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicleData = {
        ...formData,
        serviceId: courierService.id,
        pricePerMile: parseFloat(formData.pricePerMile),
        callOutCharge: parseFloat(formData.callOutCharge)
      };

      const url = isEdit 
        ? `/api/vehicle-types/${editingVehicleType.id}`
        : `/api/vehicle-types`;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        toast.success(isEdit ? "Vehicle type updated successfully" : "Vehicle type added successfully");
        if (isEdit) {
          setShowEditModal(false);
        } else {
          setShowAddModal(false);
        }
        fetchVehicleTypes();
      } else {
        const errorData = await response.json();
        toast.error(errorData?.error || "Failed to save vehicle type");
      }
    } catch (error) {
      console.error("Error saving vehicle type:", error);
      toast.error("Failed to save vehicle type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicleType = async (id) => {
    if (!confirm("Are you sure you want to delete this vehicle type?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vehicle-types/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Vehicle type deleted successfully");
        fetchVehicleTypes();
      } else {
        toast.error("Failed to delete vehicle type");
      }
    } catch (error) {
      console.error("Error deleting vehicle type:", error);
      toast.error("Failed to delete vehicle type");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getAvailableVehicleOptions = () => {
    const existingNames = vehicleTypes.map(vt => vt.name);
    return courierVehicleTypes.filter(opt => !existingNames.includes(opt.value));
  };

  return (
    <>
      <div className="pagetitle">
        <h1>Vehicle Types - Courier</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/admin-dashboard">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/services">Services</Link>
            </li>
            <li className="breadcrumb-item active">Vehicle Types</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div className={`card ${isLoading || vehicleTypes?.length === 0 ? "card-custom-min-height" : ""}`}>
              <div className="d-flex justify-content-between align-items-center my-4 !px-[20px]">
                <div className="col-md-4 p-0">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search vehicle types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddVehicleType}
                    disabled={!courierService || getAvailableVehicleOptions().length === 0}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Vehicle Type
                  </button>
                </div>
              </div>
              <div className={`card-body ${isLoading || vehicleTypes?.length === 0 ? "d-flex justify-content-center align-items-center" : ""}`}>
                {vehicleTypes && vehicleTypes?.length > 0 ? (
                  <>
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Vehicle Type</th>
                          <th scope="col">Price Per Mile (£)</th>
                          <th scope="col">Call Out Charge (£)</th>
                          <th scope="col">Status</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          vehicleTypes.map((vehicleType, index) => (
                            <tr key={vehicleType.id}>
                              <td>{index + 1}</td>
                              <td>
                                {courierVehicleTypes.find(opt => opt.value === vehicleType.name)?.label || vehicleType.name}
                              </td>
                              <td className="text-center">£{vehicleType.pricePerMile}</td>
                              <td className="text-center">£{vehicleType.callOutCharge}</td>
                              <td>{getStatusBadge(vehicleType.isActive)}</td>
                              <td>
                                <span
                                  title="Edit"
                                  className="text-primary me-2"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleEditVehicleType(vehicleType)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </span>
                                <span
                                  title="Delete"
                                  className="text-danger"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleDeleteVehicleType(vehicleType.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="bi bi-car-front text-muted" style={{ fontSize: "4rem", opacity: 0.5 }}></i>
                    </div>
                    <h5 className="text-muted mb-3">No Vehicle Types Found</h5>
                    <p className="text-muted">Add vehicle types to configure pricing for the Courier.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Vehicle Type Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Vehicle Type</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Vehicle Type</label>
                    <select
                      className="form-select"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Vehicle Type</option>
                      {getAvailableVehicleOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Price Per Mile (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="pricePerMile"
                      value={formData.pricePerMile}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                    <small className="form-text text-muted">
                      This price will be multiplied by the distance in miles for each job.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Call Out Charge (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="callOutCharge"
                      value={formData.callOutCharge}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                    <small className="form-text text-muted">
                      This is the minimum call out charge that will be added to the calculated price.
                    </small>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        id="addIsActive"
                      />
                      <label className="form-check-label" htmlFor="addIsActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={() => handleSaveVehicleType(false)}
                  disabled={isSubmitting || !formData.name || !formData.pricePerMile || !formData.callOutCharge}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Adding...
                    </>
                  ) : (
                    "Add Vehicle Type"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Type Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Vehicle Type</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Vehicle Type</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={courierVehicleTypes.find(opt => opt.value === formData.name)?.label || formData.name}
                      disabled
                    />
                    <small className="form-text text-muted">
                      Vehicle type cannot be changed after creation.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Price Per Mile (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="pricePerMile"
                      value={formData.pricePerMile}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                    <small className="form-text text-muted">
                      This price will be multiplied by the distance in miles for each job.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Call Out Charge (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="callOutCharge"
                      value={formData.callOutCharge}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                    <small className="form-text text-muted">
                      This is the minimum call out charge that will be added to the calculated price.
                    </small>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        id="editIsActive"
                      />
                      <label className="form-check-label" htmlFor="editIsActive">
                        Active
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={() => handleSaveVehicleType(true)}
                  disabled={isSubmitting || !formData.pricePerMile || !formData.callOutCharge}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    "Update Vehicle Type"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

