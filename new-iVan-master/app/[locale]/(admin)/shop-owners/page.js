"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { getFileUrl, fullDateFormate, getShopStatusBadge } from "@/utils/helper";
import { Link } from "@/i18n/routing";
import ShopViewDetailModal from "@/components/Modals/ShopViewDetailModal";
import Pagination from "@/components/Pagination";
import { DEFAULT_PAGINATION } from "@/utils/helper";

export default function AdminShopOwnersPage() {
  const t = useTranslations("AdminPages.shopOwners");
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [updatingShop, setUpdatingShop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    type: ""
  });
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchShops = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      });

      if (debouncedSearchQuery) {
        params.append("search", debouncedSearchQuery);
      }

      if (filters.status) {
        params.append("status", filters.status);
      }

      if (filters.type) {
        params.append("type", filters.type);
      }

      const response = await fetch(`/api/shops?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: data.pagination.totalPages,
            total: data.pagination.total
          }));
        }
      } else {
        toast.error("Failed to fetch shops");
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to fetch shops");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page: page }));
  };

  const handleStatusChange = (shop, status) => {
    setSelectedShop(shop);
    setNewStatus(status);
    setShowModal(true);
  };

  const handleViewShop = (shopId) => {
    setSelectedShopId(shopId);
    setShowViewModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedShop || !newStatus) return;

    try {
      setUpdatingShop(selectedShop.id);
      const response = await fetch('/api/shops', {
        method: 'PATCH',
        body: JSON.stringify({ shopId: selectedShop.id, status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Update the shop in the local state
        setShops(prevShops => 
          prevShops.map(shop => 
            shop.id === selectedShop.id 
              ? { ...shop, status: newStatus }
              : shop
          )
        );
        setShowModal(false);
        setSelectedShop(null);
        setNewStatus("");
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update shop status');
      }
    } catch (error) {
      console.error('Error updating shop status:', error);
      toast.error('Failed to update shop status');
    } finally {
      setUpdatingShop(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedShop(null);
    setNewStatus("");
  };


  return (
    <>
      <div className="pagetitle">
        <h1>Shops/ Restaurants</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/admin-dashboard">Home</Link>
            </li>
            <li className="breadcrumb-item">Shops/ Restaurants</li>
          </ol>
        </nav>
      </div>

      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">Shops/ Restaurants</h5>
                </div>

                {/* Search and Filters */}
                <div className="row mb-3">
                  <div className="col-md-4">
                    <div className="search-bar">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search shops..."
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                    >
                      <option value="">Filter by Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={filters.type}
                      onChange={(e) => handleFilterChange("type", e.target.value)}
                    >
                      <option value="">Filter by Type</option>
                      <option value="shop">Shop</option>
                      <option value="restaurant">Restaurant</option>
                    </select>
                  </div>
                </div>

                <div
                  className={`${isLoading || shops.length === 0
                    ? "d-flex justify-content-center align-items-center"
                    : ""
                    }`}
                  style={{ minHeight: isLoading || shops.length === 0 ? '400px' : 'auto' }}
                >
                {isLoading ? (
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : shops && shops?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Shop</th>
                          <th>Type</th>
                          <th>Owner</th>
                          <th>Status</th>
                          <th>Products</th>
                          <th>Created</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shops.map((shop) => (
                          <tr key={shop.id}>
                            <td className="align-middle">
                              <div className="d-flex align-items-center">
                                {shop.image ? (
                                  <img
                                    src={getFileUrl(shop.image)}
                                    alt={shop.name}
                                    className="rounded me-3"
                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`rounded me-3 d-flex align-items-center justify-content-center ${
                                    shop.image ? 'd-none' : 'd-flex'
                                  }`}
                                  style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    backgroundColor: '#f8f9fa',
                                    fontSize: '18px',
                                    color: '#6c757d'
                                  }}
                                >
                                  <i className="bi bi-shop"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">{shop.name}</h6>
                                </div>
                              </div>
                            </td>
                            <td className="align-middle">
                              <span className={`badge ${shop.type === 'restaurant' ? 'bg-info' : 'bg-secondary'}`}>
                                {shop.type === 'restaurant' ? 'Restaurant' : 'Shop'}
                              </span>
                            </td>
                            <td className="align-middle">
                              <div>
                                <strong>
                                  {shop.createdBy?.firstName} {shop.createdBy?.lastName}
                                </strong>
                              </div>
                            </td>
                            <td className="align-middle">
                              {getShopStatusBadge(shop.status)}
                            </td>
                            <td className="align-middle">
                              <span className="badge badge-custom-sm bg-primary capitalize p-2 text-[14px] text-center text-white">
                                {shop._count?.products || 0} products
                              </span>
                            </td>
                            <td className="align-middle">
                                {fullDateFormate(shop.createdAt)}
                            </td>
                            <td className="align-middle">
                              <div className="d-flex align-items-center gap-3 justify-content-center">
                                {/* View Shop Icon */}
                                <span
                                  title="View Shop Details"
                                  className="text-primary text-[18px] cursor-pointer"
                                  onClick={() => handleViewShop(shop.id)}
                                >
                                  <i className="bi bi-eye-fill"></i>
                                </span>

                                {/* Status Change Icons */}
                                {shop.status === 'inactive' && (
                                  <span
                                    title="Activate Shop"
                                    className="text-danger text-[18px] cursor-pointer"
                                    onClick={() => handleStatusChange(shop, 'active')}
                                  >
                                    <i className="bi bi-x-circle-fill"></i>
                                  </span>
                                )}
                                {shop.status === 'active' && (
                                  <span
                                    title="Deactivate Shop"
                                    className="text-success text-[18px] cursor-pointer"
                                    onClick={() => handleStatusChange(shop, 'inactive')}
                                  >
                                    <i className="bi bi-check-circle-fill"></i>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No shops found</p>
                  </div>
                )}
                </div>

                {/* Pagination */}
                {!isLoading && shops.length > 0 && (
                  <div className="mt-4 w-fit ms-auto">
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

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {newStatus === 'active' ? 'Activate Shop' : 'Deactivate Shop'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={updatingShop === selectedShop?.id}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to{' '}
                  <strong className={newStatus === 'active' ? 'text-success' : 'text-danger'}>
                    {newStatus === 'active' ? 'activate' : 'deactivate'}
                  </strong>{' '}
                  the shop <strong>{selectedShop?.name}</strong>?
                </p>
                {newStatus === 'active' && (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    This will make the shop and its products visible to customers.
                  </div>
                )}
                {newStatus === 'inactive' && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    This will hide the shop and its products from customers.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={updatingShop === selectedShop?.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${newStatus === 'active' ? 'btn-success' : 'btn-danger'}`}
                  onClick={confirmStatusUpdate}
                  disabled={updatingShop === selectedShop?.id}
                >
                  {updatingShop === selectedShop?.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`bi ${newStatus === 'active' ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                      {newStatus === 'active' ? 'Activate' : 'Deactivate'} Shop
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showModal && <div className="modal-backdrop fade show"></div>}

      {/* Shop View Detail Modal */}
      <ShopViewDetailModal
        shopId={selectedShopId}
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
      />
    </>
  );
}
