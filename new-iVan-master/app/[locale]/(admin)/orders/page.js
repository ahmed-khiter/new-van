"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getFileUrl, calculateOrderTotalPrice, formatAmountToCurrency, truncateId, formatDistanceToNow } from "@/utils/helper";
import OrderDetailModal from "@/components/Modals/OrderDetailModal";

export default function AdminOrdersPage() {
    const t = useTranslations("AdminPages.orders");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        products: [],
        visitors: []
    });
    const [filters, setFilters] = useState({
        status: "all",
        deliveryStatus: "all",
        productId: "",
        customerId: "",
        dateFrom: "",
        dateTo: ""
    });
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        paidOrders: 0,
        completedOrders: 0
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [autoOpenRequest, setAutoOpenRequest] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        try {
            // Only show full loading on initial load, use filtering indicator for subsequent loads
            if (orders.length === 0) {
                setLoading(true);
            } else {
                setIsFiltering(true);
            }
            
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "all") {
                    params.append(key, value);
                }
            });

            const response = await fetch(`/api/orders?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
                setFilterOptions(data.filterOptions || { products: [], visitors: [] });
                setStats(data.stats || {
                    totalOrders: 0,
                    pendingOrders: 0,
                    paidOrders: 0,
                    completedOrders: 0
                });
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
            setIsFiltering(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setAutoOpenRequest(false);
        setShowOrderModal(true);
    };

    const handleSendRequest = (order) => {
        setSelectedOrder(order);
        console.log(order);
        setAutoOpenRequest(true);
        setShowOrderModal(true);
    };

    const handleCloseOrderModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
        setAutoOpenRequest(false);
    };

    const handleOrderUpdated = (orderId, updates) => {
        setOrders(prev => prev.map(order => order.id === orderId ? { ...order, ...updates } : order));
        setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, ...updates } : prev);
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            pending: "bg-warning",
            paid: "bg-success",
            completed: "bg-info",
            cancelled: "bg-danger"
        };
        return (
            <span className={`badge ${statusClasses[status] || 'bg-secondary'} capitalize`}>
                {status}
            </span>
        );
    };

    const getDeliveryStatusBadge = (deliveryStatus) => {
        if (!deliveryStatus) return <span className="badge bg-secondary">-</span>;
        const normalized = deliveryStatus.replace(/_/g, " ");
        const statusClasses = {
            ready_to_dispatch: "bg-warning",
            waiting_for_provider: "bg-primary",
            dispatched: "bg-info",
            delivered: "bg-success",
            cancelled: "bg-danger"
        };
        return (
            <span className={`badge ${statusClasses[deliveryStatus] || 'bg-secondary'} capitalize`}>
                {normalized}
            </span>
        );
    };

    const canSendRequest = (order) => {
        return order.status === 'paid' && order.deliveryStatus === 'ready_to_dispatch';
    };


    return (
        <div className="pagetitle">
            <h1>Product Orders</h1>
            <nav>
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <a href="/admin-dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">Orders</li>
                </ol>
            </nav>

            {/* Stats Cards */}
            <div className="feature-box-container row mb-4">
                <div className="col-md-3">
                    <div className="feature-box bg-white p-4 d-flex gap-2">
                        <div className="feature-details">
                            <span className="feature-title fw-bold d-block">
                                Total Orders
                            </span>
                            <span className="feature-count mt-1 fw-bold d-block">
                                {stats.totalOrders}
                            </span>
                        </div>
                        <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                            <i className="bi bi-cart" />
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="feature-box bg-white p-4 d-flex gap-2">
                        <div className="feature-details">
                            <span className="feature-title fw-bold d-block">
                                Pending Orders
                            </span>
                            <span className="feature-count mt-1 fw-bold d-block">
                                {stats.pendingOrders}
                            </span>
                        </div>
                        <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                            <i className="bi bi-clock" />
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="feature-box bg-white p-4 d-flex gap-2">
                        <div className="feature-details">
                            <span className="feature-title fw-bold d-block">
                                Paid Orders
                            </span>
                            <span className="feature-count mt-1 fw-bold d-block">
                                {stats.paidOrders}
                            </span>
                        </div>
                        <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                            <i className="bi bi-check-circle" />
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="feature-box bg-white p-4 d-flex gap-2">
                        <div className="feature-details">
                            <span className="feature-title fw-bold d-block">
                                Completed Orders
                            </span>
                            <span className="feature-count mt-1 fw-bold d-block">
                                {stats.completedOrders}
                            </span>
                        </div>
                        <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                            <i className="bi bi-check2-all" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="card-body !pt-[20px] overflow-auto">
                    <div className="row g-3">
                        <div className="col-md-2">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">Delivery Status</label>
                            <select
                                className="form-select"
                                value={filters.deliveryStatus}
                                onChange={(e) => handleFilterChange("deliveryStatus", e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="ready_to_dispatch">Ready to Dispatch</option>
                                <option value="waiting_for_provider">Waiting for Provider</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Product</label>
                            <select
                                className="form-select"
                                value={filters.productId}
                                onChange={(e) => handleFilterChange("productId", e.target.value)}
                            >
                                <option value="">All Products</option>
                                {filterOptions.products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Customer</label>
                            <select
                                className="form-select"
                                value={filters.customerId}
                                onChange={(e) => handleFilterChange("customerId", e.target.value)}
                            >
                                <option value="">All Customers</option>
                                {filterOptions.visitors.map(visitor => (
                                    <option key={visitor.id} value={visitor.id}>
                                        {visitor.firstName} {visitor.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">From Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">To Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                            />
                        </div>

                        <div className="col-md-1 d-flex align-items-end">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setFilters({
                                        status: "all",
                                        deliveryStatus: "all",
                                        productId: "",
                                        customerId: "",
                                        dateFrom: "",
                                        dateTo: ""
                                    });
                                }}
                                style={{ height: '38px' }}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card">
                    <div className="card-body !pt-[20px] overflow-auto">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Total Price</th>
                                    <th>Payment Status</th>
                                    <th>Delivery Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading || isFiltering ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <div className="d-flex flex-column align-items-center">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">
                                                        {loading ? 'Loading...' : 'Filtering...'}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-muted mb-0">
                                                    {loading ? 'Loading orders...' : 'Applying filters...'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.length > 0 ? (
                                    orders.map((order , orderIdx) => {
                                        const { cart, user, id, totalCartPrice, deliveryPrice, status, createdAt, deliveryStatus } = order;
                                        const cartItems = cart?.cartItems || [];
                                        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                                        
                                        return (
                                        <tr key={orderIdx}>
                                        <td className="align-middle">
                                            <code>{truncateId(id)}</code>
                                        </td>
                                        <td className="align-middle">
                                            <div>
                                                <div className="fw-bold">
                                                    {user?.firstName} {user?.lastName}
                                                </div>
                                                <small className="text-muted">{user?.email}</small>
                                            </div>
                                        </td>
                                        <td className="align-middle">
                                            <strong className="text-success">
                                                {formatAmountToCurrency(calculateOrderTotalPrice(totalCartPrice, deliveryPrice))}
                                            </strong>
                                        </td>
                                        <td className="align-middle">
                                            {getStatusBadge(status)}
                                        </td>
                                        <td className="align-middle">
                                            {getDeliveryStatusBadge(deliveryStatus)}
                                        </td>
                                        <td className="align-middle">
                                            <div>
                                                {new Date(createdAt).toLocaleDateString()}
                                            </div>
                                            <small className="text-muted">
                                                {formatDistanceToNow(createdAt)}
                                            </small>
                                        </td>
                                        <td className="align-middle">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => handleViewOrder(order)}
                                                title="View Order Details"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                onClick={() => handleSendRequest(order)}
                                                disabled={!canSendRequest(order)}
                                                title="Send Request to Providers"
                                            >
                                                <i className="bi bi-send"></i>
                                            </button>
                                        </td>
                                    </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <div className="d-flex flex-column align-items-center">
                                                <i className="bi bi-cart-x text-muted text-3xl"></i>
                                                <h6 className="mt-2 text-muted mb-0">No Orders Found</h6>
                                                <p className="text-muted mb-0">No orders match your current filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            <OrderDetailModal
                show={showOrderModal}
                onHide={handleCloseOrderModal}
                order={selectedOrder}
                onOrderUpdated={handleOrderUpdated}
                initialRequestMode={autoOpenRequest}
            />
        </div>
    );
}
