"use client";
import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getFileUrl, formatAmountToCurrency } from '@/utils/helper';
import ConfirmationDialog from '@/components/Modals/ConfirmationModal';
import { useRouter } from 'next/navigation';
import { getInventoryLabels } from '@/utils/serviceConfig';

export default function ShopProductsPage() {
    const t = useTranslations("AdminPages.products");
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isOpenConfirmation, setIsOpenConfirmation] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: 'active',
        stock: '',
        dateFrom: '',
        dateTo: ''
    });
    const [itemLabels, setItemLabels] = useState(getInventoryLabels("shop"));

    useEffect(() => {
        const fetchShopType = async () => {
            try {
                const res = await fetch('/api/profile');
                if (!res.ok) return;
                const data = await res.json();
                setItemLabels(getInventoryLabels(data?.shop?.type || "shop"));
            } catch (error) {
                console.error('Error fetching shop type:', error);
            }
        };

        fetchShopType();
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchProducts();
    }, [debouncedSearchQuery, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const fetchProducts = async () => {
        try {
            // Only show full loading on initial load, use filtering indicator for subsequent loads
            if (products.length === 0) {
                setIsLoading(true);
            } else {
                setIsFiltering(true);
            }
            
            const params = new URLSearchParams();
            if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
            if (filters.status) params.append('status', filters.status);
            if (filters.stock) params.append('stock', filters.stock);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);

            const response = await fetch(`/api/products?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            } else {
                toast.error('Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
        } finally {
            setIsLoading(false);
            setIsFiltering(false);
        }
    };

    const handleOpenConfirmDelete = (product) => {
        setProductToDelete(product);
        setIsOpenConfirmation(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        
        setIsOpenConfirmation(false);
        
        try {
            const response = await fetch(`/api/products/${productToDelete.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success(`${itemLabels.singular} deleted successfully`);
                // Update state manually instead of refetching
                setProducts(prevProducts => 
                    prevProducts.filter(product => product.id !== productToDelete.id)
                );
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            setProductToDelete(null);
        }
    };

    const handleCloseConfirmation = () => {
        setIsOpenConfirmation(false);
        setProductToDelete(null);
    };

    const handleToggleActive = async (product) => {
        const newStatus = !product.isActive;
        try {
            const formData = new FormData();
            formData.append('isActive', newStatus.toString());

            const response = await fetch(`/api/products/${product.id}`, {
                method: 'PATCH',
                body: formData
            });

            if (response.ok) {
                toast.success(newStatus ? `${itemLabels.singular} activated` : `${itemLabels.singular} deactivated`);
                setProducts(prev =>
                    prev.map(p => p.id === product.id ? { ...p, isActive: newStatus } : p)
                );
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to update product status');
            }
        } catch (error) {
            console.error('Error toggling product status:', error);
            toast.error('Failed to update product status');
        }
    };

    if (isLoading) {
        return (
            <div className="pagetitle">
                <h1>{itemLabels.plural}</h1>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
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
                <h1>{itemLabels.plural}</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link href="/shop/dashboard">Home</Link>
                        </li>
                        <li className="breadcrumb-item active">{itemLabels.plural}</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title">All {itemLabels.plural}</h5>
                                    <Link href="/shop/products/add" className="btn btn-primary">
                                        <i className="bi bi-plus-circle"></i> Add {itemLabels.singular}
                                    </Link>
                                </div>

                                {/* Search and Filters */}
                                <div className="row mb-3 g-3">
                                    <div className="col-md-3">
                                        <div className="search-bar">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={`Search ${itemLabels.plural.toLowerCase()}...`}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange("status", e.target.value)}
                                        >
                                            <option value="">Filter By Status</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={filters.stock}
                                            onChange={(e) => handleFilterChange("stock", e.target.value)}
                                        >
                                            <option value="">Filter By Stock</option>
                                            <option value="in-stock">In Stock</option>
                                            <option value="out-of-stock">Out of Stock</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <input
                                            type="date"
                                            className="form-control"
                                            placeholder="From Date"
                                            value={filters.dateFrom}
                                            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <input
                                            type="date"
                                            className="form-control"
                                            placeholder="To Date"
                                            value={filters.dateTo}
                                            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-1">
                                        <button
                                            className="btn btn-outline-secondary w-100"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setFilters({ status: 'active', stock: '', dateFrom: '', dateTo: '' });
                                            }}
                                            style={{ height: '38px' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* Products Table */}
                                <div className="table-responsive">
                                    <table className="table whitespace-nowrap">
                                        <thead>
                                            <tr>
                                                <th scope="col">Image</th>
                                                <th scope="col">Name</th>
                                                <th scope="col" className="text-center">Price</th>
                                                <th scope="col" className="text-center">Stock</th>
                                                <th scope="col" className="text-center">Status</th>
                                                <th scope="col" className="text-center">Created Date</th>
                                                <th scope="col" className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading || isFiltering ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4">
                                                        <div className="d-flex flex-column align-items-center">
                                                            <div className="spinner-border text-primary" role="status">
                                                                <span className="visually-hidden">
                                                                    {isLoading ? 'Loading...' : 'Filtering...'}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-muted mb-0">
                                                                {isLoading ? 'Loading products...' : 'Applying filters...'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : products && products.length > 0 ? (
                                                products.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td className="text-center align-middle">
                                                            <div className="position-relative">
                                                                {product.image && (
                                                                    <img
                                                                        src={getFileUrl(product.image)}
                                                                        alt={product.name}
                                                                        className="rounded w-10 h-10 object-cover"
                                                                        onLoad={(e) => {
                                                                            e.target.style.display = 'block';
                                                                            e.target.nextSibling.style.display = 'none';
                                                                        }}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                )}
                                                                <div className="bg-light flex rounded align-items-center justify-content-center w-10 h-10">
                                                                    <i className="bi bi-image text-muted"></i>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <strong>{product.name}</strong>
                                                            {product.variants?.enabled && product.variants?.items?.length > 0 && (
                                                                <div className="mt-1">
                                                                    <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                                                                        {product.variants.optionName}: {product.variants.values?.join(', ')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            {product.variants?.enabled && product.variants?.items?.length > 0 ? (() => {
                                                                const prices = product.variants.items.map(i => i.price);
                                                                const min = Math.min(...prices);
                                                                const max = Math.max(...prices);
                                                                return min === max
                                                                    ? formatAmountToCurrency(min)
                                                                    : `${formatAmountToCurrency(min)} - ${formatAmountToCurrency(max)}`;
                                                            })() : formatAmountToCurrency(Number(product.price))}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            {(() => {
                                                                const totalStock = product.variants?.enabled && product.variants?.items?.length > 0
                                                                    ? product.variants.items.reduce((sum, i) => sum + (i.stock || 0), 0)
                                                                    : product.stock;
                                                                return (
                                                                    <span className={`badge ${totalStock > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                                        {totalStock}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            <span className={`badge ${product.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                                {product.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            {new Date(product.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            <span
                                                                title="Edit"
                                                                className="text-primary me-2"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => router.push(`/shop/products/edit/${product.id}`)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </span>
                                                            <span
                                                                title="Delete"
                                                                className="text-danger me-2"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => handleOpenConfirmDelete(product)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </span>
                                                            <span
                                                                title={product.isActive ? "Deactivate" : "Activate"}
                                                                className={`${product.isActive ? 'text-warning' : 'text-success'} me-2`}
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => handleToggleActive(product)}
                                                            >
                                                                <i className={`bi ${product.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4">
                                                        <div className="d-flex flex-column align-items-center">
                                                            <i className="bi bi-box text-muted text-3xl"></i>
                                                            <h6 className="mt-2 text-muted mb-0">No {itemLabels.plural.toLowerCase()} found</h6>
                                                            <p className="text-muted mb-0">Try adjusting your search or filters</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Confirmation Modal */}
            <ConfirmationDialog
                isOpen={isOpenConfirmation}
                onClose={handleCloseConfirmation}
                handleConfirm={handleConfirmDelete}
                alertMessage={`Are you sure you want to delete this ${itemLabels.singular.toLowerCase()}?`}
            />
        </>
    );
}

