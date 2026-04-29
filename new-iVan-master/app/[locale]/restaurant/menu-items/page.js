"use client";
import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getFileUrl, formatAmountToCurrency } from '@/utils/helper';
import ConfirmationDialog from '@/components/Modals/ConfirmationModal';
import { useRouter } from 'next/navigation';
import CategoryFilter from '@/components/CategoryFilter';
import { useCategories } from '@/hooks/useCategories';

export default function MenuItemsPage() {
    const t = useTranslations("MenuItemsPage");
    const router = useRouter();
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isOpenConfirmation, setIsOpenConfirmation] = useState(false);
    const [menuItemToDelete, setMenuItemToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: 'active',
        availability: '',
        category: '',
        cuisine: ''
    });
    
    // Fetch categories for restaurant type
    const { categories, loading: categoriesLoading } = useCategories('restaurant');
    
    // Create a mapping from category ID to category name
    const categoryMap = useMemo(() => {
        const map = {};
        categories.forEach(cat => {
            map[String(cat.id)] = cat.name;
        });
        return map;
    }, [categories]);
    
    // Get unique cuisines from menu items
    const uniqueCuisines = useMemo(() => {
        const cuisines = new Set();
        menuItems.forEach(item => {
            if (item.cuisine) {
                cuisines.add(item.cuisine);
            }
        });
        return Array.from(cuisines).sort();
    }, [menuItems]);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchMenuItems();
    }, [debouncedSearchQuery, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const fetchMenuItems = async () => {
        try {
            if (menuItems.length === 0) {
                setIsLoading(true);
            } else {
                setIsFiltering(true);
            }
            
            const params = new URLSearchParams();
            if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
            if (filters.status) params.append('status', filters.status);
            if (filters.availability) params.append('availability', filters.availability);
            if (filters.category) params.append('category', filters.category);
            if (filters.cuisine) params.append('cuisine', filters.cuisine);

            const response = await fetch(`/api/products?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setMenuItems(data.products || []);
            } else {
                toast.error('Failed to fetch menu items');
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
            toast.error('Failed to fetch menu items');
        } finally {
            setIsLoading(false);
            setIsFiltering(false);
        }
    };

    const handleOpenConfirmDelete = (menuItem) => {
        setMenuItemToDelete(menuItem);
        setIsOpenConfirmation(true);
    };

    const handleConfirmDelete = async () => {
        if (!menuItemToDelete) return;
        
        setIsOpenConfirmation(false);
        
        try {
            const response = await fetch(`/api/products/${menuItemToDelete.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Menu item deleted successfully');
                setMenuItems(prevItems => 
                    prevItems.filter(item => item.id !== menuItemToDelete.id)
                );
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete menu item');
            }
        } catch (error) {
            console.error('Error deleting menu item:', error);
            toast.error('Failed to delete menu item');
        } finally {
            setMenuItemToDelete(null);
        }
    };

    const handleCloseConfirmation = () => {
        setIsOpenConfirmation(false);
        setMenuItemToDelete(null);
    };

    const handleToggleActive = async (menuItem) => {
        const newStatus = !menuItem.isActive;
        try {
            const formData = new FormData();
            formData.append('isActive', newStatus.toString());

            const response = await fetch(`/api/products/${menuItem.id}`, {
                method: 'PATCH',
                body: formData
            });

            if (response.ok) {
                toast.success(newStatus ? 'Menu item activated' : 'Menu item deactivated');
                setMenuItems(prev =>
                    prev.map(item => item.id === menuItem.id ? { ...item, isActive: newStatus } : item)
                );
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to update menu item status');
            }
        } catch (error) {
            console.error('Error toggling menu item status:', error);
            toast.error('Failed to update menu item status');
        }
    };

    if (isLoading) {
        return (
            <div className="pagetitle">
                <h1>Menu Items</h1>
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
                <h1>Menu Items</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link href="/restaurant/dashboard">Home</Link>
                        </li>
                        <li className="breadcrumb-item active">Menu Items</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title">All Menu Items</h5>
                                    <Link href="/restaurant/menu-items/add" className="btn btn-primary">
                                        <i className="bi bi-plus-circle"></i> Add Menu Item
                                    </Link>
                                </div>

                                {/* Search and Filters */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search menu items..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
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
                                            value={filters.availability}
                                            onChange={(e) => handleFilterChange("availability", e.target.value)}
                                        >
                                            <option value="">Filter By Availability</option>
                                            <option value="available">Available</option>
                                            <option value="unavailable">Unavailable</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <CategoryFilter
                                            selectedCategory={filters.category}
                                            onCategoryChange={(category) => handleFilterChange("category", category)}
                                            showAllOption={true}
                                            variant="dropdown"
                                            type="restaurant"
                                            className="w-100"
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={filters.cuisine}
                                            onChange={(e) => handleFilterChange("cuisine", e.target.value)}
                                        >
                                            <option value="">All Cuisines</option>
                                            {uniqueCuisines.map((cuisine, index) => (
                                                <option key={index} value={cuisine}>
                                                    {cuisine}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-1">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setFilters({ status: 'active', availability: '', category: '', cuisine: '' });
                                            }}
                                            style={{ height: '38px' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* Menu Items Table */}
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Image</th>
                                                <th scope="col">Name</th>
                                                <th scope="col">Category</th>
                                                <th scope="col" className="text-center">Price</th>
                                                <th scope="col" className="text-center">Availability</th>
                                                <th scope="col" className="text-center">Status</th>
                                                <th scope="col" className="text-center whitespace-nowrap">Created Date</th>
                                                <th scope="col" className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading || isFiltering ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">
                                                        <div className="d-flex flex-column align-items-center">
                                                            <div className="spinner-border text-primary" role="status">
                                                                <span className="visually-hidden">
                                                                    {isLoading ? 'Loading...' : 'Filtering...'}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-muted mb-0">
                                                                {isLoading ? 'Loading menu items...' : 'Applying filters...'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : menuItems && menuItems.length > 0 ? (
                                                menuItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="text-center align-middle">
                                                            <div className="position-relative">
                                                                {item.image && (
                                                                    <img
                                                                        src={getFileUrl(item.image)}
                                                                        alt={item.name}
                                                                        className="rounded w-10 h-10 object-cover"
                                                                        style={{ width: '50px', height: '50px' }}
                                                                    />
                                                                )}
                                                                {!item.image && (
                                                                    <div className="bg-light flex rounded align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                        <i className="bi bi-image text-muted"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <strong>{item.name}</strong>
                                                           
                                                        </td>
                                                        <td className="align-middle">
                                                            {item.category ? (categoryMap[item.category] || item.category) : '-'}
                                                        </td>
                                                        <td className="text-center align-middle">{formatAmountToCurrency(Number(item.price))}</td>
                                                        <td className="text-center align-middle">
                                                            <span className={`badge ${item.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                                                                {item.isAvailable ? 'Available' : 'Unavailable'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            <span className={`badge ${item.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                                {item.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="text-center align-middle">
                                                            <span
                                                                title="Edit"
                                                                className="text-primary me-2"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => router.push(`/restaurant/menu-items/edit/${item.id}`)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </span>
                                                            <span
                                                                title="Delete"
                                                                className="text-danger me-2"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => handleOpenConfirmDelete(item)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </span>
                                                            <span
                                                                title={item.isActive ? "Deactivate" : "Activate"}
                                                                className={`${item.isActive ? 'text-warning' : 'text-success'} me-2`}
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => handleToggleActive(item)}
                                                            >
                                                                <i className={`bi ${item.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">
                                                        <div className="d-flex flex-column align-items-center">
                                                            <i className="bi bi-menu-button-wide text-muted text-3xl"></i>
                                                            <h6 className="mt-2 text-muted mb-0">No menu items found</h6>
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
                alertMessage={`Are you sure you want to delete this menu item?`}
            />
        </>
    );
}

