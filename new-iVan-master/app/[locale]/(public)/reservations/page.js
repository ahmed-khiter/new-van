"use client";
import LocationBadge from "@/components/LocationBadge";
import { useRouter } from "@/i18n/routing";
import { getCitiesForLocation, getLocationFromStorage } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsCalendar2Date } from "react-icons/bs";
import { FaChevronDown } from "react-icons/fa";
import { MdLocationOn, MdOutlineAccessTimeFilled } from "react-icons/md";
import { ServiceIcon, NumberOfServices } from "@/components/ServiceIcon";

const serviceConfig = {
  mot: {
    title: "Book MOT, Servicing & Repairs",
    description:
      "Fast, trusted vehicle inspections, servicing, and repairs at verified garages near you",
    defaultTime: { hours: 9, minutes: 0 },
    defaultGuests: 1,
    maxGuests: 5,
    guestsLabel: "Vehicles",
    guestsSingular: "vehicle",
    guestsPlural: "vehicles",
    buttonText: "Find MOT Centers",
    nextPageRoute: "/reservations/mot",
    bannerImage: "/assets/img/reservation_banners/bg_3.jpeg",
  },
  spa: {
    title: "Book Spa Treatments",
    description:
      "Relax with massage, sauna, and steam sessions at premium spas near you",
    defaultTime: { hours: 19, minutes: 0 },
    defaultGuests: 2,
    maxGuests: 20,
    guestsLabel: "Guests",
    guestsSingular: "person",
    guestsPlural: "people",
    buttonText: "Find Spas",
    nextPageRoute: "/reservations/spa",
    bannerImage: "/assets/img/reservation_banners/bg_2.jpeg",
  },
  beauty: {
    title: "Beauty Appointments",
    description:
      "Book hair, nail, and laser hair removal treatments at top-rated salons near you",
    defaultTime: { hours: 10, minutes: 0 },
    defaultGuests: 1,
    maxGuests: 5,
    guestsLabel: "Guests",
    guestsSingular: "guest",
    guestsPlural: "guests",
    buttonText: "Find Beauty Salons",
    nextPageRoute: "/reservations/beauty",
    bannerImage: "/assets/img/reservation_banners/bg_4.jpeg",
  },
  shisha: {
    title: "Book a Shisha Lounge",
    description:
      "Reserve a table at premium shisha lounges and enjoy a relaxed social setting with friends",
    defaultTime: { hours: 19, minutes: 0 },
    defaultGuests: 2,
    maxGuests: 20,
    guestsLabel: "Guests",
    guestsSingular: "person",
    guestsPlural: "people",
    buttonText: "Find Shisha Lounges",
    nextPageRoute: "/reservations/shisha",
    bannerImage: "/assets/img/reservation_banners/bg_5.jpeg",
  },
  restaurant: {
    title: "Book a Table",
    description:
      "Discover and reserve tables at top-rated restaurants near you",
    defaultTime: { hours: 19, minutes: 0 },
    defaultGuests: 2,
    maxGuests: 20,
    guestsLabel: "Guests",
    guestsSingular: "person",
    guestsPlural: "people",
    buttonText: "Reserve Table",
    nextPageRoute: "/reservations/restaurants",
    bannerImage: "/assets/img/reservation_banners/bg_1.jpg",
  },
  healthcare: {
    title: "Book Healthcare Appointment",
    description:
      "Schedule appointments with trusted healthcare providers. Dentist, clinic, IV drip, and more.",
    defaultTime: { hours: 10, minutes: 0 },
    defaultGuests: 1,
    maxGuests: 5,
    guestsLabel: "Patients",
    guestsSingular: "Patient",
    guestsPlural: "Patients",
    buttonText: "Find Healthcare Providers",
    nextPageRoute: "/reservations/healthcare",
    bannerImage: "/assets/img/reservation_banners/bg_7.jpeg",
  },
  events: {
    title: "Book Event Services",
    description:
      "Hire professional event services. DJ, live music, character appearances, and more.",
    defaultTime: { hours: 18, minutes: 0 },
    defaultGuests: 1,
    maxGuests: 20,
    guestsLabel: "Guests",
    guestsSingular: "guest",
    guestsPlural: "guests",
    buttonText: "Find Event Services",
    nextPageRoute: "/reservations/events",
    bannerImage: "/assets/img/reservation_banners/bg_8.jpeg",
  },
  entertainment: {
    title: "Book Entertainment Venue",
    description:
      "Reserve exciting entertainment experiences. VR, bowling, karaoke, and more.",
    defaultTime: { hours: 18, minutes: 0 },
    defaultGuests: 2,
    maxGuests: 20,
    guestsLabel: "Guests",
    guestsSingular: "guest",
    guestsPlural: "guests",
    buttonText: "Find Entertainment Venues",
    nextPageRoute: "/reservations/entertainment",
    bannerImage: "/assets/img/reservation_banners/bg_6.jpeg",
  },
};

