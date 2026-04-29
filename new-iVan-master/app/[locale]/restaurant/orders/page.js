"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getFileUrl, formatAmountToCurrency, truncateId, formatDistanceToNow } from "@/utils/helper";
import OrderDetailModal from "@/components/Modals/OrderDetailModal";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import toast from "react-hot-toast";

export default function RestaurantOrdersPage() {
    const t = useTranslations("RestaurantOrdersPage");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [filters, setFilters] = useState({
        status: "all",
        deliveryStatus: "all",
        dateFrom: "",
        dateTo: ""
    });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [orderToConfirm, setOrderToConfirm] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        paidOrders: 0,
        completedOrders: 0,
        confirmedDeliveries: 0,
        inTransitDeliveries: 0,
        deliveredOrders: 0
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        try {
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
                setStats(data.stats || {
                    totalOrders: 0,
                    pendingOrders: 0,
                    paidOrders: 0,
                    completedOrders: 0,
                    confirmedDeliveries: 0,
                    inTransitDeliveries: 0,
                    deliveredOrders: 0
                });
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to fetch orders");
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
        setShowOrderModal(true);
    };

    const handleCloseOrderModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
    };

    const handleConfirmOrder = async () => {
        if (!orderToConfirm) return;

        setIsConfirming(true);
        try {
            const response = await fetch(`/api/orders/${orderToConfirm.id}/confirm`, {
                method: 'POST'
            });

            if (response.ok) {
                toast.success('Order confirmed successfully');
                fetchOrders();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to confirm order');
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            toast.error('Failed to confirm order');
        } finally {
            setIsConfirming(false);
            setShowConfirmModal(false);
            setOrderToConfirm(null);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            pending: 'bg-warning',
            paid: 'bg-info',
            completed: 'bg-success',
            cancelled: 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    };

    const getDeliveryStatusBadgeClass = (status) => {
        const statusClasses = {
            pending: 'bg-secondary',
            confirmed: 'bg-primary',
            assigned: 'bg-info',
            'in-transit': 'bg-warning',
            delivered: 'bg-success',
            cancelled: 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    };

    if (loading) {
        return (
            <div className="pagetitle">
                <h1>Orders</h1>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="pagetitle">
                <h1>Orders</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <a href="/restaurant/dashboard">Home</a>
                        </li>
                        <li className="breadcrumb-item active">Orders</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
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
                                    Pending
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
                                    Paid
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
                                    Delivered
                                </span>
                                <span className="feature-count mt-1 fw-bold d-block">
                                    {stats.deliveredOrders}
                                </span>
                            </div>
                            <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                                <i className="bi bi-check2-all" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">All Orders</h5>

                                {/* Filters */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <select
                                            className="form-select"
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange("status", e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <select
                                            className="form-select"
                                            value={filters.deliveryStatus}
                                            onChange={(e) => handleFilterChange("deliveryStatus", e.target.value)}
                                        >
                                            <option value="all">All Delivery Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="assigned">Assigned</option>
                                            <option value="in-transit">In Transit</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={filters.dateFrom}
                                            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={filters.dateTo}
                                            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <button
                                            className="btn btn-outline-secondary w-100"
                                            onClick={() => setFilters({ status: "all", deliveryStatus: "all", dateFrom: "", dateTo: "" })}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* Orders Table */}
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Customer</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Delivery Status</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isFiltering ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">
                                                        <div className="spinner-border text-primary" role="status">
                                                            <span className="visually-hidden">Filtering...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">
                                                        <p className="text-muted">No orders found</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                orders.map((order) => {
                                                    const itemCount = order.cart?.cartItems?.length || 0;
                                                    const totalPrice = order.totalCartPrice || 0;
                                                    
                                                    return (
                                                        <tr key={order.id}>
                                                            <td>{truncateId(order.id)}</td>
                                                            <td>
                                                                {order.user ? (
                                                                    `${order.user.firstName} ${order.user.lastName || ''}`.trim()
                                                                ) : 'N/A'}
                                                            </td>
                                                            <td>{itemCount} item(s)</td>
                                                            <td>{formatAmountToCurrency(Number(totalPrice))}</td>
                                                            <td>
                                                                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getDeliveryStatusBadgeClass(order.deliveryStatus)}`}>
                                                                    {order.deliveryStatus || 'pending'}
                                                                </span>
                                                            </td>
                                                            <td>{formatDistanceToNow(order.createdAt)}</td>
                                                            <td>
                                                                <div className="d-flex gap-1">
                                                                <button
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleViewOrder(order)}
                                                                        title="View Order Details"
                                                                    >
                                                                        <i className="bi bi-eye"></i>
                                                                    </button>
                                                                    {order.status === 'paid' && order.deliveryStatus === 'ready_to_dispatch' && (
                                                                        <button
                                                                            className="btn btn-sm btn-success"
                                                                            onClick={() => {
                                                                                setOrderToConfirm(order);
                                                                                setShowConfirmModal(true);
                                                                            }}
                                                                            title="Confirm Order"
                                                                            disabled={isConfirming}
                                                                        >
                                                                            <i className="bi bi-check-circle"></i>
                                                                        </button>
                                                                    )}
                                                                   
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    show={showOrderModal}
                    onHide={handleCloseOrderModal}
                    order={selectedOrder}
                />
            )}

            {/* Confirm Order Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setOrderToConfirm(null);
                }}
                handleConfirm={handleConfirmOrder}
                alertMessage={`Are you sure you want to confirm this order? This will notify delivery providers.`}
                isLoading={isConfirming}
            />
        </>
    );
}

