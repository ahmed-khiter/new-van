"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import DatePicker from 'react-datepicker';
import ReservationsFilters from "@/components/ReservationsFilters";
import LocationBadge from "@/components/LocationBadge";
import LocationFilterModal from "@/components/Modals/LocationFilterModal";
import StarRatingModal from "@/components/Modals/StarRatingModal";
import Pagination from "@/components/Pagination";
import useSavedLocation from "@/lib/hooks/useSavedLocation";
import useLocationFilter from "@/lib/hooks/useLocationFilter";
import {
  getFileUrl,
  getLocationOptions,
  isNewItem,
  isShopClosed,
  formatDistanceByLocation,
  calculateDistance,
  getLocationFromStorage,
  getCitiesForLocation,
} from "@/utils/helper";
import toast from "react-hot-toast";
import { FaSearch, FaStar, FaStarHalfAlt, FaChevronDown } from 'react-icons/fa';
import { PiMapPinLight } from 'react-icons/pi';
import { BsCalendar2Date } from "react-icons/bs";
import { MdOutlineAccessTimeFilled, MdLocationOn } from "react-icons/md";
import { IoIosPeople } from "react-icons/io";
import { ServiceIcon } from "@/components/ServiceIcon";
import "react-datepicker/dist/react-datepicker.css";