export default function ReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("ReservationsPage");
  const serviceType = searchParams?.get("service") || "restaurant";
  const config = serviceConfig[serviceType] || serviceConfig.restaurant;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(() => {
    const today = new Date();
    today.setHours(config.defaultTime.hours, config.defaultTime.minutes, 0, 0);
    return today;
  });
  const [selectedGuests, setSelectedGuests] = useState(config.defaultGuests);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const guestsDropdownRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceDropdownRef = useRef(null);

  // Service options mapping
  const serviceOptions = [
    {
      label: "Food reservation",
      route: "/reservations/restaurants",
      serviceType: "restaurant",
    },
    {
      label: "Beauty appointments",
      route: "/reservations/beauty",
      serviceType: "beauty",
    },
    {
      label: "Shisha lounge",
      route: "/reservations/shisha",
      serviceType: "shisha",
    },
    { label: "MOT &  Repairs", route: "/reservations/mot", serviceType: "mot" },
    { label: "Spa Treatments", route: "/reservations/spa", serviceType: "spa" },
    {
      label: "Healthcare",
      route: "/reservations/healthcare",
      serviceType: "healthcare",
    },
    { label: "Events", route: "/reservations/events", serviceType: "events" },
    {
      label: "Entertainment",
      route: "/reservations/entertainment",
      serviceType: "entertainment",
    },
  ];

  const currentService =
    serviceOptions.find((opt) => opt.serviceType === serviceType) ||
    serviceOptions[1];
  const guestsOptions = Array.from(
    { length: config.maxGuests },
    (_, i) => i + 1
  );

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

    window.addEventListener("locationChanged", handleLocationChange);
    window.addEventListener("storage", handleLocationChange);

    return () => {
      window.removeEventListener("locationChanged", handleLocationChange);
      window.removeEventListener("storage", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        guestsDropdownRef.current &&
        !guestsDropdownRef.current.contains(event.target)
      ) {
        setShowGuestsDropdown(false);
      }
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target)
      ) {
        setShowCityDropdown(false);
      }
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target)
      ) {
        setShowServiceDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBookNow = () => {
    const dateStr = selectedDate.toISOString().split("T")[0];

    const hours = selectedTime.getHours().toString().padStart(2, "0");
    const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    const params = new URLSearchParams({
      date: dateStr,
      time: timeStr,
      guests: selectedGuests.toString(),
    });

    if (selectedCity) {
      params.append("city", selectedCity);
    }

    router.push(`${config.nextPageRoute}?${params.toString()}`);
  };

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

  return (
    <div
      className="relative min-h-screen flex items-end justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${config.bannerImage}')` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50 sm:p-4 p-3">
        <div className="w-full max-w-lg mx-auto sm:pt-0 pt-20">
          <div className="mb-2 flex justify-start">
            <LocationBadge
              text={() => (
                <span className="font-extrabold">
                  Showing business’s in United Kingdom
                </span>
              )}
              changeButtonText={t("change")}
              className="justify-content-center text-center"
              type="restaurant"
              showChangeButton={false}
            />
          </div>
          <div className="heading_box mb-4">
            <h2 className="text-3xl font-bold   text-white">
              {config.title}{" "}
              {config.subtitle && (
                <>
                  <br /> {config.subtitle}
                </>
              )}
            </h2>
            {config.description && (
              <p className="text-white">{config.description}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg !p-3 ">
            <div className="mb-2 relative" ref={serviceDropdownRef}>
              <div
                onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                className="w-full text-[14px] sm:text-base ps-[35px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
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
                <div
                  className="
                absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg
                max-h-60 !overflow-y-scroll
                !scrollbar-thin
                !scrollbar-thumb-gray-400
                !scrollbar-track-gray-200
                !scrollbar-gutter-stable
                overscroll-contain
              "
                >
                  {serviceOptions.map((option) => {
                    return (
                      <div
                        key={option.serviceType}
                        onClick={() => {
                          setShowServiceDropdown(false);
                          // Only update the "service" param in the url, leave all else
                          const url = new URL(window.location.href);
                          url.searchParams.set("service", option.serviceType);
                          window.history.replaceState(
                            {},
                            "",
                            `${url.pathname}?${url.searchParams.toString()}`
                          );
                        }}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-black font-medium ${
                          currentService.serviceType === option.serviceType
                            ? "bg-gray-50"
                            : ""
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
                  className="w-full text-[14px] sm:text-base ps-[35px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
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

            <div className="mb-6 relative" ref={guestsDropdownRef}>
              <div
                onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
                className="w-full text-[14px] sm:text-base ps-[35px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
              >
                <span className="text-black font-medium">
                  {config.guestsLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-black font-bold">
                    {selectedGuests}{" "}
                    {selectedGuests === 1
                      ? config.guestsSingular
                      : config.guestsPlural}
                  </span>
                  <NumberOfServices
                    type={serviceType}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-[24px]"
                  />
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
                      {num}{" "}
                      {num === 1 ? config.guestsSingular : config.guestsPlural}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleBookNow}
              className="btn btn-lg bg_red text-white w-full rounded-5 flex items-center justify-center gap-2"
            >
              🔎 {config.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
