"use client";
import "./ProfilePage.css";
import AddressInput from "@/components/Fields/AddressInput";
import MapComponent from "@/components/MapComponent";
import PhoneInput from "@/components/Fields/PhoneInput";
import { LOCALES, LOCALE_NAMES, usePathname, useRouter } from "@/i18n/routing";
import { AppContext } from "@/lib/contexts/context";
import { getFileUrl, getNameInitials } from "@/utils/helper";
import { useCategories } from "@/hooks/useCategories";
import { LOCALE_FLAGS } from "@/utils/localeFlags";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useContext, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FaPen } from "react-icons/fa6";
import * as yup from "yup";
import { Form } from "react-bootstrap";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import Gallery from "@/components/Gallery";

const ProfilePage = ({ userRole }) => {
  const t = useTranslations("ProviderPages.profile");
  const { setUserName, fetchPlans } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale();
  const dashboardRoute = `/${userRole}-dashboard`;
  // Define all shop owner roles (case-insensitive check)
  const shopOwnerRoles = [
    "shop-owner", "restaurant", "shop", "mot", "spa", "shisha",
    "health", "healthcare", "beauty", "events", "entertainment"
  ];
  const isShopOwner = shopOwnerRoles.some(role => 
    userRole?.toLowerCase() === role.toLowerCase()
  );
  // Check if user role is a restaurant type (for restaurant-specific features)
  const isRestaurant = userRole?.toLowerCase() === "restaurant";

  // Helper to get the display name for the business type
  const getBusinessTypeName = (role) => {
    const roleMap = {
      'restaurant': 'Restaurant',
      'shop': 'Shop',
      'shop-owner': 'Shop',
      'mot': 'MOT',
      'spa': 'Spa',
      'shisha': 'Shisha',
      'health': 'Health',
      'healthcare': 'Healthcare',
      'beauty': 'Beauty',
      'events': 'Events',
      'entertainment': 'Entertainment',
    };
    return roleMap[role?.toLowerCase()] || 'Shop';
  };

  const toTitleCaseWords = (value = "") =>
    value
      .toLowerCase()
      .split(" ")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
      .join(" ");

  const businessName = getBusinessTypeName(userRole);
  const [shopType, setShopType] = useState(null);
  
  // Determine category type for fetching categories
  // Use shopType if available, otherwise fallback based on userRole
  const categoryType = shopType || (isRestaurant ? "restaurant" : isShopOwner ? "shop" : null);
  const { categories, loading: categoriesLoading } = useCategories(categoryType);

  // Dynamic schema based on user role
  const schema = yup.object().shape({
    firstName: yup
      .string()
      .required("First name is required")
      .min(3, "First name must be at least 3 characters"),
    lastName: yup
      .string()
      .required("Last name is required")
      .min(3, "Last name must be at least 3 characters"),
    email: yup
      .string()
      .required("Email is required")
      .email("Please enter a valid email"),
    address1: yup
      .string()
      .required("Address is required")
      .min(3, "Address must be at least 3 characters"),
    ...(isShopOwner ? {
      shopName: yup
        .string()
        .required(`${businessName} name is required`)
        .min(3, `${businessName} name must be at least 3 characters`),
      shopPhone: yup.string().optional(),
      shopCategory: yup.string().optional(),
      phone: yup.string().optional(),
    } : {}),
    ...(userRole === "provider" || userRole === "visitor" ? {
      phone: yup.string().optional(),
    } : {})
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [shopDetails, setShopDetail] = useState(null);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [preferredLocale, setPreferredLocale] = useState("");
  const [onHover, setOnHover] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [acceptsReservations, setAcceptsReservations] = useState(false);
  // Available days for selection
  const allDays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const [shopMetadata, setShopMetadata] = useState({
    openingHours: [], // Array of { day: 'monday', label: 'Monday', open: '09:00', close: '17:00' }
    halal: false
  });
  const [showAddDayDropdown, setShowAddDayDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Profile picture states for all users
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);
  const [profileOnHover, setProfileOnHover] = useState(false);
  const [profileFileInputKey, setProfileFileInputKey] = useState(Date.now());

  // Gallery states for shop owners
  const [gallery, setGallery] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadImage, setUploadImage] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [galleryCaption, setGalleryCaption] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const galleryFileInputRef = useRef(null);

  // Update email states
  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const address1 = watch("address1");
  const city = watch("city");
  const postCode = watch("postCode");
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  // Functions to manage opening hours
  const addOpeningHoursDay = (dayKey) => {
    const dayInfo = allDays.find(d => d.key === dayKey);
    if (!dayInfo) return;
    
    // Check if day already exists
    const exists = shopMetadata.openingHours.some(oh => oh.day === dayKey);
    if (exists) {
      toast.error(`${dayInfo.label} is already added`);
      return;
    }
    
    setShopMetadata({
      ...shopMetadata,
      openingHours: [
        ...shopMetadata.openingHours,
        {
          day: dayKey,
          label: dayInfo.label,
          open: "",
          close: ""
        }
      ]
    });
    setShowAddDayDropdown(false); // Close dropdown after adding
  };

  const removeOpeningHoursDay = (index) => {
    setShopMetadata({
      ...shopMetadata,
      openingHours: shopMetadata.openingHours.filter((_, i) => i !== index)
    });
  };

  const updateOpeningHours = (index, field, value) => {
    const updated = [...shopMetadata.openingHours];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setShopMetadata({
      ...shopMetadata,
      openingHours: updated
    });
  };

  // Get available days that haven't been added yet
  const getAvailableDays = () => {
    const addedDays = shopMetadata.openingHours.map(oh => oh.day);
    return allDays.filter(day => !addedDays.includes(day.key));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddDayDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAddDayDropdown(false);
      }
    };

    if (showAddDayDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddDayDropdown]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/profile");
        if (!response.ok) throw new Error("Failed to fetch profile data");
        const data = await response.json();

        if (isShopOwner && (data.shop || data.restaurant)) {
          const { profile, shop, restaurant } = data;
          const shopData = shop || restaurant; // Handle both shop and restaurant
          
          // Set shop type for category filtering - supports: shop, restaurant, mot, shisha, spa, beauty, healthcare, events, entertainment
          const detectedShopType = shopData?.type || (userRole === "restaurant" ? "restaurant" : "shop");
          setShopType(detectedShopType);
          
          setPreviewUrl(getFileUrl(shopData?.image) || null);
          reset({
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            email: profile?.email || "",
            phone: profile?.phone || "",
            shopName: shopData?.name || "",
            shopPhone: shopData?.phone || "",
            shopCategory: shopData?.category || "",
            address1: shopData?.address1 || "",
            address2: shopData?.address2 || "",
            city: shopData?.city || "",
            postCode: shopData?.postCode || "",
            latitude: shopData?.latitude || null,
            longitude: shopData?.longitude || null,
          });
          setPreferredLocale(profile.preferredLocale || "");
          setShopDetail(data);
          if (isRestaurant) {
            setAcceptsReservations(shopData?.acceptsReservations || false);
          }
          // Load shop metadata if available
          if (shopData?.shop_metadata && typeof shopData.shop_metadata === 'object') {
            let openingHoursArray = [];
            
            // Convert old object format to new array format if needed
            if (Array.isArray(shopData.shop_metadata.openingHours)) {
              openingHoursArray = shopData.shop_metadata.openingHours;
            } else if (shopData.shop_metadata.openingHours && typeof shopData.shop_metadata.openingHours === 'object') {
              // Convert object format { monday: { open, close }, ... } to array format
              Object.keys(shopData.shop_metadata.openingHours).forEach(dayKey => {
                const dayData = shopData.shop_metadata.openingHours[dayKey];
                if (dayData && (dayData.open || dayData.close)) {
                  const dayInfo = allDays.find(d => d.key === dayKey);
                  if (dayInfo) {
                    openingHoursArray.push({
                      day: dayKey,
                      label: dayInfo.label,
                      open: dayData.open || "",
                      close: dayData.close || ""
                    });
                  }
                }
              });
            }
            
            setShopMetadata({
              openingHours: openingHoursArray,
              halal: shopData.shop_metadata.halal || false
            });
          } else {
            // Fallback: try to load from old openingHours field if it exists (for migration)
            if (shopData?.openingHours && typeof shopData.openingHours === 'object') {
              const openingHoursArray = [];
              Object.keys(shopData.openingHours).forEach(dayKey => {
                const dayData = shopData.openingHours[dayKey];
                if (dayData && (dayData.open || dayData.close)) {
                  const dayInfo = allDays.find(d => d.key === dayKey);
                  if (dayInfo) {
                    openingHoursArray.push({
                      day: dayKey,
                      label: dayInfo.label,
                      open: dayData.open || "",
                      close: dayData.close || ""
                    });
                  }
                }
              });
              setShopMetadata(prev => ({
                ...prev,
                openingHours: openingHoursArray
              }));
            }
          }
        } else {
          const { profile } = data;
          setPreviewUrl(profile.image_url || null);
          setProfilePreviewUrl(profile?.profilePictureUrl || null);
          reset({
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            email: profile?.email || "",
            phone: profile?.phone || "",
            address1: profile?.address1 || "",
            address2: profile?.address2 || "",
            city: profile?.city || "",
            postCode: profile?.postCode || "",
            latitude: profile?.latitude || null,
            longitude: profile?.longitude || null,
          });
          setPreferredLocale(profile.preferredLocale || "");
        }
        setIsLoading(false);
      } catch (error) {
        toast.error("Failed to fetch profile data");
        setIsLoading(false);
      }
    };

    fetchUserData();
    
    // Fetch gallery for shop owners
    if (isShopOwner) {
      fetchGallery();
    }
  }, [isShopOwner]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setIsLoadingUpdate(true);
    const updatedData = new FormData();
    const formattedShopName = toTitleCaseWords(data.shopName || "");
    updatedData.append("firstName", data.firstName);
    updatedData.append("lastName", data.lastName);
    updatedData.append("email", data.email);
    if (preferredLocale) {
      updatedData.append("preferredLocale", preferredLocale);
    }

    if (image) {
      updatedData.append("image", image);
    }

    // Add profile picture for all users
    if (profileImage) {
      updatedData.append("profilePicture", profileImage);
    }

    // Address fields for all users
    if (data.address1) updatedData.append("address1", data.address1);
    if (data.address2) updatedData.append("address2", data.address2);
    if (data.city) updatedData.append("city", data.city);
    if (data.postCode) updatedData.append("postCode", data.postCode);
    if (data.latitude) updatedData.append("latitude", data.latitude);
    if (data.longitude) updatedData.append("longitude", data.longitude);

    // Phone number for all users
    updatedData.append("phone", data.phone || "");

    // Shop owner specific fields
    if (isShopOwner) {
      updatedData.append("shopName", formattedShopName);
      updatedData.append("shopPhone", data.shopPhone || "");
      updatedData.append("shopCategory", data.shopCategory || "");
      updatedData.append("shop_metadata", JSON.stringify(shopMetadata));
      if (isRestaurant) {
        updatedData.append("acceptsReservations", acceptsReservations);
      }
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        body: updatedData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && errorData.errors.length > 0) {
          errorData.errors.forEach((error) => {
            toast.error(`${error.field || ""} ${error.message || ""}`);
          });
        }
      }

      const responseData = await response.json();
      
      if (isShopOwner) {
        setShopDetail(responseData || null);
        setPreferredLocale(responseData?.profile?.preferredLocale || "");
        if (image && responseData.shop?.image) {
          localStorage.setItem("userImage", responseData.shop?.image || "");
        }
        if (isRestaurant && responseData.shop?.acceptsReservations !== undefined) {
          setAcceptsReservations(responseData.shop.acceptsReservations);
        }
      } else {
        setPreferredLocale(responseData?.profile?.preferredLocale || "");
      }

      const { firstName, lastName } = responseData?.profile;
      setUserName(firstName + " " + lastName);

      // Update profile picture in header if available
      if (responseData?.profile?.profilePictureUrl) {
        // Update localStorage for header components
        localStorage.setItem("userProfilePicture", responseData.profile.profilePictureUrl);
        // Trigger a custom event to update all header components
        window.dispatchEvent(new CustomEvent('profilePictureUpdated', {
          detail: { profilePictureUrl: responseData.profile.profilePictureUrl }
        }));
      }

      if (responseData.message) {
        toast.success(responseData.message);
      }
      fetchPlans();
      // If language changed, navigate to same path with new locale
      const newLocale = responseData?.profile?.preferredLocale;
      if (newLocale && newLocale !== activeLocale) {
        try {
          localStorage.setItem("preferredLocale", newLocale);
        } catch (_) { }
        try {
          document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
        } catch (_) { }
        try {
          const nonLocalizedPath = pathname.replace(new RegExp(`^/${activeLocale}(?=/|$)`), "") || "/";
          router.replace(nonLocalizedPath, { locale: newLocale });
        } catch (_) {
          router.replace(dashboardRoute, { locale: newLocale });
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // toast.error("Failed to update profile");
    } finally {
      setIsLoadingUpdate(false);
    }
  };

  const handleAddressSelect = (loc) => {
    setValue("address1", loc.address);
    setValue("city", loc.city);
    setValue("postCode", loc.postcode);
    setValue("latitude", loc.lat);
    setValue("longitude", loc.lng);
  };

  const handleEditClick = () => {
    document.getElementById("imageInput").click();
  };

  const handleProfileEditClick = () => {
    document.getElementById("profileImageInput").click();
  };

  // Gallery functions
  const fetchGallery = async () => {
    try {
      setIsLoadingGallery(true);
      const response = await fetch('/api/shops/gallery?type=gallery');
      if (response.ok) {
        const data = await response.json();
        setGallery(data.gallery || []);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleGalleryImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PNG, JPG, JPEG, and WEBP images are allowed');
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      setUploadImage(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryUpload = async () => {
    if (!uploadImage) {
      toast.error('Please select an image');
      return;
    }

    try {
      setIsLoadingGallery(true);
      const formData = new FormData();
      formData.append('image', uploadImage);
      if (galleryCaption.trim()) {
        formData.append('caption', galleryCaption.trim());
      }

      const response = await fetch('/api/shops/gallery', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setGallery(prev => [...prev, data.galleryItem]);
        toast.success('Image uploaded successfully');
        handleCloseUploadModal();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsLoadingGallery(true);
      const response = await fetch(`/api/shops/gallery/${itemToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setGallery(prev => prev.filter(item => item.id !== itemToDelete.id));
        toast.success('Image deleted successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsLoadingGallery(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadImage(null);
    setUploadPreview(null);
    setGalleryCaption('');
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
  };

  // Email update functions
  const handleOpenUpdateEmailModal = () => {
    setNewEmail(watch("email") || "");
    setEmailError("");
    setShowUpdateEmailModal(true);
  };

  const handleCloseUpdateEmailModal = () => {
    setShowUpdateEmailModal(false);
    setNewEmail("");
    setEmailError("");
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleUpdateEmail = async () => {
    // Validate email
    if (!newEmail.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (newEmail === watch("email")) {
      setEmailError("New email must be different from current email");
      return;
    }

    setIsUpdatingEmail(true);
    setEmailError("");

    try {
      const response = await fetch("/api/profile/update-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.error || "Failed to update email");
        return;
      }

      // Update the form with new email
      setValue("email", newEmail);
      toast.success(data.message || "Email updated successfully");
      handleCloseUpdateEmailModal();
    } catch (error) {
      console.error("Error updating email:", error);
      setEmailError("Failed to update email. Please try again.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <>
      <section className="section">
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t("loading")}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                {/* Profile Picture Section - Only for non-shop owners */}
                {!isShopOwner && (
                  <div className="profile-section-card">
                    <h6 className="profile-section-title">PROFILE PHOTO</h6>
                    <div className="store-photo-row">
                      <div className="store-photo-avatar">
                        {profilePreviewUrl ? (
                          <Image
                            src={profilePreviewUrl}
                            alt="Profile"
                            width={64}
                            height={64}
                            unoptimized
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#555' }}>
                            {getNameInitials(
                              `${watch("firstName")} ${watch("lastName")}`
                            )}
                          </div>
                        )}
                      </div>
                      <span className="store-photo-label">Profile Photo</span>
                      <button
                        type="button"
                        onClick={handleProfileEditClick}
                        className="pill-btn-primary"
                        style={{ marginLeft: 'auto' }}
                      >
                        Change Photo
                      </button>
                      <input
                        id="profileImageInput"
                        type="file"
                        accept="image/*"
                        className="form-control"
                        style={{ display: "none" }}
                        key={profileFileInputKey}
                        onChange={(e) => {
                          handleProfileImageChange(e);
                          setProfileFileInputKey(Date.now());
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* STORE MEDIA Card - Shop owners only */}
                {isShopOwner && (
                  <div className="profile-section-card">
                    <h6 className="profile-section-title">STORE MEDIA</h6>

                    {/* Store Profile Photo Row */}
                    <div className="store-photo-row">
                      <div className="store-photo-avatar">
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt={businessName}
                            width={64}
                            height={64}
                            unoptimized
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#555' }}>
                            {getNameInitials(
                              watch("shopName") ||
                                `${shopDetails?.profile?.firstName} ${shopDetails?.profile?.lastName}`
                            )}
                          </div>
                        )}
                      </div>
                      <span className="store-photo-label">Store Profile Photo</span>
                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="pill-btn-primary"
                        style={{ marginLeft: 'auto' }}
                      >
                        Change Photo
                      </button>
                      <input
                        id="imageInput"
                        type="file"
                        accept="image/*"
                        className="form-control"
                        style={{ display: "none" }}
                        key={fileInputKey}
                        onChange={(e) => {
                          handleImageChange(e);
                          setFileInputKey(Date.now());
                        }}
                      />
                    </div>

                    {/* Store Gallery */}
                    <div>
                      <h6 style={{ fontWeight: '600', color: '#333', fontSize: '15px', marginBottom: '14px' }}>Store Gallery</h6>
                      {isLoadingGallery && gallery.length === 0 ? (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="store-gallery-grid">
                          {gallery.length < 8 && (
                            <div
                              onClick={() => setShowUploadModal(true)}
                              className="gallery-add-btn"
                            >
                              <span style={{ fontSize: '28px', color: '#8899bb', lineHeight: 1 }}>+</span>
                              <span style={{ fontSize: '13px', color: '#8899bb', marginTop: '4px' }}>Add Photo</span>
                            </div>
                          )}
                          {gallery.map((item, index) => (
                            <div key={item.id || index} className="gallery-item">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.caption || 'Gallery'}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  unoptimized
                                />
                              ) : (
                                <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="bi bi-image text-muted"></i>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                disabled={isLoadingGallery}
                                className="gallery-delete-btn"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p style={{ color: '#9aa5b4', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>Up to 8 photos</p>
                    </div>
                  </div>
                )}

                <div className="profile-section-card">
                  <h6 className="profile-section-title">ACCOUNT DETAILS</h6>
                  <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="firstName" className="form-label">
                      {t("first_name_label")}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.firstName ? "is-invalid" : ""
                      }`}
                      id="firstName"
                      placeholder={t("first_name_placeholder")}
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback">
                        {errors.firstName.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="lastName" className="form-label">
                      {t("last_name_label")}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.lastName ? "is-invalid" : ""
                      }`}
                      id="lastName"
                      placeholder={t("last_name_placeholder")}
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback">
                        {errors.lastName.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-12">
                    <div className="email-label-row">
                      <label htmlFor="email" className="form-label mb-0">
                        {t("email_label")}
                      </label>
                      <span className="verified-badge">
                        <span className="verified-badge-icon">✓</span>
                        Verified Email
                      </span>
                    </div>
                    <div className="email-input-row">
                      <input
                        type="email"
                        className={`form-control ${
                          errors.email ? "is-invalid" : ""
                        }`}
                        id="email"
                        placeholder={t("email_placeholder")}
                        disabled
                        {...register("email")}
                      />
                      <button
                        type="button"
                        onClick={handleOpenUpdateEmailModal}
                        className="pill-btn-primary"
                      >
                        Update Email
                      </button>
                    </div>
                    {errors.email && (
                      <div className="invalid-feedback d-block">
                        {errors.email.message}
                      </div>
                    )}
                  </div>

                  {userRole === "provider" && (
                    <>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="preferredLocale" className="form-label">
                          {t("language")}
                        </label>
                        <select
                          id="preferredLocale"
                          className="form-select"
                          value={preferredLocale}
                          onChange={(e) => setPreferredLocale(e.target.value)}
                        >
                          <option value="">{t("select_language")}</option>
                          {LOCALES.map((loc) => (
                            <option key={loc} value={loc}>
                              {LOCALE_FLAGS[loc] || '🌐'} {LOCALE_NAMES[loc] || loc}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Service Provider Phone Number
                        </label>
                        <PhoneInput
                          className={`custom_phone_input ${
                            errors.phone ? "is-invalid" : ""
                          }`}
                          placeholder="Enter phone number"
                          value={watch("phone") || ""}
                          onChange={(e) =>
                            setValue("phone", e.target.value)
                          }
                          name="phone"
                        />
                        {errors.phone && (
                          <div className="invalid-feedback">
                            {errors.phone.message}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {userRole === "visitor" && (
                    <div className="col-md-6">
                      <label className="form-label">
                        Customer Phone Number
                      </label>
                      <PhoneInput
                        className={`custom_phone_input ${
                          errors.phone ? "is-invalid" : ""
                        }`}
                        placeholder="Enter phone number"
                        value={watch("phone") || ""}
                        onChange={(e) =>
                          setValue("phone", e.target.value)
                        }
                        name="phone"
                      />
                      {errors.phone && (
                        <div className="invalid-feedback">
                          {errors.phone.message}
                        </div>
                      )}
                    </div>
                  )}

                  {isShopOwner && (
                    <div className="col-md-6">
                      <label className="form-label">
                        Personal Phone Number
                      </label>
                      <PhoneInput
                        className={`custom_phone_input ${
                          errors.phone ? "is-invalid" : ""
                        }`}
                        placeholder="Enter phone number"
                        value={watch("phone") || ""}
                        onChange={(e) =>
                          setValue("phone", e.target.value)
                        }
                        name="phone"
                      />
                      {errors.phone && (
                        <div className="invalid-feedback">
                          {errors.phone.message}
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>

                  {isShopOwner && (
                    <div className="profile-section-card">
                      <h6 className="profile-section-title">{`${businessName.toUpperCase()} DETAILS`}</h6>
                      <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">
                          {`${businessName} Name`}
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.shopName ? "is-invalid" : ""
                          }`}
                          {...register("shopName", {
                            onChange: (e) => {
                              const formattedValue = toTitleCaseWords(e.target.value);
                              setValue("shopName", formattedValue, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            },
                          })}
                        />
                        {errors.shopName && (
                          <div className="invalid-feedback">
                            {errors.shopName.message}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          {`${businessName} Phone Number`}
                        </label>
                        <PhoneInput
                          className={`custom_phone_input ${
                            errors.shopPhone ? "is-invalid" : ""
                          }`}
                          placeholder={`Enter ${businessName.toLowerCase()} phone number`}
                          value={watch("shopPhone") || ""}
                          onChange={(e) =>
                            setValue("shopPhone", e.target.value)
                          }
                          name="shopPhone"
                        />
                        {errors.shopPhone && (
                          <div className="invalid-feedback">
                            {errors.shopPhone.message}
                          </div>
                        )}
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">
                          {`${businessName} Category`}
                        </label>
                        <select
                          className={`form-select ${
                            errors.shopCategory ? "is-invalid" : ""
                          }`}
                          {...register("shopCategory")}
                          disabled={categoriesLoading}
                        >
                          <option value="">Select a category</option>
                          {categoriesLoading ? (
                            <option value="">Loading categories...</option>
                          ) : (
                            categories
                              .filter(category => category.name?.toLowerCase() !== 'all')
                              .map((category, index) => (
                                <option
                                  key={category.id || index}
                                  value={category.id}
                                >
                                  {category.name}
                                </option>
                              ))
                          )}
                        </select>
                        {errors.shopCategory && (
                          <div className="invalid-feedback">
                            {errors.shopCategory.message}
                          </div>
                        )}
                      </div>

                      {/* Opening Hours Per Day */}
                      <div className="col-md-12">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <label className="form-label fw-bold mb-0">Opening Hours (Per Day)</label>
                          {getAvailableDays().length > 0 && (
                            <div className="position-relative" ref={dropdownRef}>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                type="button"
                                onClick={() => setShowAddDayDropdown(!showAddDayDropdown)}
                              >
                                <i className="bi bi-plus-circle me-1"></i>
                                Add Day
                              </button>
                              {showAddDayDropdown && (
                                <ul 
                                  className="dropdown-menu show"
                                  style={{ 
                                    position: "absolute", 
                                    right: 0, 
                                    top: "100%", 
                                    marginTop: "4px",
                                    zIndex: 1050,
                                    minWidth: "150px",
                                    display: "block"
                                  }}
                                >
                                  {getAvailableDays().map((day) => (
                                    <li key={day.key}>
                                      <button
                                        className="dropdown-item"
                                        type="button"
                                        onClick={() => addOpeningHoursDay(day.key)}
                                      >
                                        {day.label}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                        {shopMetadata.openingHours.length === 0 ? (
                          <div className="text-center py-4 text-muted">
                            <p>No opening hours added yet. Click "Add Day" to add opening hours.</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {shopMetadata.openingHours.map((dayHours, index) => (
                              <div key={`${dayHours.day}-${index}`} className="col-md-6">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <label className="form-label mb-0" style={{ fontSize: "14px", fontWeight: "500" }}>
                                    {dayHours.label}
                                  </label>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0"
                                    onClick={() => removeOpeningHoursDay(index)}
                                    style={{ fontSize: "12px" }}
                                  >
                                    <i className="bi bi-x-circle"></i> Remove
                                  </button>
                                </div>
                                <div className="d-flex gap-2 align-items-center">
                                  <div className="position-relative flex-fill">
                                    <input
                                      type="time"
                                      className="form-control"
                                      value={dayHours.open || ""}
                                      onChange={(e) => updateOpeningHours(index, "open", e.target.value)}
                                      style={{ paddingRight: "40px" }}
                                    />
                                    <i className="bi bi-clock position-absolute" style={{ right: "12px", top: "50%", transform: "translateY(-50%)", color: "#6c757d", pointerEvents: "none" }}></i>
                                  </div>
                                  <span className="text-muted" style={{ fontSize: "14px" }}>to</span>
                                  <div className="position-relative flex-fill">
                                    <input
                                      type="time"
                                      className="form-control"
                                      value={dayHours.close || ""}
                                      onChange={(e) => updateOpeningHours(index, "close", e.target.value)}
                                      style={{ paddingRight: "40px" }}
                                    />
                                    <i className="bi bi-clock position-absolute" style={{ right: "12px", top: "50%", transform: "translateY(-50%)", color: "#6c757d", pointerEvents: "none" }}></i>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {isRestaurant && (
                        <>
                          <div className="mb-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="switchCheckDefault"
                                checked={acceptsReservations}
                                onChange={(e) =>
                                  setAcceptsReservations(e.target.checked)
                                }
                                role="switch"
                              />
                              <label
                                className="form-check-label"
                                htmlFor="acceptsReservations"
                                style={{ cursor: "pointer" }}
                              >
                                Accept Reservations
                              </label>
                            </div>
                            <small className="text-muted">
                              Enable this to allow customers to make reservations
                              at your restaurant
                            </small>
                          </div>
                          <div className="mb-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="halalCheck"
                                checked={shopMetadata.halal}
                                onChange={(e) => 
                                  setShopMetadata({
                                    ...shopMetadata,
                                    halal: e.target.checked
                                  })
                                }
                                role="switch"
                              />
                              <label
                                className="form-check-label"
                                htmlFor="halalCheck"
                                style={{ cursor: "pointer" }}
                              >
                                Halal Certified
                              </label>
                            </div>
                            <small className="text-muted">
                            Mark this if your restaurant is Halal certified
                          </small>
                        </div>
                      </>
                    )}
                    </div>
                  </div>
                  )}

                <div className="profile-section-card">
                  <h6 className="profile-section-title">LOCATION</h6>
                  <div className="col-md-12">
                    <AddressInput
                      value={watch("address1")}
                      onChange={(val) => setValue("address1", val)}
                      onLocationSelect={(loc) => handleAddressSelect(loc)}
                      placeholder={
                        isShopOwner
                          ? `${businessName} address`
                          : t("address_placeholder")
                      }
                      label={
                        isShopOwner
                          ? `${businessName} Address`
                          : t("address_label")
                      }
                    />
                  </div>

                  <div className="col-md-12">
                    <h6 className="fw-bold mb-2">
                      {isShopOwner
                        ? `Selected ${businessName} Location`
                        : t("selected_location")}
                    </h6>
                    <MapComponent
                      pickupLocation={{
                        address: address1,
                        city: city,
                        postCode: postCode,
                        lat: latitude,
                        lng: longitude,
                      }}
                      hide={{
                        dropoff: true,
                        clear: true,
                        tip: true,
                        pickup: true,
                      }}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-3">
                  <button
                    className="btn btn-primary save-btn"
                    type="submit"
                    disabled={isLoadingUpdate}
                  >
                    {isLoadingUpdate ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {t("saving")}
                      </>
                    ) : (
                      t("save")
                    )}
                  </button>
                </div>
          </form>
        )}
      </section>

      {/* Gallery Upload Modal */}
      {isShopOwner && showUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Gallery Image</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseUploadModal}
                  disabled={isLoadingGallery}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Image</label>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    className="form-control"
                    accept="image/png,image/jpg,image/jpeg,image/webp"
                    onChange={handleGalleryImageSelect}
                    disabled={isLoadingGallery}
                  />
                  <small className="form-text text-muted">
                    Supported formats: PNG, JPG, JPEG, WEBP (Max 10MB)
                  </small>
                </div>
                {uploadPreview && (
                  <div className="mb-3">
                    <label className="form-label">Preview</label>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden', border: '1px solid #dee2e6', borderRadius: '0.375rem' }}>
                      <Image
                        src={uploadPreview}
                        alt="Preview"
                        fill
                        style={{ objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
                        unoptimized
                      />
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Caption (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                    placeholder="Enter image caption"
                    disabled={isLoadingGallery}
                    maxLength={255}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseUploadModal}
                  disabled={isLoadingGallery}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGalleryUpload}
                  disabled={isLoadingGallery || !uploadImage}
                >
                  {isLoadingGallery ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isShopOwner && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Image"
          message="Are you sure you want to delete this image? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="danger"
        />
      )}

      {/* Update Email Modal */}
      {showUpdateEmailModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Email Address</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseUpdateEmailModal}
                  disabled={isUpdatingEmail}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Current Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={watch("email") || ""}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${emailError ? "is-invalid" : ""}`}
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="Enter new email address"
                    disabled={isUpdatingEmail}
                  />
                  {emailError && (
                    <div className="invalid-feedback d-block">
                      {emailError}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseUpdateEmailModal}
                  disabled={isUpdatingEmail}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateEmail}
                  disabled={isUpdatingEmail || !newEmail.trim()}
                >
                  {isUpdatingEmail ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    "Update Email"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;

