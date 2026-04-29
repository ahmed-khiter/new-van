"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import AddressInput from '@/components/Fields/AddressInput';
import MapComponent from '@/components/MapComponent';
import { getFileUrl } from '@/utils/helper';
import { useCategories } from '@/hooks/useCategories';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { getInventoryLabels } from '@/utils/serviceConfig';

const ProductForm = ({ 
    productId = "create", 
    redirectPath = "/products",
    onSuccess = null,
    hidePickupAddress = false
}) => {
    const t = useTranslations("AdminPages.products");
    const router = useRouter();
    const isUpdating = productId !== "create";
    const { categories, loading: categoriesLoading } = useCategories();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(isUpdating);
    const [itemLabels, setItemLabels] = useState(getInventoryLabels("shop"));
    const [shopCategory, setShopCategory] = useState(null);
    const [shopCategoryLoading, setShopCategoryLoading] = useState(hidePickupAddress);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        subcategory: '',
        stock: 0,
        weight: '',
        length: '',
        width: '',
        height: '',
        pickupAddress: '',
        pickupCity: '',
        pickupPostCode: '',
        pickupLat: '',
        pickupLng: '',
        image: null,
        existingImage: null,
        isActive: true
    });

    // Multi-image state
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const imageInputRef = useRef(null);
    const MAX_IMAGES = 8;
    const totalImages = existingImages.length + newImages.length;

    // Variant state
    const [variantsEnabled, setVariantsEnabled] = useState(false);
    const [variantsExpanded, setVariantsExpanded] = useState(false);
    const [variantOptionName, setVariantOptionName] = useState('');
    const [variantValueInput, setVariantValueInput] = useState('');
    const [variantValues, setVariantValues] = useState([]);
    const [variantRows, setVariantRows] = useState([]);

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

    useEffect(() => {
        if (hidePickupAddress) {
            fetchShopCategory();
        }
    }, [hidePickupAddress]);

    useEffect(() => {
        if (isUpdating && productId) {
            fetchProduct();
        }
    }, [productId, isUpdating]);

    useEffect(() => {
        if (hidePickupAddress && shopCategory && !categoriesLoading && !isUpdating) {
            setFormData(prev => ({
                ...prev,
                category: shopCategory
            }));
        }
    }, [shopCategory, categoriesLoading, hidePickupAddress, isUpdating]);

    const fetchShopCategory = async () => {
        try {
            setShopCategoryLoading(true);
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                if (data.shop?.category) {
                    setShopCategory(data.shop.category);
                    if (!isUpdating) {
                        setFormData(prev => ({ ...prev, category: data.shop.category }));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching shop category:', error);
        } finally {
            setShopCategoryLoading(false);
        }
    };

    const fetchProduct = async () => {
        try {
            setIsLoadingProduct(true);
            const response = await fetch(`/api/products/${productId}`);
            if (response.ok) {
                const data = await response.json();
                const product = data.product;
                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    price: product.price?.toString() || '',
                    category: product.category || '',
                    subcategory: product.subcategory || '',
                    stock: product.stock || 0,
                    weight: product.weight?.toString() || '',
                    length: product.dimensions?.length?.toString() || '',
                    width: product.dimensions?.width?.toString() || '',
                    height: product.dimensions?.height?.toString() || '',
                    pickupAddress: product.pickupAddress || '',
                    pickupCity: product.pickupCity || '',
                    pickupPostCode: product.pickupPostCode || '',
                    pickupLat: product.pickupLat,
                    pickupLng: product.pickupLng,
                    image: null,
                    existingImage: product.image,
                    isActive: product.isActive !== undefined ? product.isActive : true
                });

                // Load existing images array
                const imgs = Array.isArray(product.images) ? product.images :
                    (product.image ? [product.image] : []);
                setExistingImages(imgs);

                if (product.variants && product.variants.enabled) {
                    setVariantsEnabled(true);
                    setVariantsExpanded(true);
                    setVariantOptionName(product.variants.optionName || '');
                    setVariantValues(product.variants.values || []);
                    setVariantRows(product.variants.items || []);
                }
            } else {
                toast.error('Failed to fetch product');
                router.push('/products');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Failed to fetch product');
            router.push('/products');
        } finally {
            setIsLoadingProduct(false);
        }
    };

    const selectedCategory = categories.find(c => String(c.id) === String(formData.category));
    const availableSubcategories = selectedCategory?.subcategories && Array.isArray(selectedCategory.subcategories)
        ? selectedCategory.subcategories
        : [];

    const handleInputChange = (e) => {
        const { name, value, type, files, checked } = e.target;
        if (type === 'file') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0] || null
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (name === 'category') {
            setFormData(prev => ({
                ...prev,
                category: value,
                subcategory: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleAddressSelect = (location) => {
        setFormData(prev => ({
            ...prev,
            pickupAddress: location.address || '',
            pickupCity: location.city || '',
            pickupPostCode: location.postcode || '',
            pickupLat: location.lat,
            pickupLng: location.lng
        }));
    };

    const handleAddressChange = (value) => {
        setFormData(prev => ({
            ...prev,
            pickupAddress: value
        }));
    };

    // --- Variant helpers ---
    const handleAddVariantValue = () => {
        const trimmed = variantValueInput.trim();
        if (!trimmed) return;
        if (variantValues.includes(trimmed)) {
            toast.error('This value already exists');
            return;
        }
        const newValues = [...variantValues, trimmed];
        setVariantValues(newValues);
        setVariantValueInput('');
        syncVariantRows(newValues);
    };

    const handleRemoveVariantValue = (val) => {
        const newValues = variantValues.filter(v => v !== val);
        setVariantValues(newValues);
        syncVariantRows(newValues);
    };

    const handleVariantValueKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddVariantValue();
        }
    };

    const syncVariantRows = (values) => {
        setVariantRows(prev => {
            const existing = {};
            prev.forEach(r => { existing[r.value] = r; });
            return values.map(val => existing[val] || {
                value: val,
                price: formData.price || '',
                salePrice: '',
                stock: 0
            });
        });
    };

    const handleVariantRowChange = (index, field, value) => {
        setVariantRows(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleRemoveVariantRow = (index) => {
        const removedVal = variantRows[index]?.value;
        setVariantRows(prev => prev.filter((_, i) => i !== index));
        if (removedVal) {
            setVariantValues(prev => prev.filter(v => v !== removedVal));
        }
    };

    const buildVariantsPayload = () => {
        if (!variantsEnabled || variantValues.length === 0) return null;
        return {
            enabled: true,
            optionName: variantOptionName,
            values: variantValues,
            items: variantRows.map(r => ({
                value: r.value,
                price: r.price ? parseFloat(r.price) : parseFloat(formData.price) || 0,
                salePrice: r.salePrice ? parseFloat(r.salePrice) : null,
                stock: parseInt(r.stock) || 0
            }))
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!formData.name || (!variantsEnabled && !formData.price)) {
                toast.error('Name and price are required');
                setIsLoading(false);
                return;
            }

            if (!isUpdating && hidePickupAddress && existingImages.length === 0 && newImages.length === 0) {
                toast.error('Product photo is required');
                setIsLoading(false);
                return;
            }

            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description || '');
            submitData.append('price', formData.price);
            submitData.append('category', formData.category || '');
            submitData.append('subcategory', formData.subcategory || '');
            submitData.append('stock', formData.stock);
            submitData.append('weight', formData.weight || '');
            submitData.append('length', formData.length || '');
            submitData.append('width', formData.width || '');
            submitData.append('height', formData.height || '');
            if (!hidePickupAddress) {
                submitData.append('pickupAddress', formData.pickupAddress || '');
                submitData.append('pickupCity', formData.pickupCity || '');
                submitData.append('pickupPostCode', formData.pickupPostCode || '');
                submitData.append('pickupLat', formData.pickupLat || '');
                submitData.append('pickupLng', formData.pickupLng || '');
            }
            submitData.append('isActive', formData.isActive.toString());
            
            const variantsPayload = buildVariantsPayload();
            if (variantsPayload) {
                submitData.append('variants', JSON.stringify(variantsPayload));
            } else {
                submitData.append('variants', '');
            }

            // Send existing images that were kept
            submitData.append('existingImages', JSON.stringify(existingImages));

            // Send new image files
            for (const file of newImages) {
                submitData.append('images', file);
            }

            const url = isUpdating ? `/api/products/${productId}` : '/api/products';
            const method = isUpdating ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: submitData
            });

            if (response.ok) {
                const action = isUpdating ? 'updated' : 'created';
                toast.success(`${itemLabels.singular} ${action} successfully`);
                
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push(redirectPath);
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || `Failed to ${isUpdating ? 'update' : 'create'} ${itemLabels.singular.toLowerCase()}`);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(`Failed to ${isUpdating ? 'update' : 'create'} ${itemLabels.singular.toLowerCase()}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingProduct) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">
                    {isUpdating ? `Edit ${itemLabels.singular}` : `${itemLabels.singular} Information`}
                </h5>

                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label htmlFor="name" className="form-label">{itemLabels.singular} Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        {hidePickupAddress ? (
                            <>
                                <div className="col-md-4">
                                    <label htmlFor="category" className="form-label">Category</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedCategory?.name || (shopCategoryLoading || categoriesLoading ? 'Loading...' : 'No category assigned')}
                                        disabled
                                    />
                                    <input type="hidden" name="category" value={formData.category} />
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="subcategory" className="form-label">Subcategory</label>
                                    <select
                                        className="form-select"
                                        id="subcategory"
                                        name="subcategory"
                                        value={formData.subcategory}
                                        onChange={handleInputChange}
                                        disabled={shopCategoryLoading || categoriesLoading || availableSubcategories.length === 0}
                                    >
                                        <option value="">
                                            {shopCategoryLoading || categoriesLoading
                                                ? 'Loading...'
                                                : availableSubcategories.length === 0
                                                    ? 'No subcategories available'
                                                    : 'Select a subcategory'}
                                        </option>
                                        {availableSubcategories.map((sub, index) => (
                                            <option key={index} value={sub}>
                                                {sub}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="col-md-4">
                                    <label htmlFor="category" className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        disabled={categoriesLoading}
                                    >
                                        <option value="">Select a category</option>
                                        {categoriesLoading ? (
                                            <option value="">Loading categories...</option>
                                        ) : (
                                            categories.map((category, index) => (
                                                <option key={category.id || index} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="subcategory" className="form-label">Subcategory</label>
                                    <select
                                        className="form-select"
                                        id="subcategory"
                                        name="subcategory"
                                        value={formData.subcategory}
                                        onChange={handleInputChange}
                                        disabled={!formData.category || availableSubcategories.length === 0}
                                    >
                                        <option value="">
                                            {!formData.category
                                                ? 'Select a category first'
                                                : availableSubcategories.length === 0
                                                    ? 'No subcategories available'
                                                    : 'Select a subcategory'}
                                        </option>
                                        {availableSubcategories.map((sub, index) => (
                                            <option key={index} value={sub}>
                                                {sub}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-4 flex flex-col justify-end">
                            <div className="form-check mt-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="isActive">
                                    Available for Purchase
                                </label>
                            </div>
                            <small className="text-muted">
                                Available products will be visible for order placement
                            </small>
                        </div>
                    </div>

                    {/* Product Variants Section */}
                    <div className="mb-3 border rounded" style={{ overflow: 'hidden' }}>
                        <button
                            type="button"
                            className="w-100 d-flex justify-content-between align-items-center px-3 py-3 bg-white border-0"
                            style={{ cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}
                            onClick={() => setVariantsExpanded(!variantsExpanded)}
                        >
                            <span>Product Variants</span>
                            <i className={`bi bi-chevron-${variantsExpanded ? 'up' : 'down'}`}></i>
                        </button>

                        {variantsExpanded && (
                            <div className="px-3 pb-3 border-top">
                                <div className="form-check mt-3 mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="enableVariants"
                                        checked={variantsEnabled}
                                        onChange={(e) => {
                                            setVariantsEnabled(e.target.checked);
                                            if (!e.target.checked) {
                                                setVariantOptionName('');
                                                setVariantValues([]);
                                                setVariantRows([]);
                                            }
                                        }}
                                    />
                                    <label className="form-check-label fw-semibold" htmlFor="enableVariants">
                                        Enable Variants
                                    </label>
                                </div>

                                {variantsEnabled && (
                                    <>
                                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                            <span className="text-muted fw-medium" style={{ whiteSpace: 'nowrap' }}>Option Name:</span>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                style={{ maxWidth: '180px' }}
                                                placeholder="e.g. Size, Color"
                                                value={variantOptionName}
                                                onChange={(e) => setVariantOptionName(e.target.value)}
                                            />
                                        </div>

                                        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                            <span className="text-muted fw-medium" style={{ whiteSpace: 'nowrap' }}>Values:</span>
                                            {variantValues.length > 0 && (
                                                <div className="d-flex flex-wrap gap-1 align-items-center">
                                                    {variantValues.map((val, i) => (
                                                        <span
                                                            key={i}
                                                            className="badge bg-light text-dark border d-inline-flex align-items-center"
                                                            style={{ fontSize: '0.85rem', padding: '4px 8px', cursor: 'pointer' }}
                                                            onClick={() => handleRemoveVariantValue(val)}
                                                            title="Click to remove"
                                                        >
                                                            {val}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                style={{ maxWidth: '200px' }}
                                                placeholder="Type value & press Enter"
                                                value={variantValueInput}
                                                onChange={(e) => setVariantValueInput(e.target.value)}
                                                onKeyDown={handleVariantValueKeyDown}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                style={{ whiteSpace: 'nowrap' }}
                                                onClick={handleAddVariantValue}
                                            >
                                                + Add Variant Option
                                            </button>
                                        </div>

                                        {variantRows.length > 0 && (
                                            <div className="table-responsive">
                                                <table className="table table-bordered table-sm align-middle mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ minWidth: '80px' }}>{variantOptionName || 'Option'}</th>
                                                            <th style={{ minWidth: '90px' }}>Price</th>
                                                            <th style={{ minWidth: '80px' }}>Stock</th>
                                                            <th style={{ width: '40px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {variantRows.map((row, idx) => (
                                                            <tr key={idx}>
                                                                <td className="fw-medium align-middle">{row.value}</td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="form-control form-control-sm border-0 bg-transparent p-0"
                                                                        value={row.price}
                                                                        onChange={(e) => handleVariantRowChange(idx, 'price', e.target.value)}
                                                                        placeholder="0.00"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm border-0 bg-transparent p-0"
                                                                        value={row.stock}
                                                                        onChange={(e) => handleVariantRowChange(idx, 'stock', e.target.value)}
                                                                        min="0"
                                                                    />
                                                                </td>
                                                                <td className="text-center align-middle">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm p-0 text-muted"
                                                                        onClick={() => handleRemoveVariantRow(idx)}
                                                                        title="Remove"
                                                                        style={{ fontSize: '16px', lineHeight: 1 }}
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {!variantsEnabled && (
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label htmlFor="price" className="form-label">Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="stock" className="form-label">Stock Quantity</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="stock"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            id="description"
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Product Images * <small className="text-muted">({totalImages}/{MAX_IMAGES})</small>
                        </label>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="d-none"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const remaining = MAX_IMAGES - totalImages;
                                if (remaining <= 0) {
                                    toast.error(`Maximum ${MAX_IMAGES} images allowed`);
                                    return;
                                }
                                const toAdd = files.slice(0, remaining);
                                setNewImages(prev => [...prev, ...toAdd]);
                                e.target.value = '';
                            }}
                        />
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {existingImages.map((key, idx) => (
                                <div key={`existing-${idx}`} className="position-relative" style={{ width: '120px', height: '120px' }}>
                                    <img
                                        src={getFileUrl(key)}
                                        alt={`Product ${idx + 1}`}
                                        className="rounded"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', border: idx === 0 ? '2px solid #198754' : '1px solid #dee2e6' }}
                                    />
                                    {idx === 0 && (
                                        <span className="position-absolute top-0 start-0 badge bg-success" style={{ fontSize: '10px', borderRadius: '0 0 4px 0' }}>Main</span>
                                    )}
                                    <button
                                        type="button"
                                        className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '22px', height: '22px', padding: 0, transform: 'translate(30%, -30%)' }}
                                        onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <FaTimes style={{ fontSize: '10px' }} />
                                    </button>
                                </div>
                            ))}
                            {newImages.map((file, idx) => (
                                <div key={`new-${idx}`} className="position-relative" style={{ width: '120px', height: '120px' }}>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`New ${idx + 1}`}
                                        className="rounded"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', border: existingImages.length === 0 && idx === 0 ? '2px solid #198754' : '1px solid #dee2e6' }}
                                    />
                                    {existingImages.length === 0 && idx === 0 && (
                                        <span className="position-absolute top-0 start-0 badge bg-success" style={{ fontSize: '10px', borderRadius: '0 0 4px 0' }}>Main</span>
                                    )}
                                    <button
                                        type="button"
                                        className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '22px', height: '22px', padding: 0, transform: 'translate(30%, -30%)' }}
                                        onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <FaTimes style={{ fontSize: '10px' }} />
                                    </button>
                                </div>
                            ))}
                            {totalImages < MAX_IMAGES && (
                                <button
                                    type="button"
                                    className="rounded d-flex flex-column align-items-center justify-content-center"
                                    style={{ width: '120px', height: '120px', border: '2px dashed #adb5bd', background: '#f8f9fa', cursor: 'pointer' }}
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    <FaPlus className="text-muted mb-1" />
                                    <small className="text-muted">Add Photo</small>
                                </button>
                            )}
                        </div>
                        {totalImages === 0 && (
                            <small className="text-muted d-block mt-1">Upload up to {MAX_IMAGES} images. First image will be the main photo.</small>
                        )}
                    </div>

                    <h6 className="card-title mt-4">Product Dimensions & Weight</h6>
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <label htmlFor="weight" className="form-label">Weight (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="form-control"
                                id="weight"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="length" className="form-label">Length (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="form-control"
                                id="length"
                                name="length"
                                value={formData.length}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="width" className="form-label">Width (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="form-control"
                                id="width"
                                name="width"
                                value={formData.width}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="height" className="form-label">Height (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="form-control"
                                id="height"
                                name="height"
                                value={formData.height}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {!hidePickupAddress && (
                        <>
                            <h6 className="card-title mt-4">Pickup Location</h6>
                            <div className="mb-3">
                                <AddressInput
                                    value={formData.pickupAddress}
                                    onChange={handleAddressChange}
                                    onLocationSelect={handleAddressSelect}
                                    placeholder="Enter pickup address where product will be collected"
                                    label="Pickup Address"
                                />
                            </div>
                            <div className="mb-3">
                                <h6 className="fw-bold mb-2">Selected Pickup Location</h6>
                                <MapComponent
                                    pickupLocation={{
                                        address: formData?.pickupAddress,
                                        city: formData?.pickupCity,
                                        postCode: formData?.pickupPostCode,
                                        lat: formData?.pickupLat,
                                        lng: formData?.pickupLng
                                    }}
                                    onPickupSelect={(location) => {
                                        if (location) {
                                            handleAddressSelect(location);
                                        }
                                    }}
                                    hide={{ dropoff: true, clear: true, tip: true  , pickup: true}}
                                />
                            </div>
                        </>
                    )}
                    <div className="text-end">
                        <button
                            type="button"
                            className="btn btn-secondary me-2"
                            onClick={() => router.push(redirectPath)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {isUpdating ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                `${isUpdating ? 'Update' : 'Create'} ${itemLabels.singular}`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
