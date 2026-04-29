"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function ReservationComponent({ reservationType = null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0
  });

  const fetchReservations = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/reservations?type=customer', {
        headers: {
          'user-id': session.user.id,
          'role': session.user.role
        }
      });

      if (response.ok) {
        const data = await response.json();
        let reservationsData = data.reservations || [];
        
        // Filter by reservation type if provided
        if (reservationType && reservationsData.length > 0) {
          reservationsData = reservationsData.filter(reservation => {
            // Map category names to shop types
            const categoryToTypeMap = {
              'Book a Table': 'restaurant',
              'MOT &  Repairs': 'mot',
              'Shisha lounges': 'shisha',
              'Spa': 'spa',
              'Beauty': 'beauty',
              'Healthcare': 'healthcare',
              'Events': 'events',
              'Entertainment': 'entertainment'
            };
            
            const expectedType = categoryToTypeMap[reservationType];
            return reservation.restaurant?.type === expectedType;
          });
        }
        
        setReservations(reservationsData);
        
        // Calculate stats from filtered reservations
        const filteredStats = {
          total: reservationsData.length,
          pending: reservationsData.filter(r => r.status === 'pending').length,
          accepted: reservationsData.filter(r => r.status === 'accepted').length,
          rejected: reservationsData.filter(r => r.status === 'rejected').length,
          completed: reservationsData.filter(r => r.status === 'completed').length
        };
        
        setStats(filteredStats);
      } else {
        toast.error('Failed to load reservations.');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations.');
    } finally {
      setIsLoading(false);
    }
  }, [session, reservationType]);

  useEffect(() => {
    if (session) {
      fetchReservations();
    }
  }, [session, fetchReservations]);

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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredReservations = filter === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === filter);

  return (
    <div className="section mb-4">
      {/* Stats Cards */}
      {/* <div className="feature-box-container row mb-4 g-4">
              <div className="col-md-3">
                <div className="feature-box bg-white p-4 d-flex gap-2">
                  <div className="feature-details">
                    <span className="feature-title fw-bold d-block">
                      Total Reservations
                    </span>
                    <span className="feature-count mt-1 fw-bold d-block">
                      {stats.total}
                    </span>
                  </div>
                  <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                    <i className="bi bi-calendar-check" />
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="feature-box bg-white p-4 d-flex gap-2">
                  <div className="feature-details">
                    <span className="feature-title fw-bold d-block">Pending</span>
                    <span className="feature-count mt-1 fw-bold d-block">
                      {stats.pending}
                    </span>
                  </div>
                  <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                    <i className="bi bi-clock-history" />
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="feature-box bg-white p-4 d-flex gap-2">
                  <div className="feature-details">
                    <span className="feature-title fw-bold d-block">Accepted</span>
                    <span className="feature-count mt-1 fw-bold d-block">
                      {stats.accepted}
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
                    <span className="feature-title fw-bold d-block">Completed</span>
                    <span className="feature-count mt-1 fw-bold d-block">
                      {stats.completed}
                    </span>
                  </div>
                  <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                    <i className="bi bi-check2-all" />
                  </div>
                </div>
              </div>
            </div> */}

      <div className="row">
        <div className="col-lg-12">
          <div className="card all_resveration_card">
            <div className="card-body">
              <h5 className="card-title">All Reservations</h5>

              {/* Filter Tabs */}
              <ul
                className="nav nav-tabs resveration_nav_tabs border-0"
                role="tablist"
              >
                {["all", "pending", "accepted", "rejected", "completed"].map(
                  (status) => (
                    <li className="nav-item custom_nav_item" key={status}>
                      <button
                        className={`nav-link custom_nav_link ${
                          filter === status ? "active" : ""
                        }`}
                        onClick={() => setFilter(status)}
                        type="button"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== "all" && (
                          <span className="badge bg-[#E9ECF2] !text-[#244684] ms-2">
                            {
                              reservations.filter((r) => r.status === status)
                                .length
                            }
                          </span>
                        )}
                      </button>
                    </li>
                  )
                )}
              </ul>

              {/* Reservations Table */}
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="resveration_table table-responsive d-none d-md-block">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Restaurant</th>
                          <th>Date & Time</th>
                          <th>Guests</th>
                          <th>Deposit</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              <i
                                className="bi bi-calendar-x text-muted"
                                style={{ fontSize: "3rem" }}
                              ></i>
                              <p className="text-muted mt-2">
                                {filter === "all"
                                  ? "You haven't made any reservations yet."
                                  : `You don't have any ${filter} reservations.`}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredReservations.map((reservation) => (
                            <tr key={reservation.id}>
                              <td>
                                <strong>
                                  {reservation.restaurant?.name || "N/A"}
                                </strong>
                                <br />
                                {reservation.restaurant?.address1 && (
                                  <small className="text-muted">
                                    {[
                                      reservation.restaurant.address1,
                                      reservation.restaurant.address2,
                                      reservation.restaurant.city,
                                      // reservation.restaurant.postCode,
                                      // reservation.restaurant.country
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </small>
                                )}
                              </td>
                              <td>
                                <div>
                                  {formatDate(reservation.reservationDate)}
                                </div>
                                <small className="text-muted">
                                  {reservation.reservationTime}
                                </small>
                              </td>
                              <td>
                                {reservation.numberOfGuests}{" "}
                                {reservation.numberOfGuests === 1
                                  ? "Guest"
                                  : "Guests"}
                              </td>
                              <td>
                                <div>
                                  £{Number(reservation.depositAmount).toFixed(2)}
                                  {reservation.status === "rejected" &&
                                    reservation.depositRefunded && (
                                      <>
                                        <br />
                                        <small className="text-info">
                                          (Refunded)
                                        </small>
                                      </>
                                    )}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`badge text-capitalize ${getStatusBadgeClass(
                                    reservation.status
                                  )}`}
                                >
                                  {reservation.status}
                                </span>
                              </td>
                              <td>
                                <div
                                  className="text-[#4154F1] bg-[#E9ECF2] p-1 rounded-2 flex justify-center items-center h-[30px] w-[30px] cursor-pointer"
                                  onClick={() => {
                                    router.push(
                                      `/customer/reservations/${reservation.id}`
                                    );
                                  }}
                                  title="Reservation Details"
                                >
                                  <i className="bi bi-eye"></i>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Table View with Fixed Right Columns */}
                  <div className="d-md-none">
                    {filteredReservations.length === 0 ? (
                      <div className="text-center py-4">
                        <i
                          className="bi bi-calendar-x text-muted"
                          style={{ fontSize: "3rem" }}
                        ></i>
                        <p className="text-muted mt-2">
                          {filter === "all"
                            ? "You haven't made any reservations yet."
                            : `You don't have any ${filter} reservations.`}
                        </p>
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          position: "relative",
                          overflowX: "auto",
                          WebkitOverflowScrolling: "touch",
                          width: "100%",
                          maxHeight: "70vh",
                          overflowY: "auto"
                        }}
                      >
                        <table className="table table-bordered mb-0" style={{ minWidth: "600px", marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ minWidth: "200px" }}>Restaurant</th>
                              <th style={{ minWidth: "150px" }}>Date & Time</th>
                              <th style={{ minWidth: "80px" }}>Guests</th>
                              <th style={{ minWidth: "100px" }}>Deposit</th>
                              <th 
                                style={{ 
                                  position: "sticky",
                                  right: "60px",
                                  zIndex: 12,
                                  backgroundColor: "#fff",
                                  minWidth: "100px",
                                  width: "100px",
                                  borderLeft: "2px solid #dee2e6",
                                  boxShadow: "-2px 0 4px rgba(0,0,0,0.1)"
                                }}
                              >
                                Status
                              </th>
                              <th 
                                style={{ 
                                  position: "sticky",
                                  right: 0,
                                  zIndex: 12,
                                  backgroundColor: "#fff",
                                  minWidth: "60px",
                                  width: "60px",
                                  boxShadow: "-2px 0 4px rgba(0,0,0,0.1)"
                                }}
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredReservations.map((reservation) => (
                              <tr key={reservation.id}>
                                <td>
                                  <strong>
                                    {reservation.restaurant?.name || "N/A"}
                                  </strong>
                                  <br />
                                  {reservation.restaurant?.address1 && (
                                    <small className="text-muted">
                                      {[
                                        reservation.restaurant.address1,
                                        reservation.restaurant.address2,
                                        reservation.restaurant.city,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </small>
                                  )}
                                </td>
                                <td>
                                  <div>
                                    {formatDate(reservation.reservationDate)}
                                  </div>
                                  <small className="text-muted">
                                    {reservation.reservationTime}
                                  </small>
                                </td>
                                <td>
                                  {reservation.numberOfGuests}{" "}
                                  {reservation.numberOfGuests === 1
                                    ? "Guest"
                                    : "Guests"}
                                </td>
                                <td>
                                  <div>
                                    £{Number(reservation.depositAmount).toFixed(2)}
                                    {reservation.status === "rejected" &&
                                      reservation.depositRefunded && (
                                        <>
                                          <br />
                                          <small className="text-info">
                                            (Refunded)
                                          </small>
                                        </>
                                      )}
                                  </div>
                                </td>
                                <td
                                  style={{
                                    position: "sticky",
                                    right: "60px",
                                    zIndex: 10,
                                    backgroundColor: "#fff",
                                    borderLeft: "2px solid #dee2e6",
                                    boxShadow: "-2px 0 4px rgba(0,0,0,0.1)",
                                    width: "100px"
                                  }}
                                >
                                  <span
                                    className={`badge text-capitalize ${getStatusBadgeClass(
                                      reservation.status
                                    )}`}
                                    style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                                  >
                                    {reservation.status}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    position: "sticky",
                                    right: 0,
                                    zIndex: 10,
                                    backgroundColor: "#fff",
                                    boxShadow: "-2px 0 4px rgba(0,0,0,0.1)",
                                    width: "60px"
                                  }}
                                >
                                  <div
                                    className="text-[#4154F1] bg-[#E9ECF2] p-1 rounded-2 d-flex justify-content-center align-items-center"
                                    style={{
                                      height: "30px",
                                      width: "30px",
                                      cursor: "pointer",
                                      margin: "0 auto"
                                    }}
                                    onClick={() => {
                                      router.push(
                                        `/customer/reservations/${reservation.id}`
                                      );
                                    }}
                                    title="Reservation Details"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

