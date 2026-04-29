'use client'
import { Modal } from "react-bootstrap";

const ConfirmationModal = ({
    isOpen,
    onClose,
    handleConfirm,
    alertMessage,
    description,
}) => {
    return (
        <Modal
            size="md"
            show={isOpen}
            onHide={onClose}
            aria-labelledby="confirmation-modal"
            centered
        >
            <div className="p-4">
                <Modal.Body className="text-center">
                    <h4 className="fw-bold mb-3">
                        {alertMessage || "Are you sure?"}
                    </h4>


                    {description && (
                        <p className="text-muted small mb-0">{description}</p>
                    )}
                </Modal.Body>

                <Modal.Footer className="d-flex justify-content-center gap-2 border-0">
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                    >
                        Yes
                    </button>
                </Modal.Footer>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