export default function ReservationsRestaurantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("ReservationsPage");
  const serviceType = searchParams?.get('service') || 'restaurant';
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState(null);
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
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const { savedLocation, savedLocationFilter } = useSavedLocation();
  
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
    today.setHours(19, 0, 0, 0);
    return today;
  });
  const [selectedGuests, setSelectedGuests] = useState(() => {
    const guestsParam = searchParams?.get('guests');
    return guestsParam ? parseInt(guestsParam) : 2;
  });
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const guestsDropdownRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState(searchParams?.get('city') || null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const [availableCities, setAvailableCities] = useState([]);
  const guestsOptions = Array.from({ length: 20 }, (_, i) => i + 1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 16,
    hasNextPage: false,
    hasPrevPage: false,
  });
   const serviceOptions = [
    { label: 'Food reservation', route: '/reservations/restaurants', serviceType: 'restaurant' },
    { label: 'Beauty appointments', route: '/reservations/beauty', serviceType: 'beauty' },
    { label: 'Shisha lounge', route: '/reservations/shisha', serviceType: 'shisha' },
    { label: 'MOT & Repairs', route: '/reservations/mot', serviceType: 'mot' },
    { label: 'Spa Treatments', route: '/reservations/spa', serviceType: 'spa' },
  ];
  
  const currentService = serviceOptions.find(opt => opt.serviceType === serviceType) || serviceOptions[1];
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceDropdownRef = useRef(null);
  const fetchRestaurants = async (
    page = 1,
    search = "",
    category = "",
    filterParams = {},
    city = null
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        type: "restaurant",
        status: "active",
        acceptsReservations: "true",
        ...(search && { search: search }),
        ...(category && { category: category }),
        ...(city && { city: city }),
        ...(filterParams &&
          filterParams?.location?.lat &&
          filterParams?.location?.lng &&
          filterParams?.radius && {
          lat: filterParams.location.lat.toString(),
          lng: filterParams.location.lng.toString(),
          radius: filterParams.radius.toString(),
          ...(filterParams.location.postCode && {
            postCode: filterParams.location.postCode,
          }),
        }),
      });

      const response = await fetch(`/api/shops/public?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        let restaurantsData = data.shops || [];
        
        restaurantsData = restaurantsData.filter(restaurant => restaurant.acceptsReservations === true);
        
        const userLat = filterParams?.location?.lat || locationFilter?.location?.lat || savedLocationFilter?.location?.lat;
        const userLng = filterParams?.location?.lng || locationFilter?.location?.lng || savedLocationFilter?.location?.lng;
        
        if (userLat && userLng) {
          restaurantsData = restaurantsData.map(restaurant => {
            if (restaurant.latitude && restaurant.longitude) {
              const calculatedDistance = calculateDistance(
                userLat,
                userLng,
                restaurant.latitude,
                restaurant.longitude
              );
              return {
                ...restaurant,
                distance: calculatedDistance !== null ? calculatedDistance : restaurant.distance
              };
            }
            return restaurant;
          });
        }
        
        setRestaurants(restaurantsData);
        setPagination(data.pagination || pagination);
      } else {
        toast.error(data.error || t("failed_fetch_restaurants"));
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error(error.message || t("error_fetching_restaurants"));
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
      fetchRestaurants(1, "", selectedCategory, filterToUse, cityParam);
    } else {
      fetchRestaurants(1, "", selectedCategory, {}, cityParam);
    }
  }, [isLocationFilterLoading, locationFilter]);

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
        fetchRestaurants(1, searchQuery, selectedCategory, locationFilter || savedLocationFilter, city);
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
    
    const newUrl = `/reservations/restaurants?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedDate, selectedTime, selectedGuests, selectedCity]);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (searchTerm) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchRestaurants(
            1,
            searchTerm,
            selectedCategory,
            locationFilter || savedLocationFilter,
            reservationData.city
          );
        }, 500);
      };
    })(),
    [locationFilter, savedLocationFilter, selectedCategory, reservationData.city]
  );

  const handlePageChange = (page) => {
    fetchRestaurants(
      page,
      searchQuery,
      selectedCategory,
      locationFilter || savedLocationFilter,
      reservationData.city
    );
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRestaurants(
      1,
      searchQuery,
      category,
      locationFilter || savedLocationFilter,
      reservationData.city
    );
  };

  const handleServiceSelected = (service) => {
    // Handle "All" option (service is null)
    if (!service) {
      setSelectedService(null);
      setSelectedCategory("");
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchRestaurants(
        1,
        searchQuery,
        "",
        locationFilter || savedLocationFilter,
        reservationData.city
      );
      return;
    }
    
    // Toggle selection: if clicking the same category, deselect it
    if (selectedService?.categoryId === service?.categoryId) {
      setSelectedService(null);
      setSelectedCategory("");
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchRestaurants(
        1,
        searchQuery,
        "",
        locationFilter || savedLocationFilter,
        reservationData.city
      );
    } else {
      setSelectedService(service);
      setSelectedCategory(service?.categoryId ? String(service.categoryId) : "");
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      const categoryId = service?.categoryId ? String(service.categoryId) : "";
      fetchRestaurants(
        1,
        searchQuery,
        categoryId,
        locationFilter || savedLocationFilter,
        reservationData.city
      );
    }
  };

  const handleLocationFilterApply = (filterData) => {
    // setLocationFilter from hook automatically saves to localStorage
    setLocationFilter(filterData);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRestaurants(1, searchQuery, selectedCategory, filterData, reservationData.city);
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    const locationData = getLocationOptions(location.id);
    if (locationData) {
      const filterData = {
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
          address: locationData.address,
          postCode: locationData.postCode,
        },
        radius: 10,
      };
      setLocationFilter(filterData);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchRestaurants(1, searchQuery, selectedCategory, filterData, reservationData.city);
    }
  };

  const handleReserve = (restaurantId) => {
    const params = new URLSearchParams();
    if (reservationData.date) params.set('date', reservationData.date);
    if (reservationData.time) params.set('time', reservationData.time);
    if (reservationData.guests) params.set('guests', reservationData.guests);
    
    const queryString = params.toString();
    router.push(`/reservations/${restaurantId}${queryString ? `?${queryString}` : ''}`);
  };


  const formatDistance = (distance) => {
    if (!distance) return null;
    return `${distance.toFixed(1).replace('.', ',')} mi away`;
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    searchParams?.forEach((value, key) => {
      params.set(key, value);
    });
    return params.toString();
  };
  const queryString = buildQueryString();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container pt-[20px] sm:pt-[40px]">
        <h1 className=' mb-4'>
       
           <span className="  ms-2">
              <Link
                href={`/reservations/restaurants/top-rated${queryString ? `?${queryString}` : ''}`}
                className="inline-flex items-center gap-2 !px-3 py-1 btn-primary text-capitalize !font-bold text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
              >
                <FaStar className="text-yellow-400 fill-current" />
                Top 10 Rated in {reservationData.city}
              </Link>
            </span>
        </h1>

        <div className="bg-white rounded-xl shadow-lg !p-4">
            <div className="mb-2 relative" ref={serviceDropdownRef}>
          <div
            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
            className="w-full text-[14px] sm:text-base ps-2 pe-4 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ServiceIcon type="restaurant" className="text-gray-400 text-[18px]" />
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
                <span className="text-black font-medium">City</span>
                <div className="flex items-center gap-2">
                  <span className="text-black font-bold">
                    {selectedCity || "Select City"}
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
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-black font-medium ${
                        selectedCity === city ? "bg-gray-50" : ""
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
              <span className="text-black font-medium">Guests</span>
              <div className="flex items-center gap-2">
                <span className="text-black font-bold">
                  {selectedGuests} {selectedGuests === 1 ? "person" : "people"}
                </span>
                <IoIosPeople className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-[24px]" />
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
                    {num} {num === 1 ? "person" : "people"}
                  </div>
                ))}
              </div>
            )}
          </div>
            <ReservationsFilters
              showTitle={true}
              serviceType="restaurant"
              selectedService={selectedService}
              onSelectService={handleServiceSelected}
            />
        </div>       
        <div className="row pt-2 g-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="col-md-12 col-lg-6">
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 shadow-sm animate-pulse"
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
          ) : restaurants?.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-shop text-6xl text-gray-400"></i>
              <p className="mt-3 text-gray-600 text-lg">
                No restaurants nearby yet — more are coming soon.
              </p>
                    <div className="mt-6">
                      <h4 className="text-gray-700 font-semibold mb-3">List your restaurant</h4>
                      <Link
                        href="/partner-with-us#restaurants"
                        className="inline-block px-6 py-2.5 bg_red text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                      >
                        Get Started
                      </Link>
                    </div>
            </div>
          ) : (
            restaurants?.map((restaurant, idx) => {
              const rating = Number(restaurant?.rating || 0);
              const ratingDisplay = rating > 0 ? rating.toFixed(1) : "New";
              const reviewCount = Number(restaurant?.reviewCount || 0);
              const distance = restaurant?.distance
                ? formatDistance(restaurant.distance)
                : null;
              const priceRange = restaurant?.priceRange || "$$$";

              return (
                <div className="col-md-12 col-lg-6">
                  <div
                    key={idx}
                    className="bg-white rounded-xl !p-2 shadow-sm flex !gap-2 sm:!p-4 sm:!gap-4 "
                  >
                    <div className="flex-shrink-0">
                      <div className="w-[110px] h-[130px] rounded-lg overflow-hidden">
                        {restaurant?.image ? (
                          <img
                            src={getFileUrl(restaurant?.image)}
                            alt={restaurant?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <i className="bi bi-image text-gray-400 text-2xl"></i>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex gap-1 items-start justify-between">
                          <h3 className="text-[20px] sm:text-lg  font-bold text-black mb-1 break-words truncate  text-decoration-underline">
                            {restaurant?.name}
                          </h3>

                        </div>

                        <div 
                          className="flex items-center gap-1 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
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
                            {isNewItem(restaurant?.createdAt, 30) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                {t("new_badge") || "New"}
                              </span>
                            )}
                            {restaurant?.shop_metadata?.halal && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                Halal
                              </span>
                            )}
                          </div>
                        </div>

                        {(restaurant.address1 || restaurant.city || restaurant.country) && (
                          <div className="flex items-center gap-1.5 mb-2 text-gray-600">
                            <span className="text-sm text-gray-600">
                              {[restaurant.address1]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-between  items-center">
                        <div className="inline-block px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md mb-1">
                          No Deposit Required
                        </div>
                       
                        <button
                          onClick={() => handleReserve(restaurant.id)}
                          className="px-3 py-1.5 bg_red text-white rounded-4 text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                          {t("reserve") || "Reserve"}
                        </button>
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
          setSelectedRestaurant(null);
        }}
        title="Rating"
        subtitle={selectedRestaurant ? selectedRestaurant.name : "Restaurant"}
        rating={Number(selectedRestaurant?.rating || 0)}
        isStatic={true}
      />
    </div>
  );
}
