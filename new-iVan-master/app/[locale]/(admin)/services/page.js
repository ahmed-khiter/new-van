"use client";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { getFileUrl } from "@/utils/helper";

export default function Page() {
  const router = useRouter();
  const t = useTranslations("AdminPages.servicesList");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const listImageInputRef = useRef(null);
  const [listImageFile, setListImageFile] = useState(null);
  const [listImagePreviewUrl, setListImagePreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    base_price: "",
    isActive: true,
    legacyKey: "",
    homeSection: "",
    sortOrder: "0",
    cardTitle: "",
    listImage: "",
    sliderImage: "",
    previewVideo: "",
    previewPoster: "",
    routeHref: "",
    locationFilterJson: "",
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);

      const response = await fetch(`/api/services?${params.toString()}`);
      const data = await response.json();
      setServices(data?.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error(t("toast_fetch_error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [debouncedSearchQuery]);

  // Removed handleAddService - no longer needed

  const revokeListImagePreview = () => {
    setListImagePreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setListImageFile(null);
    if (listImageInputRef.current) listImageInputRef.current.value = "";
  };

  const handleEditService = (service) => {
    revokeListImagePreview();
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description ?? "",
      price: service.price.toString(),
      base_price: service.base_price ? service.base_price.toString() : "0.00",
      isActive: service.isActive,
      legacyKey: service.legacyKey ?? "",
      homeSection: service.homeSection ?? "",
      sortOrder: String(service.sortOrder ?? 0),
      cardTitle: service.cardTitle ?? "",
      listImage: service.listImage ?? "",
      sliderImage: service.sliderImage ?? "",
      previewVideo: service.previewVideo ?? "",
      previewPoster: service.previewPoster ?? "",
      routeHref: service.routeHref ?? "",
      locationFilterJson: service.locationFilter
        ? JSON.stringify(service.locationFilter, null, 2)
        : "",
    });
    setShowEditModal(true);
  };

  const handleListImageFileChange = (e) => {
    const file = e.target.files?.[0];
    setListImagePreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (!file) {
      setListImageFile(null);
      return;
    }
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PNG, JPG, JPEG, WEBP, and GIF images are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      e.target.value = "";
      return;
    }
    setListImageFile(file);
    setListImagePreviewUrl(URL.createObjectURL(file));
  };

  const clearStoredListImage = () => {
    revokeListImagePreview();
    setFormData((prev) => ({ ...prev, listImage: "" }));
  };

  const handleSaveService = async () => {
    setIsUpdating(true);
    try {
      let locationFilter = null;
      const rawJson = formData.locationFilterJson?.trim();
      if (rawJson) {
        try {
          locationFilter = JSON.parse(rawJson);
        } catch {
          toast.error("Invalid JSON in location filter");
          setIsUpdating(false);
          return;
        }
      }

      let listImageValue = formData.listImage.trim() || null;
      if (listImageFile) {
        const uploadBody = new FormData();
        uploadBody.append("file", listImageFile);
        const uploadRes = await fetch("/api/services/upload", {
          method: "POST",
          body: uploadBody,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          toast.error(err.error || "Failed to upload list image");
          setIsUpdating(false);
          return;
        }
        const { key } = await uploadRes.json();
        listImageValue = key || null;
      }

      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        base_price: parseFloat(formData.base_price),
        isActive: formData.isActive,
        legacyKey: formData.legacyKey.trim() || null,
        homeSection: formData.homeSection.trim() || null,
        sortOrder: parseInt(formData.sortOrder, 10) || 0,
        cardTitle: formData.cardTitle.trim() || null,
        listImage: listImageValue,
        sliderImage: formData.sliderImage.trim() || null,
        previewVideo: formData.previewVideo.trim() || null,
        previewPoster: formData.previewPoster.trim() || null,
        routeHref: formData.routeHref.trim() || null,
        locationFilter,
      };

      // Only update existing service (no create functionality)
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        const updated = await response.json();
        setServices((prevServices) =>
          prevServices.map((svc) => (svc.id === updated.id ? updated : svc))
        );
        toast.success(t("toast_update_success"));
        revokeListImagePreview();
        setShowEditModal(false);
      } else {
        toast.error(t("toast_update_error"));
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(t("toast_generic_error"));
    } finally {
      setIsUpdating(false);
    }
  };

  // Removed delete functionality - only price editing allowed

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
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

  const getPriceLabel = (serviceName) => {
    if (!serviceName) return 'Price (£)';
    
    const serviceNameLower = serviceName.toLowerCase();
    
    // Distance-based services (Van, Recovery, Click & Collect)
    if (serviceNameLower.includes('van') || 
        serviceNameLower.includes('courier') ||
        serviceNameLower.includes('recovery') || 
        serviceNameLower.includes('breakdown') ||
        serviceNameLower.includes('click') || 
        serviceNameLower.includes('collect')) {
      return 'Price per Mile (£)';
    }
    
    // Room-based services (Cleaning)
    else if (serviceNameLower.includes('cleaning') || 
             serviceNameLower.includes('clean')) {
      return 'Price per Room (£)';
    }
    
    // Item-based services (Removals)
    else if (serviceNameLower.includes('removal') || 
             serviceNameLower.includes('rubbish') ||
             serviceNameLower.includes('removals')) {
      return 'Price per Item (£)';
    }
    
    // Fixed price services (Locksmith, Car Key Replacement)
    else if (serviceNameLower.includes('locksmith') || 
             serviceNameLower.includes('key') ||
             serviceNameLower.includes('lock')) {
      return 'Fixed Price (£)';
    }
    
    // Default fallback
    else {
      return 'Price (£)';
    }
  };

  const getPriceDescription = (serviceName) => {
    if (!serviceName) return 'Enter the base price for this service.';
    
    const serviceNameLower = serviceName.toLowerCase();
    
    // Distance-based services
    if (serviceNameLower.includes('van') || 
        serviceNameLower.includes('courier') ||
        serviceNameLower.includes('recovery') || 
        serviceNameLower.includes('breakdown') ||
        serviceNameLower.includes('click') || 
        serviceNameLower.includes('collect')) {
      return 'This price will be multiplied by the distance in kilometers for each job.';
    }
    
    // Room-based services
    else if (serviceNameLower.includes('cleaning') || 
             serviceNameLower.includes('clean')) {
      return 'This price will be multiplied by the number of rooms for each job.';
    }
    
    // Item-based services
    else if (serviceNameLower.includes('removal') || 
             serviceNameLower.includes('rubbish') ||
             serviceNameLower.includes('removals')) {
      return 'This price will be multiplied by the number of items for each job.';
    }
    
    // Fixed price services
    else if (serviceNameLower.includes('locksmith') || 
             serviceNameLower.includes('key') ||
             serviceNameLower.includes('lock')) {
      return 'This is a fixed price that will be charged for each job regardless of complexity.';
    }
    
    // Default fallback
    else {
      return 'Enter the base price for this service.';
    }
  };

  return (
    <>
      <div className="pagetitle">
        <h1>{t("title")}</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/admin-dashboard">{t("breadcrumb_home")}</Link>
            </li>
            <li className="breadcrumb-item">{t("breadcrumb_current")}</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div
              className={`card ${
                isLoading || services?.length === 0 ? "card-custom-min-height" : ""
              }`}
            >
              <div className="d-flex justify-content-between align-items-center my-4 !px-[20px]">
                <div className="col-md-4 p-0">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div
                className={`card-body ${
                  isLoading || services?.length === 0
                    ? "d-flex justify-content-center align-items-center"
                    : ""
                }`}
              >
                {services && services?.length > 0 ? (
                  <>
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">{t("table_number")}</th>
                          <th scope="col">{t("table_name")}</th>
                          <th scope="col">Home</th>
                          <th scope="col">Key</th>
                          <th scope="col">{t("table_description")}</th>
                          <th scope="col">Minimal Call Out Charge</th>
                          <th scope="col">Price</th>
                          <th scope="col">{t("table_status")}</th>
                          <th scope="col">{t("table_action")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="9" className="text-center">
                              <div className="spinner-border" role="status">
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          services.map((service, index) => {
                            return (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{service.cardTitle || service.name}</td>
                                <td>
                                  {service.homeSection ? (
                                    <span className="badge bg-info text-dark">{service.homeSection}</span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                                <td className="small text-muted">{service.legacyKey || "—"}</td>
                                <td>{service.description}</td>
                                <td className="text-center">£{service.base_price || '0.00'}</td>
                                <td className="text-center">£{service.price}</td>
                                <td>{getStatusBadge(service.isActive)}</td>
                                <td>
                                  <span
                                    title="Edit"
                                    className="text-primary me-2"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleEditService(service)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </span>
                                  {(service.legacyKey === "Van" ||
                                    service.name.toLowerCase().includes("courier") ||
                                    service.name.toLowerCase().includes("van")) && (
                                    <Link
                                      href="/vehicle-types"
                                      className="text-success"
                                      title="Manage Vehicle Types"
                                    >
                                      <i className="bi bi-car-front"></i>
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="bi bi-tools text-muted text-6xl opacity-50"></i>
                    </div>
                    <h5 className="text-muted mb-3">No Services Found</h5>
                    <p className="text-muted">{t("empty_text")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Service Modal */}
      <Modal
        show={showEditModal}
        onHide={() => {
          revokeListImagePreview();
          setShowEditModal(false);
        }}
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {t("edit_service")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("form_name")}</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t("form_name_placeholder")}
                disabled
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("form_description")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t("form_description_placeholder")}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Minimal Call Out Charge (£)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="base_price"
                value={formData.base_price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
              <Form.Text className="text-muted">
                This is the minimal call out price that will be added to the calculated price.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{getPriceLabel(editingService?.name || '')}</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
              <Form.Text className="text-muted">
                {getPriceDescription(editingService?.name || '')}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                label={t("form_is_active")}
              />
            </Form.Group>

            <hr />
            <h6 className="mb-3">Homepage card (Book Now / Services / On Demand)</h6>
            <Form.Text className="text-muted d-block mb-3">
              Optional tile shown on the public home when Legacy key and Home section are set. Use Card title to change the label without renaming the pricing record.
            </Form.Text>

            <Form.Group className="mb-3">
              <Form.Label>Card title (display override)</Form.Label>
              <Form.Control
                type="text"
                name="cardTitle"
                value={formData.cardTitle}
                onChange={handleInputChange}
                placeholder="Leave empty to use translation / name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Legacy key</Form.Label>
              <Form.Control
                type="text"
                name="legacyKey"
                value={formData.legacyKey}
                onChange={handleInputChange}
                placeholder='e.g. "Book a Table" — must match site routing/i18n'
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Home section</Form.Label>
              <Form.Select
                name="homeSection"
                value={formData.homeSection}
                onChange={handleInputChange}
              >
                <option value="">— Not on home —</option>
                <option value="ordering">ordering (On demand row)</option>
                <option value="reservation">reservation (Book now)</option>
                <option value="booking">booking (Services / dispatch)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sort order</Form.Label>
              <Form.Control
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>List / card image</Form.Label>
              <Form.Control
                ref={listImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleListImageFileChange}
                className="mb-2"
              />
              <Form.Text className="text-muted d-block mb-2">
                Choose an image (max 5MB). It uploads to storage when you save.
              </Form.Text>
              {(listImagePreviewUrl ||
                (formData.listImage &&
                  (getFileUrl(formData.listImage) || formData.listImage))) && (
                <div className="d-flex align-items-start gap-3 flex-wrap">
                  <div
                    className="border rounded overflow-hidden bg-light"
                    style={{ width: 160, height: 100 }}
                  >
                    <img
                      alt="List image preview"
                      src={
                        listImagePreviewUrl ||
                        getFileUrl(formData.listImage) ||
                        formData.listImage
                      }
                      className="w-100 h-100 object-fit-contain"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {formData.listImage && !listImageFile && (
                      <Form.Text className="text-muted small mb-0">
                        Saved: {formData.listImage}
                      </Form.Text>
                    )}
                    {listImageFile && (
                      <Button
                        type="button"
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          revokeListImagePreview();
                        }}
                      >
                        Clear new selection
                      </Button>
                    )}
                    {(formData.listImage || listImageFile) && (
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={clearStoredListImage}
                      >
                        Remove image from service
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Slider / hero image (optional)</Form.Label>
              <Form.Control
                type="text"
                name="sliderImage"
                value={formData.sliderImage}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Preview video URL (optional)</Form.Label>
              <Form.Control
                type="text"
                name="previewVideo"
                value={formData.previewVideo}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Preview poster (optional)</Form.Label>
              <Form.Control
                type="text"
                name="previewPoster"
                value={formData.previewPoster}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Route (in-app path)</Form.Label>
              <Form.Control
                type="text"
                name="routeHref"
                value={formData.routeHref}
                onChange={handleInputChange}
                placeholder="/reservations?service=beauty"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location filter (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="locationFilterJson"
                value={formData.locationFilterJson}
                onChange={handleInputChange}
                placeholder='e.g. {"onlyIn":["GB"]} or {"excludeIn":["GB"]}'
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              revokeListImagePreview();
              setShowEditModal(false);
            }}
            disabled={isUpdating}
          >
            {t("cancel")}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveService}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              t("update")
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
}
