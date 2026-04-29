"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getFileUrl } from '@/utils/helper';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';

export default function RestaurantReservationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations('ReservationPage');
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'restaurant') {
      router.push('/login');
      return;
    }

    fetchReservation();
  }, [id, session, status, router]);

  const fetchReservation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reservations/${id}`, {
        headers: {
          'user-id': session.user.id,
          'role': session.user.role
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReservation(data.reservation);
      } else {
        toast.error('Failed to load reservation details.');
        router.push('/restaurant/reservations');
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
      toast.error('Failed to load reservation details.');
      router.push('/restaurant/reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/reservations/${id}/accept`, {
        method: 'POST',
        headers: {
          'user-id': session.user.id,
          'role': session.user.role
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reservation accepted successfully.');
        setActionType(null);
        fetchReservation();
      } else {
        toast.error(data.error || 'Failed to accept reservation.');
      }
    } catch (error) {
      console.error('Error accepting reservation:', error);
      toast.error('Failed to accept reservation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/reservations/${id}/reject`, {
        method: 'POST',
        headers: {
          'user-id': session.user.id,
          'role': session.user.role
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reservation rejected.');
        setActionType(null);
        fetchReservation();
      } else {
        toast.error(data.error || 'Failed to reject reservation.');
      }
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      toast.error('Failed to reject reservation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'bg-warning',
      accepted: 'bg-success',
      rejected: 'bg-danger',
      completed: 'bg-info',
      cancelled: 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="pagetitle">
        <h1>Reservation Details</h1>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <>
      <div className="pagetitle">
        <h1>Reservation Details</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/restaurant/dashboard">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/restaurant/reservations">Reservations</Link>
            </li>
            <li className="breadcrumb-item active">Details</li>
          </ol>
        </nav>
      </div>

      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-body">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="card-title mb-1">{reservation.customerName}</h3>
                    <p className="text-muted mb-0">Reservation ID: #{reservation.id.slice(0, 8)}</p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(reservation.status)}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                    {reservation.status}
                  </span>
                </div>

                {/* Action Buttons */}
                {reservation.status === 'pending' && (
                  <div className="mb-4">
                    <button
                      className="btn btn-success me-2"
                      onClick={() => setActionType('accept')}
                      disabled={isProcessing}
                    >
                      <i className="bi bi-check-lg me-1"></i>
                      Accept
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => setActionType('reject')}
                      disabled={isProcessing}
                    >
                      <i className="bi bi-x-lg me-1"></i>
                      Reject
                    </button>
                  </div>
                )}

                {/* Reservation Details */}
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar3 text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div>
                        <p className="mb-0 text-muted small">Date</p>
                        <p className="mb-0 fw-bold">{formatDate(reservation.reservationDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-clock text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div>
                        <p className="mb-0 text-muted small">Time</p>
                        <p className="mb-0 fw-bold">{reservation.reservationTime}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-people text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div>
                        <p className="mb-0 text-muted small">Number of Guests</p>
                        <p className="mb-0 fw-bold">{reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'Guest' : 'Guests'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-currency-pound text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div>
                        <p className="mb-0 text-muted small">Deposit</p>
                        <p className="mb-0 fw-bold">£{Number(reservation.depositAmount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border-top pt-4 mb-4">
                  <h5 className="mb-3">Customer Information</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <p className="mb-1 text-muted small">Name</p>
                      <p className="mb-0 fw-bold">{reservation.customerName}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <p className="mb-1 text-muted small">Email</p>
                      <p className="mb-0">
                        <a href={`mailto:${reservation.customerEmail}`} className="text-decoration-none">
                          {reservation.customerEmail}
                        </a>
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <p className="mb-1 text-muted small">Phone</p>
                      <p className="mb-0">
                        <a href={`tel:${reservation.customerPhone}`} className="text-decoration-none">
                          {reservation.customerPhone}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {reservation.notes && (
                  <div className="border-top pt-4 mb-4">
                    <h5 className="mb-3">Special Requests</h5>
                    <div className="bg-light p-3 rounded">
                      <p className="mb-0">{reservation.notes}</p>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {reservation.status === 'pending' && (
                  <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Action Required:</strong> Please review and accept or reject this reservation request.
                  </div>
                )}

                {reservation.status === 'accepted' && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Confirmed:</strong> This reservation has been accepted. The customer has been notified via email.
                  </div>
                )}

                {reservation.status === 'rejected' && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-x-circle me-2"></i>
                    <strong>Rejected:</strong> This reservation has been rejected.
                    {reservation.depositRefunded && ' The refund has been processed.'}
                  </div>
                )}

                {reservation.status === 'completed' && (
                  <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Completed:</strong> This reservation has been completed.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        handleConfirm={actionType === 'accept' ? handleAccept : handleReject}
        alertMessage={actionType === 'accept' ? 'Accept Reservation' : 'Reject Reservation'}
        description={
          actionType === 'accept'
            ? `Are you sure you want to accept this reservation for ${reservation?.customerName} on ${reservation ? formatDate(reservation.reservationDate) : ''} at ${reservation?.reservationTime}?`
            : `Are you sure you want to reject this reservation?`
        }
      />
    </>
  );
}

