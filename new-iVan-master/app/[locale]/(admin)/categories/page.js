"use client";
import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import toast from 'react-hot-toast';
import { getFileUrl } from '@/utils/helper';
import ConfirmationDialog from '@/components/Modals/ConfirmationModal';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpenConfirmation, setIsOpenConfirmation] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState(''); // 'shop', 'restaurant', or '' for all
    const [isReordering, setIsReordering] = useState(false);
    const router = useRouter();

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchCategories();
    }, [debouncedSearchQuery, typeFilter]);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            
            const params = new URLSearchParams();
            if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
            if (typeFilter) params.append('type', typeFilter);

            const response = await fetch(`/api/categories?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched categories:', data.categories);
                setCategories(data.categories || []);
            } else {
                toast.error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenConfirmDelete = (category) => {
        setCategoryToDelete(category);
        setIsOpenConfirmation(true);
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        
        setIsOpenConfirmation(false);
        
        try {
            const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Category deleted successfully');
                setCategories(prevCategories => 
                    prevCategories.filter(category => category.id !== categoryToDelete.id)
                );
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        } finally {
            setCategoryToDelete(null);
        }
    };

    const handleCloseConfirmation = () => {
        setIsOpenConfirmation(false);
        setCategoryToDelete(null);
    };

    const handleReorder = async (categoryId, direction) => {
        if (isReordering) return;
        
        setIsReordering(true);
        try {
            const response = await fetch('/api/categories/reorder', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categoryId, direction })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Category position updated');
                // Refresh categories to get updated order
                await fetchCategories();
            } else {
                toast.error(data.error || 'Failed to update category position');
            }
        } catch (error) {
            console.error('Error reordering category:', error);
            toast.error('Failed to update category position');
        } finally {
            setIsReordering(false);
        }
    };

    const getTypeDisplay = (type) => {
        const typeMap = {
            'shop': { label: 'Shop', color: 'bg-info' },
            'restaurant': { label: 'Restaurant', color: 'bg-warning' },
            'mot': { label: 'MOT Center', color: 'bg-primary' },
            'shisha': { label: 'Shisha lounges', color: 'bg-success' },
            'spa': { label: 'Spa', color: 'bg-danger' },
            'beauty': { label: 'Beauty Salon', color: 'bg-purple' },
            'healthcare': { label: 'Healthcare Provider', color: 'bg-info' },
            'events': { label: 'Events Provider', color: 'bg-warning' },
            'entertainment': { label: 'Entertainment Venue', color: 'bg-success' }
        };
        return typeMap[type] || { label: type, color: 'bg-secondary' };
    };

    if (isLoading) {
        return (
            <div className="pagetitle">
                <h1>Categories</h1>
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
                <h1>Categories</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link href="/admin-dashboard">Home</Link>
                        </li>
                        <li className="breadcrumb-item active">Categories</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title">All Categories</h5>
                                    <Link href="/categories/add" className="btn btn-primary">
                                        <i className="bi bi-plus-circle"></i> Add Category
                                    </Link>
                                </div>

                                {/* Search and Filters */}
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <div className="search-bar">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search categories..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <select
                                            className="form-control"
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                        >
                                            <option value="">All Types</option>
                                            <option value="shop">Shop</option>
                                            <option value="restaurant">Restaurant</option>
                                            <option value="mot">MOT Center</option>
                                            <option value="shisha">Shisha lounges</option>
                                            <option value="spa">Spa</option>
                                            <option value="beauty">Beauty Salon</option>
                                            <option value="healthcare">Healthcare Provider</option>
                                            <option value="events">Events Provider</option>
                                            <option value="entertainment">Entertainment Venue</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <button
                                            className="btn btn-outline-secondary w-100"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setTypeFilter('');
                                            }}
                                            style={{ height: '38px' }}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {/* Categories Table */}
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th scope="col" style={{ width: '80px' }}>Order</th>
                                                <th scope="col">Image</th>
                                                <th scope="col">Name</th>
                                                <th scope="col" className="text-center">Subcategories</th>
                                                <th scope="col" className="text-center">Type</th>
                                                <th scope="col" className="text-center">Created Date</th>
                                                <th scope="col" className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories && categories.length > 0 ? (
                                                categories.map((category, index) => (
                                                    <tr key={category.id}>
                                                        <td className="text-center align-middle">
                                                            <div className="d-flex flex-column align-items-center gap-1">
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary p-1"
                                                                    style={{ 
                                                                        width: '28px', 
                                                                        height: '28px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: index === 0 || isReordering ? 'not-allowed' : 'pointer',
                                                                        opacity: index === 0 || isReordering ? 0.5 : 1
                                                                    }}
                                                                    disabled={index === 0 || isReordering}
                                                                    onClick={() => handleReorder(category.id, 'up')}
                                                                    title="Move up"
                                                                >
                                                                    <i className="bi bi-arrow-up" style={{ fontSize: '12px' }}></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary p-1"
                                                                    style={{ 
                                                                        width: '28px', 
                                                                        height: '28px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: index === categories.length - 1 || isReordering ? 'not-allowed' : 'pointer',
                                                                        opacity: index === categories.length - 1 || isReordering ? 0.5 : 1
                                                                    }}
                                                                    disabled={index === categories.length - 1 || isReordering}
                                                                    onClick={() => handleReorder(category.id, 'down')}
                                                                    title="Move down"
                                                                >
                                                                    <i className="bi bi-arrow-down" style={{ fontSize: '12px' }}></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <div 
                                                                className="bg-light rounded d-flex align-items-center justify-content-center" 
                                                                style={{ 
                                                                    width: '60px', 
                                                                    height: '60px',
                                                                    margin: '0 auto'
                                                                }}
                                                            >
                                                                {category.image ? (
                                                                    <img
                                                                        src={getFileUrl(category.image)}
                                                                        alt={category.name}
                                                                        className="rounded"
                                                                        style={{ 
                                                                            width: '100%', 
                                                                            height: '100%', 
                                                                            objectFit: 'cover' 
                                                                        }}
                                                                        onLoad={(e) => {
                                                                            console.log('Image loaded successfully:', category.name, getFileUrl(category.image));
                                                                        }}
                                                                        onError={(e) => {
                                                                            console.log('Image failed to load:', category.name, 'URL:', getFileUrl(category.image), 'Original filename:', category.image);
                                                                            e.target.style.display = 'none';
                                                                            e.target.parentElement.innerHTML = '<i class="bi bi-image text-muted"></i>';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <i className="bi bi-image text-muted"></i>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <strong>{category.name}</strong>
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            {category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0 ? (
                                                                <span 
                                                                    className="badge bg-info" 
                                                                    title={category.subcategories.join(', ')}
                                                                    style={{ cursor: 'help' }}
                                                                >
                                                                    {category.subcategories.length} subcategories
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">—</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            {category.type ? (
                                                                (() => {
                                                                    const { label, color } = getTypeDisplay(category.type);
                                                                    return (
                                                                        <span className={`badge ${color}`}>
                                                                            {label}
                                                                        </span>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span className="badge bg-secondary">All</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            {new Date(category.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            <span
                                                                title="Edit"
                                                                className="text-primary me-2"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => router.push(`/categories/edit/${category.id}`)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </span>
                                                            <span
                                                                title="Delete"
                                                                className="text-danger me-2"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => handleOpenConfirmDelete(category)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4">
                                                        <div className="d-flex flex-column align-items-center">
                                                            <i className="bi bi-tags text-muted" style={{ fontSize: '3rem' }}></i>
                                                            <h6 className="mt-2 text-muted mb-0">No categories found</h6>
                                                            <p className="text-muted mb-0">Try adjusting your search</p>
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
                alertMessage={`Are you sure you want to delete the category "${categoryToDelete?.name}"?`}
            />
        </>
    );
}

