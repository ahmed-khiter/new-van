"use client";
import { useState, useEffect, useMemo } from "react";
import { Modal } from "react-bootstrap";
import { getFileUrl, formatAmountToCurrency, fullDateFormate } from "@/utils/helper";
import ConfirmationModal from "./ConfirmationModal";
import toast from "react-hot-toast";

export default function OrderDetailModal({ show, onHide, order, onOrderUpdated }) {
  if (!order) return null;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(order);
  // vehicle selection is assigned at checkout, no manual selection required here

  const canSendRequest = useMemo(() => {
    const target = currentOrder || order;
    return target?.status === 'paid' && target?.deliveryStatus === 'ready_to_dispatch';
  }, [currentOrder, order]);

  // Update current order when order prop changes
  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    // no-op: job.vanSize is displayed where needed; we don't allow changing vehicle type here
  }, [order]);

  const { cart, user, job, totalCartPrice, deliveryPrice, deliveryAddress, deliveryCity, notes, createdAt, status, deliveryStatus, shopConfirmedAt } = currentOrder || order;
  
  // Calculate total items and subtotal
  const totalItems = cart?.cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subtotal = parseFloat(totalCartPrice) || 0;
  const delivery = parseFloat(deliveryPrice) || 0;
  const total = subtotal + delivery;

  const formattedDeliveryStatus = deliveryStatus ? deliveryStatus.replace(/_/g, " ") : "-";

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Order Details</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="row">
          {/* Order Information */}
          <div className="col-md-6">
            <h6 className="fw-bold mb-3">Order Information</h6>
            <div className="mb-3">
              <strong>Order ID:</strong> 
              <span className="ms-2 text-muted">{(currentOrder || order).id}</span>
            </div>
            <div className="mb-3">
              <strong>Payment Status:</strong>
              <span className={`ms-2 badge capitalize ${
                status === 'paid' ? 'bg-success' : 
                status === 'pending' ? 'bg-warning' : 
                'bg-secondary'
              }`}>
                {status}
              </span>
            </div>
            {deliveryStatus && (
              <div className="mb-3">
                <strong>Delivery Status:</strong>
                <span className={`ms-2 badge capitalize ${
                  deliveryStatus === 'delivered' ? 'bg-success' : 
                  deliveryStatus === 'dispatched' ? 'bg-info' : 
                  deliveryStatus === 'waiting_for_provider' ? 'bg-primary' : 
                  deliveryStatus === 'ready_to_dispatch' ? 'bg-warning' : 
                  (deliveryStatus === 'assigned' || deliveryStatus === 'in-transit') ? 'bg-info' : 
                  deliveryStatus === 'cancelled' ? 'bg-danger' : 
                  'bg-secondary'
                }`}>
                  {formattedDeliveryStatus}
                </span>
              </div>
            )}
            {shopConfirmedAt && (
              <div className="mb-3">
                <strong>Confirmed At:</strong>
                <span className="ms-2 text-muted">{fullDateFormate(shopConfirmedAt)}</span>
              </div>
            )}
            <div className="mb-3">
              <strong>Order Date:</strong>
              <span className="ms-2 text-muted">{fullDateFormate(createdAt)}</span>
            </div>
            {notes && (
              <div className="mb-3">
                <strong>Notes:</strong>
                <span className="ms-2 text-muted">{notes}</span>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="col-md-6">
            <h6 className="fw-bold mb-3">Customer Information</h6>
            <div className="mb-3">
              <strong>Name:</strong>
              <span className="ms-2 text-muted">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="mb-3">
              <strong>Email:</strong>
              <span className="ms-2 text-muted">{user?.email}</span>
            </div>
            <div className="mb-3">
              <strong>Customer ID:</strong>
              <span className="ms-2 text-muted">{user?.id}</span>
            </div>
          </div>
        </div>

        <hr />

        {/* Delivery Information */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Delivery Information</h6>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-2">
                <strong>Address:</strong>
                <span className="ms-2 text-muted">{deliveryAddress}</span>
              </div>
              <div className="mb-2">
                <strong>City:</strong>
                <span className="ms-2 text-muted">{deliveryCity}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-2">
                <strong>Delivery Price:</strong>
                <span className="ms-2 text-muted">{formatAmountToCurrency(deliveryPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {(canSendRequest || deliveryStatus === 'waiting_for_provider') && (
          <div className="mt-4 p-3 border rounded bg-light">
            <h6 className="fw-bold mb-3">Delivery Assignment</h6>
            {deliveryStatus === 'waiting_for_provider' ? (
              <div className="alert alert-info mb-0">
                A delivery request has been sent to providers{job?.vanSize ? ` for ${job.vanSize.replace(/_/g, ' ')}` : ''}. Waiting for a provider to accept.
              </div>
            ) : (
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <button
                    className="btn btn-success"
                    onClick={handleSendProviderRequest}
                    disabled={isRequesting}
                  >
                    {isRequesting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <hr />

        {/* Cart Items */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Order Items ({totalItems} items)</h6>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart?.cartItems?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        {item.product?.image ? (
                          <img
                            src={getFileUrl(item.product.image)}
                            alt={item.product.name}
                            className="rounded me-2"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`rounded me-2 d-flex align-items-center justify-content-center ${
                            item.product?.image ? 'd-none' : 'd-flex'
                          }`}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            backgroundColor: '#f8f9fa',
                            fontSize: '14px',
                            color: '#6c757d'
                          }}
                        >
                          <i className="bi bi-box"></i>
                        </div>
                        <div>
                          <div className="fw-medium">{item.product?.name}</div>
                          {item.metadata?.selectedVariant && (
                            <span className="badge bg-success bg-opacity-10 text-success fw-medium me-1" style={{ fontSize: '11px' }}>
                              {item.product?.variants?.optionName || 'Variant'}: {item.metadata.selectedVariant}
                            </span>
                          )}
                          <small className="text-muted d-block">ID: {item.productId}</small>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle">
                      <span className="badge bg-primary">{item.quantity}</span>
                    </td>
                    <td className="align-middle">
                      {(() => {
                        const sv = item.metadata?.selectedVariant;
                        if (sv && item.product?.variants?.items) {
                          const vi = item.product.variants.items.find(i => i.value === sv);
                          if (vi) return formatAmountToCurrency(vi.salePrice ?? vi.price);
                        }
                        return formatAmountToCurrency(item.product?.price);
                      })()}
                    </td>
                    <td className="align-middle fw-medium">
                      {(() => {
                        let price = parseFloat(item.product?.price || 0);
                        const sv = item.metadata?.selectedVariant;
                        if (sv && item.product?.variants?.items) {
                          const vi = item.product.variants.items.find(i => i.value === sv);
                          if (vi) price = parseFloat(vi.salePrice ?? vi.price);
                        }
                        return formatAmountToCurrency(price * item.quantity);
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <hr />

        {/* Order Summary */}
        <div className="row">
          <div className="col-md-6 offset-md-6">
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal ({totalItems} items):</span>
              <span>{formatAmountToCurrency(subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Delivery:</span>
              <span>{formatAmountToCurrency(delivery)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total:</span>
              <span>{formatAmountToCurrency(total)}</span>
            </div>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
        {/* Show Confirm Order button only for paid orders that haven't been confirmed */}
        {status === 'paid' && (!deliveryStatus || deliveryStatus === 'pending') && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowConfirmModal(true)}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Confirming...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Confirm Order
              </>
            )}
          </button>
        )}
        {/* Show confirmation status if already confirmed */}
        {deliveryStatus === 'confirmed' && (
          <span className="text-success d-flex align-items-center">
            <i className="bi bi-check-circle-fill me-2"></i>
            Order Confirmed
          </span>
        )}
      </Modal.Footer>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        handleConfirm={handleConfirmOrder}
        alertMessage="Confirm Order for Delivery"
        description="Once confirmed, delivery providers will be notified. Are you sure you want to proceed?"
      />
    </Modal>
  );

  async function handleConfirmOrder() {
    setShowConfirmModal(false);
    setIsConfirming(true);

    const orderToConfirm = currentOrder || order;

    try {
      const response = await fetch(`/api/orders/${orderToConfirm.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Order confirmed successfully!');
        
        // Update the order status locally
        setCurrentOrder(prev => ({
          ...prev,
          deliveryStatus: 'confirmed',
          shopConfirmedAt: new Date().toISOString()
        }));

        // Notify parent component
        if (onOrderUpdated) {
          onOrderUpdated(orderToConfirm.id, {
            deliveryStatus: 'waiting_for_provider',
            shopConfirmedAt: new Date().toISOString()
          });
        }
      } else {
        toast.error(data.message || 'Failed to confirm order');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('An error occurred while confirming the order');
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleSendProviderRequest() {
    // vehicle type should be assigned at checkout; backend will use job.vanSize if none provided here

    const orderToRequest = currentOrder || order;
    setIsRequesting(true);

    try {
      const response = await fetch(`/api/orders/request-providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: orderToRequest.id })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Request sent to providers successfully!');

        // Update UI to reflect that a provider request was sent. job.vanSize should already be set at checkout.
        setCurrentOrder(prev => ({
          ...prev,
          deliveryStatus: 'waiting_for_provider'
        }));

        if (onOrderUpdated) {
          onOrderUpdated(orderToRequest.id, {
            deliveryStatus: 'waiting_for_provider'
          });
        }
      } else {
        toast.error(data.message || 'Failed to send provider request');
      }
    } catch (error) {
      console.error('Error sending provider request:', error);
      toast.error('An error occurred while sending the provider request');
    } finally {
      setIsRequesting(false);
    }
  }
}
