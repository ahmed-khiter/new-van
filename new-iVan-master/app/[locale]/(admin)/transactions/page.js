"use client";
import TransactionDetailModal from "@/components/Modals/TransactionDetailModal";
import { formatAmountToCurrency, formatDistanceToNow, truncateId } from "@/utils/helper";
import { useEffect, useState } from "react";
import { Badge, Card, Col, Form, Row } from "react-bootstrap";

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("payment");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalTransactions: 0
    });

   
    useEffect(() => {
        fetchTransactions();
    }, [searchTerm, typeFilter, sourceFilter]);

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
            const params = new URLSearchParams();
            params.append("type", typeFilter);
            if (sourceFilter !== "all") {
                params.append("source", sourceFilter);
            }
            if (searchTerm) {
                params.append("search", searchTerm);
            }
            const response = await fetch(`/api/transactions?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };


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
        <div className="pagetitle">
            <h1>All Transactions</h1>
            <nav>
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <a href="/admin-dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">Transactions</li>
                </ol>
            </nav>

            {/* Stats Cards */}
            <div className="feature-box-container row mb-4">
                <div className="col-md-6">
                    <div className="feature-box bg-white p-4 d-flex gap-2">
                        <div className="feature-details">
                            <span className="feature-title fw-bold d-block">
                                Total Revenue
                            </span>
                            <span className="feature-count mt-1 fw-bold d-block">
                                {formatAmountToCurrency(stats.totalRevenue)}
                            </span>
                        </div>
                        <div className="feature-icon-box ms-auto d-flex justify-content-center align-items-center">
                            <i className="bi bi-currency-pound" />
                        </div>
                    </div>
                </div>

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

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body className="pt-3">
                    <Row>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Search</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by transaction ID, provider name, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Source</Form.Label>
                                <Form.Select
                                    value={sourceFilter}
                                    onChange={(e) => setSourceFilter(e.target.value)}
                                >
                                    <option value="all">All Sources</option>
                                    <option value="subscription">Subscription</option>
                                    <option value="job">Job Payment</option>
                                    <option value="order">Product Order</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Transactions Table */}
            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body !pt-[20px] overflow-auto">
                                {/* Tabs */}
                                <div className="flex bg-white p-2 rounded-[8px] gap-2 mb-4 shadow-sm">
                                    <div
                                        className={`flex-1 text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${typeFilter === "payment"
                                            ? "bg-green-600 text-white shadow-md"
                                            : "bg-green-100 text-green-800 hover:bg-green-200"
                                            }`}
                                        onClick={() => setTypeFilter("payment")}
                                    >
                                        Payments
                                    </div>
                                    <div
                                        className={`flex-1 text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${typeFilter === "transfer"
                                            ? "bg-orange-600 text-white shadow-md"
                                            : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                                            }`}
                                        onClick={() => setTypeFilter("transfer")}
                                    >
                                        Transfers
                                    </div>
                                </div>

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
                                                <th className="align-middle">From</th>
                                                <th className="align-middle">Type</th>
                                                <th className="align-middle">Amount</th>
                                                <th className="align-middle">Date</th>
                                                <th className="align-middle">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((transaction, index) => (
                                                <tr key={index}>
                                                    <td className="align-middle">
                                                        <code>{truncateId(transaction.transaction_id) || "N/A"}</code>
                                                    </td>
                                                    <td className="align-middle">
                                                        {transaction.sender ? (
                                                            <div>
                                                                <div className="fw-bold">
                                                                    {transaction.sender.firstName || ""} {transaction.sender.lastName || ""}
                                                                </div>
                                                                <small className="text-muted">{transaction.sender.email || "N/A"}</small>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="align-middle">
                                                        {getTransactionTypeBadge(transaction.type || "unknown")}
                                                    </td>
                                                    <td className="align-middle">
                                                        <strong className={transaction.type === "payment" ? "text-success" : transaction.type === "transfer" ? "text-danger" : "text-warning"}>
                                                            {transaction.type === "payment" ? "+" : "-"}{formatAmountToCurrency(transaction.amount)}
                                                        </strong>
                                                    </td>
                                                    <td className="align-middle">
                                                        <div>
                                                            {transaction.date ? new Date(transaction.date).toLocaleDateString() : "N/A"}
                                                        </div>
                                                        <small className="text-muted">
                                                            {transaction.date ? formatDistanceToNow(transaction.date) : "N/A"}
                                                        </small>
                                                    </td>
                                                    <td className="align-middle">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleViewDetails(transaction)}
                                                        >
                                                            <i className="bi bi-eye"></i> View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-receipt text-muted" style={{ fontSize: "3rem" }}></i>
                                        <h5 className="mt-3 text-muted">No Transactions Found</h5>
                                        <p className="text-muted">No transactions match your current filters.</p>
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
