"use client";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import AddressInput from "@/components/Fields/AddressInput";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

export default function Page() {
  const router = useRouter();
  const t = useTranslations("AdminPages.luggageItems");
  const { isGoogleMapsLoaded } = useGoogleMaps();
  
  // Items state
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [luggageItems, setLuggageItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    name: "",
    type: "luggage",
    price: "",
    isActive: true
  });

  // Locations state
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locations, setLocations] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [locationFormData, setLocationFormData] = useState({
    address1: "",
    city: "",
    postCode: "",
    latitude: "",
    longitude: "",
    isActive: true
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLuggageItems = async () => {
    setIsLoadingItems(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);

      const response = await fetch(`/api/luggage-items?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch luggage items");
      }
      
      const data = await response.json();
      setLuggageItems(data?.luggageItems || []);
    } catch (error) {
      console.error("Error fetching luggage items:", error);
      toast.error("Failed to fetch luggage items");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await fetch(`/api/luggage-locations`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch luggage locations");
      }
      
      const data = await response.json();
      setLocations(data?.luggageLocations || []);
    } catch (error) {
      console.error("Error fetching luggage locations:", error);
      toast.error("Failed to fetch luggage locations");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchLuggageItems();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Items handlers
  const handleAddNewItem = () => {
    setEditingItem(null);
    setItemFormData({
      name: "",
      type: "luggage",
      price: "",
      isActive: true
    });
    setShowItemModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      type: item.type || "luggage",
      price: item.price.toString(),
      isActive: item.isActive
    });
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await fetch(`/api/luggage-items/${itemId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Item deleted successfully");
        fetchLuggageItems();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleSaveItem = async () => {
    if (!itemFormData.name || !itemFormData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSavingItem(true);
    try {
      const itemData = {
        ...itemFormData,
        price: parseFloat(itemFormData.price)
      };

      const url = editingItem 
        ? `/api/luggage-items/${editingItem.id}`
        : `/api/luggage-items`;
      
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        toast.success(editingItem ? "Item updated successfully" : "Item created successfully");
        setShowItemModal(false);
        fetchLuggageItems();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save item");
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleItemInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItemFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Locations handlers
  const handleAddNewLocation = () => {
    setEditingLocation(null);
    setSelectedAddress(null);
    setLocationFormData({
      address1: "",
      city: "",
      postCode: "",
      latitude: "",
      longitude: "",
      isActive: true
    });
    setShowLocationModal(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setSelectedAddress({
      address: location.address1,
      city: location.city || '',
      postcode: location.postCode || '',
      lat: location.latitude,
      lng: location.longitude
    });
    setLocationFormData({
      address1: location.address1,
      city: location.city || "",
      postCode: location.postCode || "",
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      isActive: location.isActive
    });
    setShowLocationModal(true);
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return;
    }

    try {
      const response = await fetch(`/api/luggage-locations/${locationId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Location deleted successfully");
        fetchLocations();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete location");
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const handleAddressSelect = (locationData) => {
    setSelectedAddress(locationData);
    setLocationFormData(prev => ({
      ...prev,
      address1: locationData.address || "",
      city: locationData.city || "",
      postCode: locationData.postcode || "",
      latitude: locationData.lat?.toString() || "",
      longitude: locationData.lng?.toString() || ""
    }));
  };

  const handleSaveLocation = async () => {
    if (!locationFormData.address1 || !locationFormData.latitude || !locationFormData.longitude) {
      toast.error("Please fill in all required fields (Address and Location)");
      return;
    }

    setIsSavingLocation(true);
    try {
      // Auto-generate name from address
      // Use address1 as the base name, append city if available for uniqueness
      let generatedName = locationFormData.address1;
      if (locationFormData.city) {
        generatedName = `${locationFormData.address1}, ${locationFormData.city}`;
      }
      
      // For updates, keep existing name; for new locations, use generated name
      const name = editingLocation ? editingLocation.name : generatedName;

      const locationData = {
        ...locationFormData,
        name: name,
        latitude: parseFloat(locationFormData.latitude),
        longitude: parseFloat(locationFormData.longitude)
      };

      const url = editingLocation 
        ? `/api/luggage-locations/${editingLocation.id}`
        : `/api/luggage-locations`;
      
      const method = editingLocation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        toast.success(editingLocation ? "Location updated successfully" : "Location created successfully");
        setShowLocationModal(false);
        fetchLocations();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save location");
      }
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleLocationInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocationFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <>
      <div className="pagetitle">
        <h1>Luggage Management</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/admin-dashboard">Home</Link>
            </li>
            <li className="breadcrumb-item">Luggage</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="row">
          {/* Items Column - 6 columns */}
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title mb-0">
                    <i className="bi bi-bag me-2 text-primary"></i>
                    Luggage Items
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    {luggageItems?.length || 0} {luggageItems?.length === 1 ? 'item' : 'items'} total
                  </p>
                </div>
                <Button variant="primary" onClick={handleAddNewItem} size="sm">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Item
                </Button>
              </div>
              <div className="card-body">
                {/* Search Bar */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search items by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Items Table */}
                {isLoadingItems ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-3 mb-0">Loading items...</p>
                  </div>
                ) : luggageItems && luggageItems?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th scope="col" style={{ width: "50px" }}>#</th>
                          <th scope="col">Item Name</th>
                          <th scope="col" className="text-center" style={{ width: "120px" }}>Type</th>
                          <th scope="col" className="text-center" style={{ width: "120px" }}>Price</th>
                          <th scope="col" className="text-center" style={{ width: "100px" }}>Status</th>
                          <th scope="col" className="text-center" style={{ width: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {luggageItems.map((item, index) => {
                          return (
                            <tr key={item.id}>
                              <td className="text-muted">{index + 1}</td>
                              <td>
                                <strong>{item.name}</strong>
                              </td>
                              <td className="text-center">
                                <span className={`badge ${item.type === "Dry cleaning" ? "bg-info" : "bg-primary"}`}>
                                  {item.type || "luggage"}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="fw-semibold">£{parseFloat(item.price).toFixed(2)}</span>
                              </td>
                              <td className="text-center">{getStatusBadge(item.isActive)}</td>
                              <td className="text-center">
                                <Button
                                  variant="link"
                                  className="p-0 me-2"
                                  title="Edit"
                                  onClick={() => handleEditItem(item)}
                                  style={{ minWidth: "auto" }}
                                >
                                  <i className="bi bi-pencil-square text-primary"></i>
                                </Button>
                                <Button
                                  variant="link"
                                  className="p-0"
                                  title="Delete"
                                  onClick={() => handleDeleteItem(item.id)}
                                  style={{ minWidth: "auto" }}
                                >
                                  <i className="bi bi-trash text-danger"></i>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-bag text-muted" style={{ fontSize: "4rem", opacity: 0.3 }}></i>
                    </div>
                    <h5 className="text-muted mb-2">No Items Found</h5>
                    <p className="text-muted small mb-3">
                      {searchQuery ? "Try a different search term" : "Get started by adding your first luggage item"}
                    </p>
                    <Button variant="outline-primary" onClick={handleAddNewItem} size="sm">
                      <i className="bi bi-plus-circle me-2"></i>
                      Add First Item
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Locations Column - 6 columns */}
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title mb-0">
                    <span className="me-2">📍</span>
                    Luggage Locations
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    {locations?.length || 0} {locations?.length === 1 ? 'location' : 'locations'} configured
                  </p>
                </div>
                <Button variant="primary" onClick={handleAddNewLocation} size="sm">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Location
                </Button>
              </div>
              <div className="card-body">
                {/* Locations Table */}
                {isLoadingLocations ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-3 mb-0">Loading locations...</p>
                  </div>
                ) : locations && locations?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                        <tr>
                          <th scope="col" style={{ width: "50px" }}>#</th>
                          <th scope="col">Location</th>
                          <th scope="col">Full Address</th>
                          <th scope="col" className="text-center" style={{ width: "100px" }}>Status</th>
                          <th scope="col" className="text-center" style={{ width: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((location, index) => {
                          return (
                            <tr key={location.id}>
                              <td className="text-muted">{index + 1}</td>
                              <td>
                                <strong className="text-primary">
                                  {location.address1}
                                  {location.city && `, ${location.city}`}
                                </strong>
                                {location.postCode && (
                                  <div className="small text-muted">{location.postCode}</div>
                                )}
                              </td>
                              <td>
                                <small className="text-muted">
                                  {location.address1}
                                  {location.city && `, ${location.city}`}
                                  {location.postCode && ` ${location.postCode}`}
                                </small>
                              </td>
                              <td className="text-center">{getStatusBadge(location.isActive)}</td>
                              <td className="text-center">
                                <Button
                                  variant="link"
                                  className="p-0 me-2"
                                  title="Edit"
                                  onClick={() => handleEditLocation(location)}
                                  style={{ minWidth: "auto" }}
                                >
                                  <i className="bi bi-pencil-square text-primary"></i>
                                </Button>
                                <Button
                                  variant="link"
                                  className="p-0"
                                  title="Delete"
                                  onClick={() => handleDeleteLocation(location.id)}
                                  style={{ minWidth: "auto" }}
                                >
                                  <i className="bi bi-trash text-danger"></i>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <span className="text-muted" style={{ fontSize: "4rem", opacity: 0.3 }}>📍</span>
                    </div>
                    <h5 className="text-muted mb-2">No Locations Found</h5>
                    <p className="text-muted small mb-3">
                      Get started by adding your first cleaning location
                    </p>
                    <Button variant="outline-primary" onClick={handleAddNewLocation} size="sm">
                      <i className="bi bi-plus-circle me-2"></i>
                      Add First Location
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add/Edit Item Modal */}
      <Modal show={showItemModal} onHide={() => setShowItemModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? "Edit Luggage Item" : "Add New Luggage Item"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={itemFormData.name}
                onChange={handleItemInputChange}
                placeholder="e.g., T Shirt, Jumper, Jacket"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="type"
                value={itemFormData.type}
                onChange={handleItemInputChange}
                required
              >
                <option value="luggage">Luggage</option>
                <option value="Dry cleaning">Dry cleaning</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Select the type of service for this item.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price (£) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={itemFormData.price}
                onChange={handleItemInputChange}
                placeholder="0.00"
                required
              />
              <Form.Text className="text-muted">
                Enter the fixed price for this item.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isActive"
                checked={itemFormData.isActive}
                onChange={handleItemInputChange}
                label="Active"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowItemModal(false)}
            disabled={isSavingItem}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveItem}
            disabled={isSavingItem}
          >
            {isSavingItem ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {editingItem ? "Updating..." : "Creating..."}
              </>
            ) : (
              editingItem ? "Update" : "Create"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Location Modal */}
      <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingLocation ? "Edit Luggage Location" : "Add New Luggage Location"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Address <span className="text-danger">*</span></Form.Label>
              {!isGoogleMapsLoaded && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800 mb-0">🔄 Loading maps...</p>
                </div>
              )}
              <AddressInput
                value={selectedAddress?.address || locationFormData.address1}
                onChange={(val) => {
                  setLocationFormData(prev => ({ ...prev, address1: val }));
                }}
                onLocationSelect={handleAddressSelect}
                placeholder="Enter address"
                label=""
              />
            </Form.Group>

            <div className="row">
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={locationFormData.city}
                  onChange={handleLocationInputChange}
                  placeholder="City"
                />
              </Form.Group>

              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Post Code</Form.Label>
                <Form.Control
                  type="text"
                  name="postCode"
                  value={locationFormData.postCode}
                  onChange={handleLocationInputChange}
                  placeholder="Post Code"
                />
              </Form.Group>
            </div>

            <div className="row">
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Latitude <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  name="latitude"
                  value={locationFormData.latitude}
                  onChange={handleLocationInputChange}
                  placeholder="51.5074"
                  required
                />
                <Form.Text className="text-muted">
                  Auto-filled when you select an address, or enter manually.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Longitude <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  name="longitude"
                  value={locationFormData.longitude}
                  onChange={handleLocationInputChange}
                  placeholder="-0.1278"
                  required
                />
                <Form.Text className="text-muted">
                  Auto-filled when you select an address, or enter manually.
                </Form.Text>
              </Form.Group>
            </div>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isActive"
                checked={locationFormData.isActive}
                onChange={handleLocationInputChange}
                label="Active"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowLocationModal(false)}
            disabled={isSavingLocation}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveLocation}
            disabled={isSavingLocation}
          >
            {isSavingLocation ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {editingLocation ? "Updating..." : "Creating..."}
              </>
            ) : (
              editingLocation ? "Update" : "Create"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

