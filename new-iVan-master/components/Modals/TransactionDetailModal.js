"use client";
import { Modal, Badge } from "react-bootstrap";
import { getStatusBadge, calculateOrderTotalPrice, formatAmountToCurrency, getServiceName, truncateId, formatDistanceToNow } from "@/utils/helper";

export default function TransactionDetailModal({ show, onHide, transaction }) {
    if (!transaction) return null;

    const getTransactionTypeBadge = (type) => {
        const typeClasses = {
            payment: "bg-success",
            transfer: "bg-info",
            refund: "bg-warning"
        };
        const displayType = type || "unknown";
        return (
            <Badge className={typeClasses[type] || 'bg-secondary capitalize'}>
                {displayType}
            </Badge>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Transaction Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-6">
                        <h6 className="fw-bold mb-3">Transaction Information</h6>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Transaction ID:</label>
                            <p className="mb-0">
                                <code>{truncateId(transaction.transaction_id) || "N/A"}</code>
                            </p>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Type:</label>
                            <p className="mb-0">
                                {getTransactionTypeBadge(transaction.type)}
                            </p>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Amount:</label>
                            <p className="mb-0">
                                <strong className={transaction.type === "payment" ? "text-success" : transaction.type === "transfer" ? "text-danger" : "text-warning"}>
                                    {transaction.type === "payment" ? "+" : "-"}{transaction.amount ? formatAmountToCurrency(parseFloat(transaction.amount)) : formatAmountToCurrency(0)}
                                </strong>
                            </p>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Date:</label>
                            <p className="mb-0">
                                {transaction.date ? new Date(transaction.date).toLocaleDateString() : "N/A"}
                                <br />
                                <small className="text-muted">
                                    {transaction.date ? formatDistanceToNow(transaction.date) : "N/A"}
                                </small>
                            </p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <h6 className="fw-bold mb-3">User Information</h6>
                        {transaction.sender ? (
                            <>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Name:</label>
                                    <p className="mb-0 capitalize">
                                        {transaction.sender.firstName || ""} {transaction.sender.lastName || ""}
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Email:</label>
                                    <p className="mb-0">{transaction.sender.email || "N/A"}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Role:</label>
                                    <p className="mb-0 capitalize">{transaction.sender.role || "N/A"}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted">No user information available</p>
                        )}
                    </div>
                </div>

                {/* Job Details */}
                {transaction.job && (
                    <div className="mt-4">
                        <h6 className="fw-bold mb-3">Job Details</h6>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Title:</label>
                                    <p className="mb-0">{transaction.job.title || "N/A"}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Category:</label>
                                    <p className="mb-0">{getServiceName(transaction.job.category) || "N/A"}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Status:</label>
                                    <p className="mb-0">
                                        {getStatusBadge(transaction.job.status)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Details  */}
                {transaction.order && (
                    <div className="mt-4">
                        <h6 className="fw-bold mb-3">Product Order Details</h6>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Order ID:</label>
                                    <p className="mb-0">
                                        <code>{truncateId(transaction.order.id) || "N/A"}</code>
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Products:</label>
                                    <div className="mb-0">
                                        {transaction.order.cart?.cartItems?.length > 0 ? (
                                            <div>
                                                {transaction.order.cart.cartItems.map((item, index) => (
                                                    <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                                                        <span>{item.product?.name || "N/A"} x {item.quantity}</span>
                                                        <span className="text-muted">
                                                            {formatAmountToCurrency(Number(item.product?.price || 0) * item.quantity)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {transaction.order.cart.cartItems.length > 1 && (
                                                    <small className="text-muted">
                                                        {transaction.order.cart.cartItems.length} different products
                                                    </small>
                                                )}
                                            </div>
                                        ) : (
                                            <span>N/A</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Total Cart Price:</label>
                                    <p className="mb-0">{transaction.order.totalCartPrice ? formatAmountToCurrency(parseFloat(transaction.order.totalCartPrice)) : formatAmountToCurrency(0)}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Delivery Price:</label>
                                    <p className="mb-0">{transaction.order.deliveryPrice ? formatAmountToCurrency(parseFloat(transaction.order.deliveryPrice)) : formatAmountToCurrency(0)}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Total Price:</label>
                                    <p className="mb-0">{formatAmountToCurrency(calculateOrderTotalPrice(transaction.order.totalCartPrice, transaction.order.deliveryPrice))}</p>
                                </div>
                            </div>
                        </div>
                        {transaction.order.deliveryAddress && (
                            <div className="mt-3">
                                <label className="form-label fw-semibold">Delivery Address:</label>
                                <p className="mb-0">
                                    {transaction.order.deliveryAddress}
                                    {transaction.order.deliveryCity && `, ${transaction.order.deliveryCity}`}
                                    {transaction.order.deliveryPostCode && `, ${transaction.order.deliveryPostCode}`}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Plan Details */}
                {transaction.plan && (
                    <div className="mt-4">
                        <h6 className="fw-bold mb-3">Subscription Details</h6>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Plan Name:</label>
                                    <p className="mb-0">{transaction.plan.name || "N/A"}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Plan Price:</label>
                                    <p className="mb-0">{transaction.plan.price ? formatAmountToCurrency(parseFloat(transaction.plan.price)) : formatAmountToCurrency(0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Information */}
                <div className="mt-4">
                    <h6 className="fw-bold mb-3">Additional Information</h6>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Description:</label>
                        <p className="mb-0">
                            {transaction.job ? (
                                <span>Job Payment - {transaction.job.title}</span>
                            ) : transaction.order ? (
                                <span>Cart Order Payment - {transaction.order.cart?.cartItems?.length || 0} products</span>
                            ) : transaction.plan ? (
                                <span>Subscription Payment - {transaction.plan.name}</span>
                            ) : (
                                <span>Other Payment</span>
                            )}
                        </p>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button type="button" className="btn btn-secondary" onClick={onHide}>
                    Close
                </button>
            </Modal.Footer>
        </Modal>
    );
}
