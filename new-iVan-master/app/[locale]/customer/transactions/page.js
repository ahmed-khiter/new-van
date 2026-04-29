"use client";
import { useEffect, useState } from "react";
import TransactionDetailModal from "@/components/Modals/TransactionDetailModal";
import { truncateId, formatAmountToCurrency, formatDistanceToNow } from "@/utils/helper";

export default function VisitorTransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSpent: 0,
        totalTransactions: 0
    });
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTransaction(null);
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors
            const response = await fetch("/api/transactions");
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
                
                if (data.stats) {
                    setStats({
                        totalSpent: data.stats.totalRevenue,
                        totalTransactions: data.stats.totalTransactions
                    });
                }
            } else {
                console.error("Failed to fetch transactions:", response.status, response.statusText);
                const errorData = await response.json();
                console.error("Error data:", errorData);
                setError("Failed to fetch transactions. Please try again.");
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            setError("An error occurred while fetching transactions. Please try again.");
        } finally {
            setLoading(false);
        }
    };




    return (
      <div className="pagetitle">
        <h1>Transactions</h1>
        {/* <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/customer/dashboard">Home</a>
            </li>
            <li className="breadcrumb-item active">Transactions</li>
          </ol>
        </nav> */}

        {/* Error Alert */}
        {/* {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )} */}

        {/* Stats Cards */}
        <div className="feature-box-container row mb-4 g-4">
          {/* <div className="col-md-6">
            <div className="feature-box bg-white p-4 d-flex gap-2">
              <div className="feature-details">
                <span className="feature-title fw-bold d-block">
                  Total Spent
                </span>
                <span className="feature-count mt-1 fw-bold d-block">
                  {formatAmountToCurrency(stats.totalSpent)}
                </span>
              </div>
              <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                <i className="bi bi-currency-pound" />
              </div>
            </div>
          </div> */}

          <div className="col-md-6">
            <div className="feature-box bg-white p-4 d-flex gap-2">
              <div className="feature-details">
                <span className="feature-title fw-bold d-block">
                  Total Transactions
                </span>
                <span className="feature-count mt-1 fw-bold d-block">
                  {stats.totalTransactions}
                </span>
              </div>
              <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                <i className="bi bi-receipt" />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <section className="section">
          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body !pt-[20px] overflow-auto">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading transactions...</p>
                    </div>
                  ) : transactions.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="align-middle">Transaction ID</th>
                          <th className="align-middle">Amount</th>
                          <th className="align-middle">Date</th>
                          <th className="align-middle">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction, index) => (
                          <tr key={index}>
                            <td className="align-middle">
                              <code>
                                {truncateId(transaction.transaction_id)}
                              </code>
                            </td>
                            <td className="align-middle">
                              <strong className="text-danger">
                                -{formatAmountToCurrency(transaction.amount)}
                              </strong>
                            </td>
                            <td className="align-middle">
                              <div>
                                {new Date(
                                  transaction.date
                                ).toLocaleDateString()}
                              </div>
                              <small className="text-muted">
                                {formatDistanceToNow(transaction.date)}
                              </small>
                            </td>
                            <td className="align-middle">
                              <div
                                className="text-[#4154F1] bg-[#E9ECF2] p-1 rounded-2 flex justify-center items-center h-[30px] w-[30px] cursor-pointer"
                                onClick={() => handleViewDetails(transaction)}
                                title="View Detail"
                              >
                                <i className="bi bi-eye"></i>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-5">
                      <i
                        className="bi bi-receipt text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <h5 className="mt-3 text-muted">No Transactions Found</h5>
                      <p className="text-muted">
                        You haven&apos;t made any transactions yet. When you
                        book services, your payment history will appear here.
                      </p>{" "}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Transaction Detail Modal */}
        <TransactionDetailModal
          show={showModal}
          onHide={handleCloseModal}
          transaction={selectedTransaction}
        />
      </div>
    );
}
