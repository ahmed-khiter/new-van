"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getFileUrl } from '@/utils/helper';

export default function ReservationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations('ReservationPage');
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'visitor') {
      router.push('/');
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
        router.push('/customer/reservations');
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
      toast.error('Failed to load reservation details.');
      router.push('/customer/reservations');
    } finally {
      setIsLoading(false);
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

  const handleCancelReservation = async () => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await fetch(`/api/reservations/${id}/cancel`, {
        method: 'POST',
        headers: {
          'user-id': session.user.id,
          'role': session.user.role
        }
      });

      if (response.ok) {
        toast.success('Reservation cancelled successfully.');
        fetchReservation(); // Refresh the reservation data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to cancel reservation.');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Failed to cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
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
            {/* <li className="breadcrumb-item">
              <Link href="/customer/dashboard">Home</Link>
            </li> */}
            <li className="breadcrumb-item">
              <Link href="/customer/reservations">Reservations</Link>
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
                  <div className="d-flex align-items-center gap-3">
                    {reservation.restaurant?.image && (
                      <img
                        src={getFileUrl(reservation.restaurant.image)}
                        alt={reservation.restaurant.name}
                        className="rounded"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <h3 className="card-title mb-1">{reservation.restaurant?.name || 'Restaurant'}</h3>
                      <p className="text-muted mb-0">Reservation ID: #{reservation.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(reservation.status)}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                    {reservation.status}
                  </span>
                </div>

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
                        {reservation.status === 'accepted' && (
                          <small className="text-success">(Will be deducted from your bill)</small>
                        )}
                        {reservation.status === 'rejected' && reservation.depositRefunded && (
                          <small className="text-info">(Refunded to your payment method)</small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Information */}
                {reservation.restaurant && (
                  <div className="border-top pt-4 mb-4">
                    <h5 className="mb-3">Restaurant Information</h5>
                    <div className="row">
                      {reservation.restaurant.address1 && (
                        <div className="col-md-6 mb-3">
                          <p className="mb-1 text-muted small">
                            <i className="bi bi-geo-alt me-2"></i>Address
                          </p>
                          <p className="mb-0 fw-bold">
                            {reservation.restaurant.address1}
                            {reservation.restaurant.address2 && <br />}
                            {reservation.restaurant.address2}
                            {reservation.restaurant.city && <br />}
                            {reservation.restaurant.city}
                            {reservation.restaurant.postCode && `, ${reservation.restaurant.postCode}`}
                          </p>
                        </div>
                      )}
                      {reservation.restaurant.phone && (
                        <div className="col-md-6 mb-3">
                          <p className="mb-1 text-muted small">
                            <i className="bi bi-telephone me-2"></i>Phone
                          </p>
                          <p className="mb-0 fw-bold">
                            <a href={`tel:${reservation.restaurant.phone}`} className="text-decoration-none">
                              {reservation.restaurant.phone}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div className="border-top pt-4 mb-4">
                  <h5 className="mb-3">Your Information</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <p className="mb-1 text-muted small">Name</p>
                      <p className="mb-0 fw-bold fw-bold">{reservation.customerName}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <p className="mb-1 text-muted small">Email</p>
                      <p className="mb-0 fw-bold">{reservation.customerEmail}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <p className="mb-1 text-muted small">Phone</p>
                      <p className="mb-0 fw-bold">{reservation.customerPhone}</p>
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
                    <strong>Pending Approval:</strong> Your reservation is waiting for confirmation from the restaurant. 
                    You will receive an email once it's been reviewed.
                  </div>
                )}

                {reservation.status === 'accepted' && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Confirmed!</strong> Your reservation has been accepted. 
                    Please arrive on time. Your £{Number(reservation.depositAmount).toFixed(2)} deposit will be deducted from your final bill.
                  </div>
                )}

                {reservation.status === 'rejected' && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-x-circle me-2"></i>
                    <strong>Reservation Rejected:</strong> Unfortunately, the restaurant was unable to accommodate your reservation.
                    {reservation.depositRefunded && ' Your deposit has been refunded to your original payment method.'}
                  </div>
                )}

                {reservation.status === 'completed' && (
                  <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Completed:</strong> This reservation has been completed. We hope you enjoyed your dining experience!
                  </div>
                )}

                {reservation.status === 'cancelled' && (
                  <div className="alert alert-secondary" role="alert">
                    <i className="bi bi-x-circle me-2"></i>
                    <strong>Cancelled:</strong> This reservation has been cancelled.
                  </div>
                )}

                {/* Cancel Button - Only show for pending or accepted reservations */}
                {(reservation.status === 'pending' || reservation.status === 'accepted') && (
                  <div className="border-top pt-4">
                    <button
                      onClick={handleCancelReservation}
                      disabled={isCancelling}
                      className="btn btn-danger"
                      style={{ 
                        backgroundColor: '#dc3545', 
                        borderColor: '#dc3545',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {isCancelling ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-x-circle me-2"></i>
                          Cancel Reservation
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

