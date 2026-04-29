"use client";
import { Modal } from "react-bootstrap";
import { getFileUrl } from "@/utils/helper";
import Image from "next/image";
import ProductImage from "../ProductImage";

const CartResetConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  existingShop,
  existingCartItems,
  newProduct,
  newShop,
}) => {
  return (
    <Modal
      size="lg"
      show={isOpen}
      onHide={onClose}
      aria-labelledby="cart-reset-confirmation-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="cart-reset-confirmation-modal">
          Cart Reset Required
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <p className="text-muted mb-3">
            You already have an active cart from a different shop. You can only
            add products from one shop at a time. Would you like to reset your
            previous cart and add this product?
          </p>
        </div>

        {/* Existing Cart Section */}
        {existingShop && (
          <div className="mb-4 p-3 border rounded">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-cart me-2"></i>
              Current Cart
            </h6>
            <div className="d-flex align-items-start mb-3">
              <ProductImage
                product={existingShop}
                className="!w-20 !h-20 object-cover rounded-lg"
                fallbackClassName="!w-20 !h-20 rounded-lg"
              />
              <div className="flex-grow-1 ms-3">
                <h6 className="mb-1 fw-semibold">{existingShop.name}</h6>
                {existingShop.address && (
                  <p className="text-muted small mb-0">
                    <span className="me-1">📍</span>
                    {existingShop.address}
                    {existingShop.city && `, ${existingShop.city}`}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3">
              <p className="small text-muted mb-2">
                <strong>
                  Products in cart ({existingCartItems?.length || 0}):
                </strong>
              </p>
              <div className="d-flex flex-column gap-2 overflow-y-auto max-h-[200px]">
                {existingCartItems?.map((item, index) => (
                  <div key={index} className="d-flex align-items-center gap-2">
                    <ProductImage
                      product={item}
                      className="!w-16 !h-16 object-cover rounded-lg"
                      fallbackClassName="!w-16 !h-16 rounded-lg"
                    />
                    <div className="flex-grow-1">
                      <p className="small mb-0">{item.name}</p>
                      <p className="small text-muted mb-0">
                        Qty: {item.quantity} × {Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Product Section */}
        {newProduct && newShop && (
          <div className="p-3 border rounded bg-light">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-plus-circle me-2"></i>
              New Product
            </h6>
            <div className="d-flex align-items-start mb-3">
              <ProductImage
                product={newShop}
                className="!w-20 !h-20 object-cover rounded-lg"
                fallbackClassName="!w-20 !h-20 rounded-lg"
              />
              <div className="flex-grow-1 ms-3">
                <h6 className="mb-1 fw-semibold">{newShop.name}</h6>
                {newShop.address && (
                  <p className="text-muted small mb-0">
                    <span className="me-1">📍</span>
                    {newShop.address}
                    {newShop.city && `, ${newShop.city}`}
                  </p>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <ProductImage
                product={newProduct}
                className="!w-16 !h-16 object-cover rounded-lg"
                fallbackClassName="!w-16 !h-16 rounded-lg"
              />
              <div className="flex-grow-1">
                <p className="small mb-0 fw-semibold">{newProduct.name}</p>
                <p className="small text-muted mb-0">
                  {Number(newProduct.price).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-center gap-2">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>
        <button className="btn btn-primary" onClick={onConfirm}>
          Yes, Reset Cart
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default CartResetConfirmationModal;
