"use client";
import LocationFilterModal from "@/components/Modals/LocationFilterModal";
import LoginModal from '@/components/Modals/LoginModal';
import StarRatingModal from "@/components/Modals/StarRatingModal";
import Pagination from "@/components/Pagination";
import ReservationsFilters from "@/components/ReservationsFilters";
import { Link, useRouter } from '@/i18n/routing';
import useLocationFilter from "@/lib/hooks/useLocationFilter";
import useSavedLocation from "@/lib/hooks/useSavedLocation";
import {
  calculateDistance,
  getCitiesForLocation,
  getFileUrl,
  getLocationFromStorage,
  getLocationOptions,
  isNewItem
} from "@/utils/helper";
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { BsCalendar2Date } from "react-icons/bs";
import { FaChevronDown, FaStar } from 'react-icons/fa';
import { MdLocationOn, MdOutlineAccessTimeFilled } from "react-icons/md";
import { NumberOfServices, ServiceIcon } from "@/components/ServiceIcon";

export default function ReservationPageLayout({
  serviceType,
  title,
  description,
  defaultTime = { hours: 9, minutes: 0 },
  defaultGuests = 1,
  maxGuests = 5,
  guestsLabel = "Persons",
  guestsSingular = "person",
  guestsPlural = "Person",
  emptyStateIcon = "bi-wrench",
  emptyStateMessage = "No services nearby yet — more are coming soon.",
  partnerLinkAnchor = "",
  serviceName = "Service",
  serviceDisplayName = null, // For the "nearby X" message
  errorMessage = "Failed to fetch services",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("ReservationsPage");
  const { data: session, status } = useSession();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { 
    locationFilter, 
    setLocationFilter, 
    isLoading: isLocationFilterLoading,
    showLocationModal,
    setShowLocationModal
  } = useLocationFilter();
  const [isLocationFilterModalOpen, setIsLocationFilterModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceForReservation, setSelectedServiceForReservation] = useState(null);
  const [serviceIdForReservation, setServiceIdForReservation] = useState(null);
  const { savedLocation, savedLocationFilter } = useSavedLocation();
  const [customerData, setCustomerData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  const [reservationData, setReservationData] = useState({
    date: searchParams?.get('date') || null,
    time: searchParams?.get('time') || null,
    guests: searchParams?.get('guests') || null,
    city: searchParams?.get('city') || null,
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams?.get('date');
    if (dateParam) {
      return new Date(dateParam);
    }
    return new Date();
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    const timeParam = searchParams?.get('time');
    if (timeParam) {
      const [hours, minutes] = timeParam.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date;
    }
    const today = new Date();
    today.setHours(defaultTime.hours, defaultTime.minutes, 0, 0);
    return today;
  });
  const [selectedGuests, setSelectedGuests] = useState(() => {
    const guestsParam = searchParams?.get('guests');
    return guestsParam ? parseInt(guestsParam) : defaultGuests;
  });
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const guestsDropdownRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState(searchParams?.get('city') || null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceDropdownRef = useRef(null);
  
  // Service options mapping
  const serviceOptions = [
    { label: 'Food reservation', route: '/reservations/restaurants', serviceType: 'restaurant' },
    { label: 'Beauty appointments', route: '/reservations/beauty', serviceType: 'beauty' },
    { label: 'Shisha lounge', route: '/reservations/shisha', serviceType: 'shisha' },
    { label: 'MOT &  Repairs', route: '/reservations/mot', serviceType: 'mot' },
    { label: 'Spa Treatments', route: '/reservations/spa', serviceType: 'spa' },
    { label: 'Healthcare', route: '/reservations/healthcare', serviceType: 'healthcare' },
    { label: 'Events', route: '/reservations/events', serviceType: 'events' },
    { label: 'Entertainment', route: '/reservations/entertainment', serviceType: 'entertainment' },
  ];
  
  const currentService = serviceOptions.find(opt => opt.serviceType === serviceType) || serviceOptions[1];
  const guestsOptions = Array.from({ length: maxGuests }, (_, i) => i + 1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 16,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchServices = async (
    page = 1,
    search = "",
    filterParams = {},
    city = null
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        type: serviceType,
        status: "active",
        acceptsReservations: "true",
        ...(search && { search: search }),
        // ...(city && { city: city }),
        // // ...(filterParams &&
        // //   filterParams?.location?.lat &&
        // //   filterParams?.location?.lng &&
        // //   filterParams?.radius && {
        // //   lat: filterParams.location.lat.toString(),
        // //   lng: filterParams.location.lng.toString(),
        // //   radius: filterParams.radius.toString(),
        // //   ...(filterParams.location.postCode && {
        // //     postCode: filterParams.location.postCode,
        // //   }),
        // // }),
      });

      const response = await fetch(`/api/shops/public?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        let servicesData = data.shops || [];

        servicesData = servicesData.filter(service => service.acceptsReservations === true);
        
        // Filter by selected category if a category is selected
        if (selectedServiceForReservation?.categoryId) {
          servicesData = servicesData.filter(service => 
            service.category === String(selectedServiceForReservation.categoryId)
          );
        }

        const userLat = filterParams?.location?.lat || locationFilter?.location?.lat || savedLocationFilter?.location?.lat;
        const userLng = filterParams?.location?.lng || locationFilter?.location?.lng || savedLocationFilter?.location?.lng;

        if (userLat && userLng) {
          servicesData = servicesData.map(service => {
            if (service.latitude && service.longitude) {
              const calculatedDistance = calculateDistance(
                userLat,
                userLng,
                service.latitude,
                service.longitude
              );
              return {
                ...service,
                distance: calculatedDistance !== null ? calculatedDistance : service.distance
              };
            }
            return service;
          });
        }

        setServices(servicesData);
        setPagination(data.pagination || pagination);
      } else {
        toast.error(data.error || errorMessage);
      }
    } catch (error) {
      console.error(`Error fetching ${serviceType}:`, error);
      toast.error(error.message || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for location filter to load
    if (isLocationFilterLoading) return;

    const cityParam = searchParams?.get('city');
    
    // Use persisted location filter if available, otherwise use savedLocationFilter as fallback
    const filterToUse = locationFilter || savedLocationFilter;
    
    if (filterToUse) {
      if (savedLocation) {
        setSelectedLocation(savedLocation);
      }
      fetchServices(1, "", filterToUse, cityParam);
    } else {
      fetchServices(1, "", {}, cityParam);
    }
  }, [isLocationFilterLoading, locationFilter, selectedServiceForReservation]);

  useEffect(() => {
    const date = searchParams?.get('date');
    const time = searchParams?.get('time');
    const guests = searchParams?.get('guests');
    const city = searchParams?.get('city');

    if (date || time || guests || city) {
      setReservationData((prev) => ({
        date: date || prev.date,
        time: time || prev.time,
        guests: guests || prev.guests,
        city: city || prev.city,
      }));

      if (city) {
        fetchServices(1, searchQuery, locationFilter || savedLocationFilter, city);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const location = getLocationFromStorage();
    if (location && location.id) {
      const cities = getCitiesForLocation(location.id);
      setAvailableCities(cities);
      if (cities.length > 0 && !selectedCity) {
        setSelectedCity(cities[0]);
      }
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const location = getLocationFromStorage();
      if (location && location.id) {
        const cities = getCitiesForLocation(location.id);
        setAvailableCities(cities);
        if (cities.length > 0) {
          setSelectedCity(cities[0]);
        }
      }
    };

    window.addEventListener('locationChanged', handleLocationChange);
    window.addEventListener('storage', handleLocationChange);

    return () => {
      window.removeEventListener('locationChanged', handleLocationChange);
      window.removeEventListener('storage', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guestsDropdownRef.current && !guestsDropdownRef.current.contains(event.target)) {
        setShowGuestsDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
        setShowServiceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const CustomDateInput = ({ value, onClick }) => (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onClick={onClick}
        readOnly
        className="w-full text-[14px] sm:text-base ps-[35px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-10 font-bold"
      />
      <BsCalendar2Date className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );

  const CustomTimeInput = ({ value, onClick }) => (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onClick={onClick}
        readOnly
        className="w-full text-[14px] sm:text-base ps-[30px] pe-2 !py-3  border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-10 font-bold"
      />
      <MdOutlineAccessTimeFilled className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );


  useEffect(() => {
    const params = new URLSearchParams();

    searchParams?.forEach((value, key) => {
      if (!['date', 'time', 'guests', 'city'].includes(key)) {
        params.set(key, value);
      }
    });

    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      params.set('date', dateStr);
    }

    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      params.set('time', timeStr);
    }

    if (selectedGuests) {
      params.set('guests', selectedGuests.toString());
    }

    if (selectedCity) {
      params.set('city', selectedCity);
    }

    const newUrl = `/reservations/${serviceType}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedDate, selectedTime, selectedGuests, selectedCity, serviceType]);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (searchTerm) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchServices(
            1,
            searchTerm,
            locationFilter || savedLocationFilter,
            reservationData.city
          );
        }, 500);
      };
    })(),
    [locationFilter, savedLocationFilter, reservationData.city]
  );

  const handlePageChange = (page) => {
    fetchServices(
      page,
      searchQuery,
      locationFilter || savedLocationFilter,
      reservationData.city
    );
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleLocationFilterApply = (filterData) => {
    // setLocationFilter from hook automatically saves to localStorage
    setLocationFilter(filterData);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchServices(1, searchQuery, filterData, reservationData.city);
  };


  const handleReserve = (serviceId) => {
    // Navigate to the detail page with query parameters
    const params = new URLSearchParams();
    
    // Add date, time, and guests if selected
    if (selectedDate) {
      const dateStr = selectedDate instanceof Date
        ? selectedDate.toISOString().split('T')[0]
        : selectedDate;
      params.set('date', dateStr);
    }
    
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      params.set('time', timeStr);
    }
    
    if (selectedGuests) {
      params.set('guests', selectedGuests.toString());
    }
    
    // Add selected service information if available
    if (selectedServiceForReservation) {
      params.set('service', selectedServiceForReservation.id || '');
      params.set('serviceName', selectedServiceForReservation.name || '');
      params.set('servicePrice', selectedServiceForReservation.price?.toString() || '');
      if (selectedServiceForReservation.duration) {
        params.set('serviceDuration', selectedServiceForReservation.duration);
      }
    }
    
    // Navigate to the reservation detail page
    const queryString = params.toString();
    const url = queryString ? `/reservations/${serviceId}?${queryString}` : `/reservations/${serviceId}`;
    router.push(url);
  };

  const handleServiceSelected = (service) => {
    // Handle "All" option (service is null)
    if (!service) {
      setSelectedServiceForReservation(null);
      return;
    }
    
    // Toggle selection: if clicking the same category, deselect it
    if (selectedServiceForReservation?.categoryId === service?.categoryId) {
      setSelectedServiceForReservation(null);
    } else {
      setSelectedServiceForReservation(service);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          const response = await fetch('/api/profile', {
            headers: {
              'user-id': session.user.id,
              'role': session.user.role
            }
          });

          if (response.ok) {
            const data = await response.json();
            setCustomerData({
              customerName: session.user.name || '',
              customerEmail: session.user.email || '',
              customerPhone: data.profile?.phone || ''
            });
          } else {
            setCustomerData({
              customerName: session.user.name || '',
              customerEmail: session.user.email || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setCustomerData({
            customerName: session.user.name || '',
            customerEmail: session.user.email || ''
          });
        }
      }
    };

    fetchUserProfile();
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container pt-[20px] sm:pt-[40px]">
   

        <div className="bg-white rounded-xl shadow-lg !p-2 mb-4">
        {/* <h1 className='mb-4 text-center'>
          <span className="text-2xl font-bold text-black">{title}</span>
        </h1> */}
        
        {/* Service Selector Box */}
        <div className="mb-2 relative" ref={serviceDropdownRef}>
          <div
            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
            className="w-full text-[14px] sm:text-base ps-[35px] pe-4 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
          >
  <div className="flex items-center">
              <ServiceIcon type={serviceType} />
              <span className="text-black font-medium">Service</span>
            </div>            
            <div className="flex items-center gap-2">
              <span className="text-black font-bold">
                {currentService.label}
              </span>
              <FaChevronDown className="text-gray-400" />
            </div>
          </div>

          {showServiceDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {serviceOptions.map((option) => {
                // Preserve query parameters when navigating
                const params = new URLSearchParams();
                searchParams?.forEach((value, key) => {
                  if (['date', 'time', 'guests', 'city'].includes(key)) {
                    params.set(key, value);
                  }
                });
                const queryString = params.toString();
                const routeWithParams = queryString ? `${option.route}?${queryString}` : option.route;
                
                return (
                  <div
                    key={option.serviceType}
                    onClick={() => {
                      setShowServiceDropdown(false);
                      router.push(routeWithParams);
                    }}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-black font-medium ${
                      currentService.serviceType === option.serviceType ? "bg-gray-50" : ""
                    }`}
                  >
                    {option.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
          {availableCities.length > 0 && (
            <div className="mb-2 relative" ref={cityDropdownRef}>
              <div
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="w-full text-[14px] sm:text-base ps-[35px] pe-4 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
              >
                <span className="text-black font-medium">{t('city')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-black font-bold">
                    {selectedCity || t('select_city')}
                  </span>
                  <MdLocationOn className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-[24px]" />
                  <FaChevronDown className="text-gray-400" />
                </div>
              </div>

              {showCityDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableCities.map((city) => (
                    <div
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setShowCityDropdown(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-black font-medium ${selectedCity === city ? "bg-gray-50" : ""
                        }`}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 mb-2">
            <div className="flex-1 custom_datepicker">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="dd MMM yyyy"
                minDate={new Date()}
                customInput={<CustomDateInput />}
                wrapperClassName="w-full"
              />
            </div>

            <div className="flex-1">
              <DatePicker
                selected={selectedTime}
                onChange={(time) => setSelectedTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                dateFormat="h:mm aa"
                customInput={<CustomTimeInput />}
                wrapperClassName="w-full"
              />
            </div>
          </div>

          <div className="mb-2 relative" ref={guestsDropdownRef}>
            <div
              onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
              className="w-full text-[14px] sm:text-base ps-[35px] pe-4 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
            >
              <span className="text-black font-medium">{guestsLabel}</span>
              <div className="flex items-center gap-2">
                <span className="text-black font-bold">
                  {selectedGuests} {selectedGuests === 1 ? guestsSingular : guestsPlural}
                </span>
                <NumberOfServices type={serviceType} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-[24px]" />
                <FaChevronDown className="text-gray-400" />
              </div>
            </div>

            {showGuestsDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {guestsOptions.map((num) => (
                  <div
                    key={num}
                    onClick={() => {
                      setSelectedGuests(num);
                      setShowGuestsDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black font-medium"
                  >
                    {num} {num === 1 ? guestsSingular : guestsPlural}
                  </div>
                ))}
              </div>
            )}
          </div>
          <ReservationsFilters
          showTitle={true}
          serviceType={serviceType}
          selectedService={selectedServiceForReservation}
          onSelectService={handleServiceSelected}
        />
        </div>




        <div className="row g-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="col-md-12 col-lg-6" key={index}>
                <div
                  className="bg-white rounded-xl p-2 shadow-sm animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : services?.length === 0 ? (
            <div className="text-center py-12">
              <i className={`bi ${emptyStateIcon} text-6xl text-gray-400`}></i>
              <p className="mt-3 text-gray-600 text-lg">
                {emptyStateMessage}
              </p>
              <div className="mt-6">
                <h4 className="text-gray-700 font-semibold mb-3">List your business</h4>
                <Link
                  href={`/partner-with-us#reservation-system`}
                  className="inline-block px-6 py-2.5 bg_red text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          ) : (
            services?.map((service, idx) => {
              const rating = Number(service?.rating || 0);
              const ratingDisplay = rating > 0 ? rating.toFixed(1) : "New";
              const reviewCount = Number(service?.reviewCount || 0);

              return (
                <div className="col-md-12 col-lg-6" key={idx}>
                  <div
                    className="bg-white rounded-xl !p-2 shadow-sm flex !gap-2 sm:!p-2 sm:!gap-4 "
                  >
                    <div className="flex-shrink-0">
                      <div className="w-[110px] h-[130px] rounded-lg overflow-hidden">
                        {service?.image ? (
                          <img
                            src={getFileUrl(service?.image)}
                            alt={service?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <i className={`bi ${emptyStateIcon} text-gray-400 text-2xl`}></i>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex gap-1 items-start justify-between">
                          <h3 className="text-[20px] sm:text-lg  font-bold text-black mb-1 break-words truncate  text-decoration-underline">
                            {service?.name}
                          </h3>
                        </div>

                        <div
                          className="flex items-center gap-1 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedService(service);
                            setIsRatingModalOpen(true);
                          }}
                        >
                          <span className="text-base font-semibold text-black underline">
                            {ratingDisplay}
                          </span>
                          <span className="text-sm text-gray-600">({reviewCount})</span>
                          <div className="flex items-center">
                            <FaStar className="text-yellow-400 fill-current text-sm" />
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {isNewItem(service?.createdAt, 30) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                {t("new_badge") || "New"}
                              </span>
                            )}
                          </div>
                        </div>

                        {(service.address1 || service.city || service.country) && (
                          <div className="flex items-center gap-1.5 mb-2 text-gray-600">
                            <span className="text-sm text-gray-600">
                              {[service.address1]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-end justify-between gap-2 mt-1">
                        <div className="inline-flex px-2 py-1 text-[11px] leading-none font-medium text-gray-700 bg-gray-100 rounded-md whitespace-nowrap">
                          {t("no_deposit_required")}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] leading-none text-gray-600 mb-1">
                            {t("takes_30_seconds")}
                          </span>
                          <button
                            onClick={() => handleReserve(service.id)}
                            className="px-3 py-1 bg_red text-white rounded-4 text-xs font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                          >
                            {t("reserve") || "Reserve"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </div>
        )}
      </div>

      <LocationFilterModal
        isOpen={isLocationFilterModalOpen}
        onClose={() => setIsLocationFilterModalOpen(false)}
        onApplyFilter={handleLocationFilterApply}
        currentLocation={locationFilter?.location}
        currentRadius={locationFilter?.radius}
      />

      <StarRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setSelectedService(null);
        }}
        title={t('rating')}
        subtitle={selectedService ? selectedService.name : serviceName}
        rating={Number(selectedService?.rating || 0)}
        isStatic={true}
      />

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

