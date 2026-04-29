"use client";
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import { FaArrowLeft, FaCalendarAlt, FaChevronDown, FaUsers, FaEnvelope, FaPhone, FaUser, FaRoute } from 'react-icons/fa';
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { BsCalendar2Date } from "react-icons/bs";
import LoginModal from '@/components/Modals/LoginModal';
import ShopHeaderCard from '@/components/ShopHeaderCard';
import PhoneInput from '@/components/Fields/PhoneInput';
import RestaurantMenuContent from '@/components/RestaurantMenuContent';
import AboutUsSection from '@/components/AboutUsSection';
import Gallery from '@/components/Gallery';
import FeedbackSection from '@/components/FeedbackSection';
import { getTodayOpeningHours, getFileUrl } from '@/utils/helper';
import Image from 'next/image';
import "react-datepicker/dist/react-datepicker.css";
import { GoArrowLeft } from "react-icons/go";

export default function RestaurantReservationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations('ReservationPage');
  const [activeTab, setActiveTab] = useState('booking');
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [formData, setFormData] = useState({
    numberOfGuests: 2,
    reservationDate: null,
    reservationTime: null,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  });

  // Generate time slots (every 30 minutes from opening to closing)
  const generateTimeSlots = () => {
    const openingHours = restaurant?.shop_metadata?.openingHours || restaurant?.openingHours;
    const todayHours = getTodayOpeningHours(openingHours);
    
    if (!todayHours || !todayHours.open || !todayHours.close) return [];
    
    const slots = [];
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMin = openMin;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMin <= closeMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    
    return slots;
  };

  // Fetch service details (restaurant, mot, shisha, spa, beauty, healthcare, events, entertainment)
  useEffect(() => {
    const fetchService = async () => {
      try {
        setIsLoading(true);
        // First, try to fetch without type parameter (API will return the shop regardless of type)
        let response = await fetch(`/api/shops/public/${id}`);
        
        // If that fails, try with common types
        if (!response.ok) {
          const typesToTry = ['restaurant', 'mot', 'shisha', 'spa', 'beauty', 'healthcare', 'events', 'entertainment'];
          for (const serviceType of typesToTry) {
            response = await fetch(`/api/shops/public/${id}?type=${serviceType}`);
            if (response.ok) break;
          }
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.acceptsReservations) {
            setRestaurant(data);
          } else if (data && !data.acceptsReservations) {
            toast.error(t('restaurant_no_reservations') || 'This service does not accept reservations');
            // Map service type to route
            const typeToRoute = {
              'restaurant': 'restaurants',
              'mot': 'mot',
              'shisha': 'shisha',
              'spa': 'spa',
              'beauty': 'beauty',
              'healthcare': 'healthcare',
              'events': 'events',
              'entertainment': 'entertainment'
            };
            const route = typeToRoute[data.type] || 'restaurants';
            router.push(`/reservations/${route}`);
          } else {
            toast.error(t('restaurant_not_found') || 'Service not found');
            router.push('/reservations');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || t('failed_load_restaurant') || 'Failed to load service');
          router.push('/reservations');
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        toast.error(t('failed_load_restaurant') || 'Failed to load service');
        router.push('/reservations');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id, router]);

  // Update form data when query params change
  useEffect(() => {
    if (!searchParams) return;
    
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const guests = searchParams.get('guests');
    
    // Convert date string (YYYY-MM-DD) to Date object
    let dateObj = null;
    if (date) {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        dateObj = null;
      }
    }
    
    // Convert time string (HH:MM) to Date object
    let timeDate = null;
    if (time) {
      const decodedTime = decodeURIComponent(time);
      const [hours, minutes] = decodedTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      ...(dateObj && { reservationDate: dateObj }),
      ...(timeDate && { reservationTime: timeDate }),
      ...(guests && { numberOfGuests: parseInt(guests, 10) || 2 }),
    }));
  }, [searchParams]);


  // Pre-fill form with user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          // Fetch user profile to get phone number
          const response = await fetch('/api/profile', {
            headers: {
              'user-id': session.user.id,
              'role': session.user.role
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setFormData(prev => ({
              ...prev,
              customerName: session.user.name || '',
              customerEmail: session.user.email || '',
              customerPhone: data.profile?.phone || ''
            }));
          } else {
            // Fallback to session data only if profile fetch fails
            setFormData(prev => ({
              ...prev,
              customerName: session.user.name || '',
              customerEmail: session.user.email || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to session data only
          setFormData(prev => ({
            ...prev,
            customerName: session.user.name || '',
            customerEmail: session.user.email || ''
          }));
        }
      }
    };

    fetchUserProfile();
  }, [session, status]);

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('link_copied'));
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(t('link_copied'));
      }
    } catch (err) {
      console.log('Error copying to clipboard:', err);
      toast.error(t('failed_copy_link'));
    }
  };

  // Handle check distance - opens Google Maps with restaurant address
  const handleCheckDistance = () => {
    // Get restaurant address from various possible locations
    const restaurantAddress = restaurant?.address || 
                              restaurant?.shop_metadata?.address || 
                              restaurant?.location?.address ||
                              (restaurant?.latitude && restaurant?.longitude 
                                ? `${restaurant.latitude},${restaurant.longitude}` 
                                : null);

    if (!restaurantAddress) {
      toast.error('Restaurant address not available');
      return;
    }

    // Open Google Maps with restaurant address
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantAddress)}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status === 'loading') return;

    if (!session) {
      setShowLoginModal(true);
      return;
    }

    // Validation
    if (!formData.reservationDate || !formData.reservationTime || 
        !formData.customerName || !formData.customerPhone || !formData.customerEmail) {
      toast.error(t('fill_required_fields'));
      return;
    }

    // Convert date Date object to YYYY-MM-DD string
    const dateStr = formData.reservationDate instanceof Date
      ? formData.reservationDate.toISOString().split('T')[0]
      : formData.reservationDate;

    // Convert time Date object to HH:MM string
    const timeStr = formData.reservationTime instanceof Date
      ? `${String(formData.reservationTime.getHours()).padStart(2, '0')}:${String(formData.reservationTime.getMinutes()).padStart(2, '0')}`
      : formData.reservationTime;

    // Check if date is in the past
    const selectedDate = formData.reservationDate instanceof Date 
      ? formData.reservationDate 
      : new Date(formData.reservationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error(t('select_future_date'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session.user.id,
          'role': session.user.role
        },
        body: JSON.stringify({
          restaurantId: id,
          ...formData,
          reservationDate: dateStr,
          reservationTime: timeStr
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('reservation_created'));
        router.push(`/customer/reservations/${data.reservation.id}`);
      } else {
        toast.error(data.error || t('failed_create_reservation'));
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error(t('failed_create_reservation_try_again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom date input component
  const CustomDateInput = ({ value, onClick }) => (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onClick={onClick}
        readOnly
        className="w-full text-[14px] sm:text-base ps-[35px] pe-2 !py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer pr-10"
      />
      <BsCalendar2Date className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );

  // Custom time input component
  const CustomTimeInput = ({ value, onClick }) => (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onClick={onClick}
        readOnly
        className="w-full text-[14px] sm:text-base ps-[30px] pe-2 !py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer pr-10"
      />
      <MdOutlineAccessTimeFilled className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container ">
        <div className="heading_box mb-6 relative">
          <button
            onClick={() => {
              // Map service type to route for back navigation
              const typeToRoute = {
                'restaurant': 'restaurants',
                'mot': 'mot',
                'shisha': 'shisha',
                'spa': 'spa',
                'beauty': 'beauty',
                'healthcare': 'healthcare',
                'events': 'events',
                'entertainment': 'entertainment'
              };
              const route = restaurant?.type ? typeToRoute[restaurant.type] || 'restaurants' : 'restaurants';
              router.push(`/reservations/${route}`);
            }}
            className="sm:hidden px-2 py-1 rounded-xl bg-white/10 backdrop-blur-md shadow-sm duration-200 absolute top-1 left-1 z-10 hover:bg-white/20 transition-all"
            aria-label="Go back"
          >
            <GoArrowLeft className="h-5 w-5 !text-gray-100 " />
          </button>
          <ShopHeaderCard
            shop={restaurant}
            isLoading={isLoading}
            onShare={handleShare}
            type={restaurant?.type || "reservation"}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("booking")}
              className={`tab-button !px-0 !mx-[14px] flex-shrink-0 ${
                activeTab === "booking" ? "active" : ""
              }`}
            >
              {t("booking")}
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`tab-button !px-0 !mx-[14px] flex-shrink-0 ${
                activeTab === "menu" ? "active" : ""
              }`}
            >
              {restaurant?.type === "restaurant" ? t("menu") : t("services")}
            </button>

            <button
              onClick={() => setActiveTab("gallery")}
              className={`tab-button !px-0 !mx-[14px] flex-shrink-0 ${
                activeTab === "gallery" ? "active" : ""
              }`}
            >
              {t("gallery")}
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`tab-button !px-0 !mx-[14px] flex-shrink-0 ${
                activeTab === "about" ? "active" : ""
              }`}
            >
              {t("about_us")}
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`tab-button !px-0 !mx-[14px] flex-shrink-0 ${
                activeTab === "feedback" ? "active" : ""
              }`}
            >
              {t("feedback")}
            </button>
          </div>
        </div>

        <div className="pb-8">
          {/* Booking Tab */}
          {activeTab === "booking" && restaurant && (
            <div className=" rounded-[14px] p-[10px] sm:p-6 border border-[#F5F5F5]">
              <form onSubmit={handleSubmit}>
                {/* Number of Guests */}
                <div className="row g-2">
                  <div className="col">
                    {/* Date */}
                    <div className="mb-2 custom_datepicker">
                      <label
                        className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontSize: "15px", color: "#374151" }}
                      >
                        <BsCalendar2Date
                          className="mr-2"
                          style={{ color: "var(--orange)" }}
                        />
                        {t("date")}
                      </label>
                      <DatePicker
                        selected={formData.reservationDate}
                        onChange={(date) =>
                          setFormData({
                            ...formData,
                            reservationDate: date,
                          })
                        }
                        dateFormat="dd MMM yyyy"
                        minDate={new Date()}
                        customInput={<CustomDateInput />}
                        wrapperClassName="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="col">
                    {/* Time */}
                    <div className="mb-2">
                      <label
                        className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontSize: "15px", color: "#374151" }}
                      >
                        <MdOutlineAccessTimeFilled
                          className="mr-2"
                          style={{ color: "var(--orange)" }}
                        />
                        {t("time")}
                      </label>
                      <DatePicker
                        selected={formData.reservationTime}
                        onChange={(time) =>
                          setFormData({
                            ...formData,
                            reservationTime: time,
                          })
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        dateFormat="h:mm aa"
                        customInput={<CustomTimeInput />}
                        wrapperClassName="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div>
                      <label
                        className="flex items-center text-sm font-semibold text-gray-700 mb-3"
                        style={{ fontSize: "15px", color: "#374151" }}
                      >
                        <FaUsers
                          className="mr-2"
                          style={{ color: "var(--orange)" }}
                        />
                        {restaurant?.type === "healthcare" ? t("number_of_patients") : t("number_of_guests")}
                      </label>
                      <div className="position-relative">
                        <select
                          value={formData.numberOfGuests}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              numberOfGuests: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          style={{
                            fontSize: "16px",
                            appearance: "none",
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%23828A8B' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 16px center",
                            paddingRight: "40px",
                          }}
                          required
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num} {restaurant?.type === "healthcare" ? (num === 1 ? t("patient") : t("patients")) : (num === 1 ? t("guest") : t("guests"))}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-2">
                  <div className="col-md-6 col-sm-12">
                    {/* Customer Name */}
                    <div>
                      <label
                        className="flex items-center text-sm font-semibold text-gray-700"
                        style={{ fontSize: "15px", color: "#374151" }}
                      >
                        <FaUser
                          className="mr-2"
                          style={{ color: "var(--orange)" }}
                        />
                        {t("name")}
                      </label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        style={{ fontSize: "16px" }}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-sm-12 ">
                    {/* Phone */}
                    <div>
                      <label
                        className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontSize: "15px", color: "#374151" }}
                      >
                        <FaPhone
                          className="mr-2"
                          style={{ color: "var(--orange)" }}
                        />
                        {t("phone_number")}
                      </label>
                      <PhoneInput
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-0 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        style={{ fontSize: "16px" }}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-12 col-lg-12">
                    {/* Email */}
                    <div>
                      <label
                        className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontSize: "15px", color: "#374151" }}
                      >
                        <FaEnvelope
                          className="mr-2"
                          style={{ color: "var(--orange)" }}
                        />
                        {t("email")}
                      </label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerEmail: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        style={{ fontSize: "16px" }}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-12 col-lg-12">
                    {/* Notes */}
                    <div>
                      <label
                        className="text-sm font-semibold text-gray-700 mb-2 block"
                        style={{ fontSize: "15px", color: "#374151" }}
                      >
                        {t("special_requests")}
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                        style={{ fontSize: "16px" }}
                        placeholder={t("special_requests_placeholder")}
                      />
                    </div>
                  </div>
                </div>
                {/* Buttons Container - In One Row */}
                <div className="flex gap-5 items-center mt-4">
                  {restaurant?.address ||
                  restaurant?.shop_metadata?.address ||
                  restaurant?.location?.address ||
                  (restaurant?.latitude && restaurant?.longitude) ? (
                    <button
                      type="button"
                      onClick={handleCheckDistance}
                      className=" px-4 py-2 font-bold text-sm  text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-full transition-colors duration-200 "
                      title="Check distance to restaurant"
                    >
                      {/* <FaRoute className="text-base" /> */}
                      <span>Check Distance</span>
                    </button>
                  ) : null}
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-md !rounded-full bg_red text-white !font-bold !text-sm"
                  >
                    {isSubmitting ? t("processing") : t("book_reservation")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === "menu" && (
            <RestaurantMenuContent
              restaurantId={id}
              hideHeader={false}
              type="reservation"
              shopData={restaurant}
            />
          )}

          {/* About Us Tab */}
          {activeTab === "about" && <AboutUsSection shop={restaurant} />}

          {/* Gallery Tab */}
          {activeTab === "gallery" && (
            <Gallery
              images={restaurant?.gallery || []}
              isLoading={isLoading}
              emptyMessage="No gallery images available"
            />
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <FeedbackSection shop={restaurant} />
          )}
        </div>
      </div>

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

