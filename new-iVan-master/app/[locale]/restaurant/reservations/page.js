"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { getFileUrl, formatAmountToCurrency } from "@/utils/helper";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { Dropdown } from "react-bootstrap";
import Pagination from "@/components/Pagination";

export default function RestaurantReservationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations("ReservationPage");
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [filter, setFilter] = useState("pending"); // all, pending, accepted, rejected, completed
  const [actionReservation, setActionReservation] = useState(null);
  const [actionType, setActionType] = useState(null); // 'accept' or 'reject'
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0,
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "restaurant") {
      router.push("/login");
      return;
    }

    fetchReservations();
  }, [session, status, router]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/reservations?type=restaurant", {
        headers: {
          "user-id": session.user.id,
          role: session.user.role,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reservationsData = data.reservations || [];
        setReservations(reservationsData);

        // Use stats from API response
        setStats({
          total: data.stats?.totalReservations || 0,
          pending: data.stats?.pendingReservations || 0,
          accepted: data.stats?.acceptedReservations || 0,
          rejected: data.stats?.rejectedReservations || 0,
          completed: data.stats?.completedReservations || 0,
        });
      } else {
        toast.error("Failed to load reservations.");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Failed to load reservations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (reservationId) => {
    try {
      setIsProcessing(true);
      const response = await fetch(
        `/api/reservations/${reservationId}/accept`,
        {
          method: "POST",
          headers: {
            "user-id": session.user.id,
            role: session.user.role,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reservation accepted successfully.");
        setActionReservation(null);
        setActionType(null);
        fetchReservations();
      } else {
        toast.error(data.error || "Failed to accept reservation.");
      }
    } catch (error) {
      console.error("Error accepting reservation:", error);
      toast.error("Failed to accept reservation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reservationId) => {
    try {
      setIsProcessing(true);
      const response = await fetch(
        `/api/reservations/${reservationId}/reject`,
        {
          method: "POST",
          headers: {
            "user-id": session.user.id,
            role: session.user.role,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reservation rejected.");
        setActionReservation(null);
        setActionType(null);
        fetchReservations();
      } else {
        toast.error(data.error || "Failed to reject reservation.");
      }
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      toast.error("Failed to reject reservation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (reservation, type) => {
    setActionReservation(reservation);
    setActionType(type);
  };

  const confirmAction = () => {
    if (actionType === "accept") {
      handleAccept(actionReservation.id);
    } else if (actionType === "reject") {
      handleReject(actionReservation.id);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: "bg-warning",
      accepted: "bg-success",
      rejected: "bg-danger",
      completed: "bg-info",
      cancelled: "bg-secondary",
    };
    return statusClasses[status] || "bg-secondary";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredReservations =
    filter === "all"
      ? reservations
      : reservations.filter((r) => r.status === filter);

  if (isLoading) {
    return (
      <div className="pagetitle">
        <h1>Reservations</h1>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "400px" }}
        >
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
        <h1>Reservations</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/restaurant/dashboard">Home</a>
            </li>
            <li className="breadcrumb-item active">Reservations</li>
          </ol>
        </nav>
      </div>

      <section className="section">
        {/* Stats Cards */}
        <div className="feature-box-container row mb-4 g-4">
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
        </div>

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
                            <span className="badge  ms-2 bg-[#E9ECF2] !text-[#244684]">
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
                <div className="resveration_table overflow-x-auto pb-[7rem]">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Contact</th>
                        <th>Date & Time</th>
                        <th>Guests</th>
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
                                ? "You don't have any reservations yet."
                                : `You don't have any ${filter} reservations.`}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredReservations.map((reservation) => (
                          <tr key={reservation.id}>
                            <td>
                              <strong>{reservation.customerName}</strong>
                              <br />
                              <small className="text-muted">
                                ID: #{reservation.id.slice(0, 8)}
                              </small>
                            </td>
                            <td>
                              <div>{reservation.customerEmail}</div>
                              <small className="text-muted">
                                {reservation.customerPhone}
                              </small>
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
                              <span
                                className={`badge text-capitalize ${getStatusBadgeClass(
                                  reservation.status
                                )}`}
                              >
                                {reservation.status}
                              </span>
                            </td>
                            <td>
                              <div className="">
                                <Dropdown align="end">
                                  <Dropdown.Toggle
                                    variant="light"
                                    bsPrefix="btn"
                                    className="p-0 border-0 shadow-none bg-transparent  bg-gray-300"
                                  >
                                    <i
                                      className="fa fa-ellipsis-v"
                                      aria-hidden="true"
                                    ></i>
                                  </Dropdown.Toggle>

                                  <Dropdown.Menu className="rounded shadow">
                                    <Dropdown.Item
                                      onClick={() =>
                                        router.push(
                                          `/restaurant/reservations/reservation/${reservation.id}`
                                        )
                                      }
                                    >
                                      View Details
                                    </Dropdown.Item>

                                    {reservation.status === "pending" && (
                                      <>
                                        <Dropdown.Item
                                          disabled={isProcessing}
                                          onClick={() =>
                                            openActionDialog(
                                              reservation,
                                              "accept"
                                            )
                                          }
                                        >
                                          Accept
                                        </Dropdown.Item>

                                        <Dropdown.Item
                                          disabled={isProcessing}
                                          onClick={() =>
                                            openActionDialog(
                                              reservation,
                                              "reject"
                                            )
                                          }
                                        >
                                          Reject
                                        </Dropdown.Item>
                                      </>
                                    )}
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {/* pagination add here */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={!!actionReservation}
        onClose={() => {
          setActionReservation(null);
          setActionType(null);
        }}
        handleConfirm={confirmAction}
        alertMessage={
          actionType === "accept" ? "Accept Reservation" : "Reject Reservation"
        }
        description={
          actionType === "accept"
            ? `Are you sure you want to accept this reservation for ${
                actionReservation?.customerName
              } on ${
                actionReservation
                  ? formatDate(actionReservation.reservationDate)
                  : ""
              } at ${actionReservation?.reservationTime}?`
            : `Are you sure you want to reject this reservation?`
        }
      />
    </>
  );
}

