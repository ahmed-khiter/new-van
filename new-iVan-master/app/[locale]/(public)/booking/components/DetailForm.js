'use client'
import { useMemo, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import {
    howManyHoursOptions,
    howManyItemsOptions,
    howManyRoomsOptions,
    howManyBathroomsOptions,
    typeOfKeyOptions,
    typeOfLockOptions,
    typeOfPlaceOptions,
    vehicleData
} from "@/utils/helper";
import { FaInfoCircle, FaRegClock, FaUsers, FaUser, FaPhone, FaEnvelope, FaTruck, FaBox, FaCar, FaStore, FaIdCard, FaKey, FaHome, FaStickyNote, FaBed, FaBath, FaChevronDown } from "react-icons/fa";
import { BsCalendar2Date } from "react-icons/bs";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { useTranslations } from "next-intl";
import PhoneInput from "@/components/Fields/PhoneInput";
import "react-datepicker/dist/react-datepicker.css";

function DetailForm({ formData, handleInputChange, errors }) {
    const selectedCategory = formData?.category
    const t = useTranslations('PublicPages.detailForm');

    // Helper functions to format dates and times
    const formatDate = (date) => {
        if (!date) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatTime = (date) => {
        if (!date) return '';
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    // Convert string dates to Date objects for DatePicker
    const pickupDateValue = useMemo(() => {
        if (!formData?.pickupDate) return null;
        const date = new Date(formData.pickupDate);
        return isNaN(date.getTime()) ? null : date;
    }, [formData?.pickupDate]);

    const pickupTimeValue = useMemo(() => {
        if (!formData?.pickupFixedTime || formData?.isPickupTimeFlexible) return null;
        const [hours, minutes] = formData.pickupFixedTime.split(':');
        if (!hours || !minutes) return null;
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date;
    }, [formData?.pickupFixedTime, formData?.isPickupTimeFlexible]);

    const dropoffDateValue = useMemo(() => {
        if (!formData?.dropOffDate) return null;
        const date = new Date(formData.dropOffDate);
        return isNaN(date.getTime()) ? null : date;
    }, [formData?.dropOffDate]);

    const dropoffTimeValue = useMemo(() => {
        if (!formData?.dropOffFixedTime || formData?.isDropOffTimeFlexible) return null;
        const [hours, minutes] = formData.dropOffFixedTime.split(':');
        if (!hours || !minutes) return null;
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date;
    }, [formData?.dropOffFixedTime, formData?.isDropOffTimeFlexible]);

    // Convert year string to Date object for DatePicker
    const yearValue = useMemo(() => {
        if (!formData?.year) return null;
        const year = parseInt(formData.year);
        if (isNaN(year)) return null;
        const date = new Date();
        date.setFullYear(year, 0, 1); // Set to January 1st of the selected year
        return date;
    }, [formData?.year]);

    // Custom input components
    const CustomDateInput = ({ value, onClick }) => (
        <div className="relative w-full">
            <input
                type="text"
                value={value}
                onClick={onClick}
                readOnly
                className="w-full text-[14px] sm:text-base ps-[35px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-10 input-field"
            />
            <BsCalendar2Date className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" style={{ color: "var(--orange)" }} />
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
                className="w-full text-[14px] sm:text-base ps-[30px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-10 input-field"
            />
            <MdOutlineAccessTimeFilled className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" style={{ color: "var(--orange)" }} />
            <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
    );

    const CustomYearInput = ({ value, onClick }) => (
        <div className="relative w-full">
            <input
                type="text"
                value={value}
                onClick={onClick}
                readOnly
                className="w-full text-[14px] sm:text-base ps-[35px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-10 input-field"
                placeholder={t('vehicle_year_ph')}
            />
            <FaCar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" style={{ color: "var(--orange)" }} />
            <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
    );

    // Handlers for date/time changes
    const handlePickupDateChange = (date) => {
        if (date) {
            const dateStr = date.toISOString().split('T')[0];
            handleInputChange('pickupDate', dateStr);
        }
    };

    const handlePickupTimeChange = (time) => {
        if (time) {
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            handleInputChange('pickupFixedTime', timeStr);
        }
    };

    const handleDropoffDateChange = (date) => {
        if (date) {
            const dateStr = date.toISOString().split('T')[0];
            handleInputChange('dropOffDate', dateStr);
        }
    };

    const handleDropoffTimeChange = (time) => {
        if (time) {
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            handleInputChange('dropOffFixedTime', timeStr);
        }
    };

    const handleYearChange = (date) => {
        if (date) {
            const year = date.getFullYear().toString();
            handleInputChange('year', year);
        }
    };

    // Handle urgent checkbox - set ASAP in pickup time when urgent is checked
    useEffect(() => {
        if (formData?.requireUrgent && !formData?.isPickupTimeFlexible && formData?.pickupFixedTime !== 'ASAP') {
            handleInputChange('pickupFixedTime', 'ASAP');
        } else if (!formData?.requireUrgent && formData?.pickupFixedTime === 'ASAP') {
            handleInputChange('pickupFixedTime', '');
        }
    }, [formData?.requireUrgent, formData?.isPickupTimeFlexible, formData?.pickupFixedTime]);

    return (
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <div className="space-y-6">
                {/* Pickup Date and Time Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Pickup Date */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                <BsCalendar2Date
                                    className="mr-2"
                                    style={{ color: "var(--orange)" }}
                                />
                                {(() => {
                                    // Categories that keep "Pickup Date" terminology: Van (Couriers), Recovery, Removals (Rubbish), Click & Collect
                                    const keepPickupDateCategories = ["Van", "Recovery", "Removals", "Click & Collect"];
                                    return keepPickupDateCategories.includes(selectedCategory) ? t('pickup_date') : t('job_date');
                                })()}
                            </label>
                        </div>
                        <div className="custom_datepicker">
                            <DatePicker
                                selected={pickupDateValue}
                                onChange={handlePickupDateChange}
                                dateFormat="dd MMM yyyy"
                                minDate={new Date()}
                                customInput={<CustomDateInput />}
                                wrapperClassName="w-full"
                            />
                        </div>
                        {errors.pickupDate && (
                            <p className="mt-1 text-sm text-red-500">{errors.pickupDate}</p>
                        )}
                    </div>

                    {/* Pickup Time */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                <MdOutlineAccessTimeFilled
                                    className="mr-2"
                                    style={{ color: "var(--orange)" }}
                                />
                                {t('pickup_time')}
                            </label>
                        </div>
                        {formData?.isPickupTimeFlexible ? (
                            <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded input-field bg-gray-50">
                                <span className="text-sm text-gray-600">{t('pickup_time_flexible')}</span>
                            </div>
                        ) : formData?.requireUrgent ? (
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value="ASAP"
                                    readOnly
                                    className="w-full text-[14px] sm:text-base ps-[30px] pe-2 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-field"
                                />
                                <MdOutlineAccessTimeFilled className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" style={{ color: "var(--orange)" }} />
                            </div>
                        ) : (
                            <DatePicker
                                selected={pickupTimeValue}
                                onChange={handlePickupTimeChange}
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                dateFormat="h:mm aa"
                                customInput={<CustomTimeInput />}
                                wrapperClassName="w-full"
                            />
                        )}
                        {errors.pickupFixedTime && (
                            <p className="mt-1 text-sm text-red-500">{errors.pickupFixedTime}</p>
                        )}
                    </div>
                </div>

                {/* Require Urgent */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="requireUrgent"
                            checked={formData?.requireUrgent || false}
                            onChange={(e) => handleInputChange('requireUrgent', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="requireUrgent" className="text-sm font-medium mb-0 text-gray-700">
                            {t('require_urgent')}
                        </label>
                    </div>
                </div>

                {/* Dropoff Date and Time Row - Only show for Van, Recovery, Click & Collect */}
                {["Van", "Recovery", "Click & Collect"].includes(selectedCategory) && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Dropoff Date */}
                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                        <BsCalendar2Date
                                            className="mr-2"
                                            style={{ color: "var(--orange)" }}
                                        />
                                        {t('dropoff_date')}
                                    </label>
                                </div>
                                <div className="custom_datepicker">
                                    <DatePicker
                                        selected={dropoffDateValue}
                                        onChange={handleDropoffDateChange}
                                        dateFormat="dd MMM yyyy"
                                        minDate={pickupDateValue || new Date()}
                                        customInput={<CustomDateInput />}
                                        wrapperClassName="w-full"
                                    />
                                </div>
                                {errors.dropOffDate && (
                                    <p className="mt-1 text-sm text-red-500">{errors.dropOffDate}</p>
                                )}
                            </div>

                            {/* Dropoff Time */}
                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                        <MdOutlineAccessTimeFilled
                                            className="mr-2"
                                            style={{ color: "var(--orange)" }}
                                        />
                                        {t('dropoff_time')}
                                    </label>
                                </div>
                                {formData?.isDropOffTimeFlexible ? (
                                    <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded input-field bg-gray-50">
                                        <span className="text-sm text-gray-600">{t('dropoff_time_flexible')}</span>
                                    </div>
                                ) : (
                                    <DatePicker
                                        selected={dropoffTimeValue}
                                        onChange={handleDropoffTimeChange}
                                        showTimeSelect
                                        showTimeSelectOnly
                                        timeIntervals={15}
                                        dateFormat="h:mm aa"
                                        customInput={<CustomTimeInput />}
                                        wrapperClassName="w-full"
                                    />
                                )}
                                {errors.dropOffFixedTime && (
                                    <p className="mt-1 text-sm text-red-500">{errors.dropOffFixedTime}</p>
                                )}
                            </div>
                        </div>

                        {/* Dropoff Time Flexible */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="isDropOffTimeFlexible"
                                    checked={formData?.isDropOffTimeFlexible}
                                    onChange={(e) => handleInputChange('isDropOffTimeFlexible', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isDropOffTimeFlexible" className="text-sm font-medium mb-0 text-gray-700">
                                    {t('dropoff_time_flexible')}
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {selectedCategory === "Van" ? (
                    <>
                        {/* Van Type */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaTruck
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('van_type')}
                                </label>
                            </div>
                            <select
                                value={formData?.vanSize || ""}
                                onChange={(e) => handleInputChange("vanSize", e.target.value)}
                                className="input-field"
                            >
                                <option value="" hidden>{t('select_van_size')}</option>
                                <option value="bike">{t('bike')}</option>
                                <option value="motorbike">{t('motorbike')}</option>
                                <option value="car">{t('car')}</option>
                                <option value="small_van">{t('small_van')}</option>
                                <option value="medium_van">{t('medium_van')}</option>
                                <option value="large_van">{t('large_van')}</option>
                                <option value="xl_van">{t('xl_van')}</option>
                            </select>
                            {errors.vanSize && (
                                <p className="mt-1 text-sm text-red-500">{errors.vanSize}</p>
                            )}
                        </div>

                        {/* Moving Items */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaBox
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('moving_what')}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={formData?.movingItem || ""}
                                onChange={(e) => handleInputChange("movingItem", e.target.value)}
                                className="input-field"
                                placeholder={t('moving_what_ph')}
                            />
                            {errors.movingItem && (
                                <p className="mt-1 text-sm text-red-500">{errors.movingItem}</p>
                            )}
                        </div>

                        {/* Loading Assistance */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="isHelpLoading"
                                    checked={formData?.isHelpLoading}
                                    onChange={(e) =>
                                        handleInputChange("isHelpLoading", e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="isHelpLoading"
                                    className="text-sm font-medium mb-0 text-gray-700"
                                >
                                    {t('help_loading')}
                                </label>
                            </div>
                        </div>

                        {/* Two Men */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="isTwoMenRequired"
                                    checked={formData?.isTwoMenRequired}
                                    onChange={(e) =>
                                        handleInputChange("isTwoMenRequired", e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="isTwoMenRequired"
                                    className="text-sm font-medium mb-0 text-gray-700"
                                >
                                    {t('two_men')}
                                </label>
                            </div>
                        </div>
                    </>
                ) : selectedCategory === "Recovery" ? (
                    <>
                        {/* Vehicle Make */}
                    <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                        <FaCar
                            className="mr-2"
                            style={{ color: "var(--orange)" }}
                        />
                        {t('vehicle_make')}
                        </label>
                    </div>
                    <select
                        value={formData?.make || ""}
                        onChange={(e) => handleInputChange("make", e.target.value)}
                        className="input-field"
                    >
                        <option value="">{t('select_vehicle_make')}</option>
                        {Object.keys(vehicleData).map((make) => (
                        <option key={make} value={make}>
                            {make}
                        </option>
                        ))}
                    </select>
                    {errors.make && (
                        <p className="mt-1 text-sm text-red-500">{errors.make}</p>
                    )}
                    </div>

                    {/* Vehicle Model */}
                    <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                        <FaCar
                            className="mr-2"
                            style={{ color: "var(--orange)" }}
                        />
                        {t('vehicle_model')}
                        </label>
                    </div>
                    <select
                        value={formData?.model || ""}
                        onChange={(e) => handleInputChange("model", e.target.value)}
                        className="input-field"
                        disabled={!formData?.make} // disable until make is chosen
                    >
                        <option value="">{t('select_vehicle_model')}</option>
                        {formData?.make &&
                        vehicleData[formData.make]?.map((model) => (
                            <option key={model} value={model}>
                            {model}
                            </option>
                        ))}
                    </select>
                    {errors.model && (
                        <p className="mt-1 text-sm text-red-500">{errors.model}</p>
                    )}
                    </div>


                        {/* Vehicle Year */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaCar
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('vehicle_year')}
                                </label>
                            </div>
                            <div className="custom_datepicker">
                                <DatePicker
                                    selected={yearValue}
                                    onChange={handleYearChange}
                                    showYearPicker
                                    dateFormat="yyyy"
                                    yearItemNumber={12}
                                    minDate={new Date(1900, 0, 1)}
                                    maxDate={new Date()}
                                    customInput={<CustomYearInput />}
                                    wrapperClassName="w-full"
                                />
                            </div>
                            {errors.year && (
                                <p className="mt-1 text-sm text-red-500">{errors.year}</p>
                            )}
                        </div>


                        {/* Does Car Turn On */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="doesCarTurnOn"
                                    checked={formData?.doesCarTurnOn}
                                    onChange={(e) =>
                                        handleInputChange("doesCarTurnOn", e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="doesCarTurnOn"
                                    className="text-sm font-medium mb-0 text-gray-700"
                                >
                                    {t('car_turn_on')}
                                </label>
                            </div>
                        </div>
                    </>
                ) : selectedCategory === "Removals" ? (
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                <FaUsers
                                    className="mr-2"
                                    style={{ color: "var(--orange)" }}
                                />
                                {t('how_many_items')}
                            </label>
                        </div>
                        <select
                            value={formData?.howManyItems || ""}
                            onChange={(e) => handleInputChange("howManyItems", Number(e.target.value))}
                            className="input-field"
                        >
                            <option value="" hidden>
                                {t('select')}
                            </option>
                            {howManyItemsOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.howManyItems && (
                            <p className="mt-1 text-sm text-red-500">{errors.howManyItems}</p>
                        )}
                    </div>
                ) : selectedCategory === "Locksmith" ? (
                    <>
                        {/* Type of Key */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaKey
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('type_of_key')}
                                </label>
                            </div>
                            <select
                                value={formData?.typeOfKey || ""}
                                onChange={(e) => handleInputChange("typeOfKey", e.target.value)}
                                className="input-field"
                            >
                                <option value="" hidden>{t('select')}</option>
                                {typeOfKeyOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.typeOfKey && (
                                <p className="mt-1 text-sm text-red-500">{errors.typeOfKey}</p>
                            )}
                        </div>

                        {/* Type of Lock */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaKey
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('type_of_lock')}
                                </label>
                            </div>
                            <select
                                value={formData?.typeOfLock || ""}
                                onChange={(e) => handleInputChange("typeOfLock", e.target.value)}
                                className="input-field"
                            >
                                <option value="" hidden>{t('select')}</option>
                                {typeOfLockOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.typeOfLock && (
                                <p className="mt-1 text-sm text-red-500">{errors.typeOfLock}</p>
                            )}
                        </div>
                    </>
                ) : selectedCategory === "Cleaning" ? (
                    <>
                        {/* How many Bedrooms */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaBed
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('how_many_rooms')}
                                </label>
                            </div>
                            <select
                                value={formData?.howManyRooms || ""}
                                onChange={(e) => handleInputChange("howManyRooms", Number(e.target.value))}
                                className="input-field"
                            >
                                <option value="" hidden>{t('select')}</option>
                                {howManyRoomsOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.howManyRooms && (
                                <p className="mt-1 text-sm text-red-500">{errors.howManyRooms}</p>
                            )}
                        </div>

                        {/* How many Bathrooms */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaBath
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('how_many_bathrooms')}
                                </label>
                            </div>
                            <select
                                value={formData?.howManyBathrooms || ""}
                                onChange={(e) => handleInputChange("howManyBathrooms", Number(e.target.value))}
                                className="input-field"
                            >
                                <option value="" hidden>{t('select')}</option>
                                {howManyBathroomsOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.howManyBathrooms && (
                                <p className="mt-1 text-sm text-red-500">{errors.howManyBathrooms}</p>
                            )}
                        </div>

                        {/* How Many Hours */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <MdOutlineAccessTimeFilled
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('how_many_hours')}
                                </label>
                            </div>
                            <select
                                value={formData?.howManyHours || ""}
                                onChange={(e) => handleInputChange("howManyHours", Number(e.target.value))}
                                className="input-field"
                            >
                                <option value="" hidden>{t('select')}</option>
                                {howManyHoursOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.howManyHours && (
                                <p className="mt-1 text-sm text-red-500">{errors.howManyHours}</p>
                            )}
                        </div>

                        {/* Type Of Property */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaHome
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('type_of_property')}
                                </label>
                            </div>
                            <select
                                value={formData?.typeOfPlace || ""}
                                onChange={(e) => handleInputChange("typeOfPlace", e.target.value)}
                                className="input-field"
                            >
                                <option value="" hidden>{t('select')}</option>
                                {typeOfPlaceOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.typeOfPlace && (
                                <p className="mt-1 text-sm text-red-500">{errors.typeOfPlace}</p>
                            )}
                        </div>

                        {/* Has Cleaning Products */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="hasCleaningProducts"
                                    checked={formData?.hasCleaningProducts}
                                    onChange={(e) =>
                                        handleInputChange("hasCleaningProducts", e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="hasCleaningProducts"
                                    className="text-sm font-medium mb-0 text-gray-700"
                                >
                                    {t('has_cleaning_products')}
                                </label>
                            </div>
                        </div>

                    </>
                ) : selectedCategory === "Car Key Replacement" ? (
                    <>
     {/* Vehicle Make */}
                    <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                        <FaCar
                            className="mr-2"
                            style={{ color: "var(--orange)" }}
                        />
                        {t('vehicle_make')}
                        </label>
                    </div>
                    <select
                        value={formData?.make || ""}
                        onChange={(e) => handleInputChange("make", e.target.value)}
                        className="input-field"
                    >
                        <option value="">{t('select_vehicle_make')}</option>
                        {Object.keys(vehicleData).map((make) => (
                        <option key={make} value={make}>
                            {make}
                        </option>
                        ))}
                    </select>
                    {errors.make && (
                        <p className="mt-1 text-sm text-red-500">{errors.make}</p>
                    )}
                    </div>

                    {/* Vehicle Model */}
                    <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <label className="text-sm font-medium mb-0 text-gray-700">
                        {t('vehicle_model')}
                        </label>
                    </div>
                    <select
                        value={formData?.model || ""}
                        onChange={(e) => handleInputChange("model", e.target.value)}
                        className="input-field"
                        disabled={!formData?.make} // disable until make is chosen
                    >
                        <option value="">{t('select_vehicle_model')}</option>
                        {formData?.make &&
                        vehicleData[formData.make]?.map((model) => (
                            <option key={model} value={model}>
                            {model}
                            </option>
                        ))}
                    </select>
                    {errors.model && (
                        <p className="mt-1 text-sm text-red-500">{errors.model}</p>
                    )}
                    </div>


                        {/* Vehicle Year */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaCar
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('vehicle_year')}
                                </label>
                            </div>
                            <div className="custom_datepicker">
                                <DatePicker
                                    selected={yearValue}
                                    onChange={handleYearChange}
                                    showYearPicker
                                    dateFormat="yyyy"
                                    yearItemNumber={12}
                                    minDate={new Date(1900, 0, 1)}
                                    maxDate={new Date()}
                                    customInput={<CustomYearInput />}
                                    wrapperClassName="w-full"
                                />
                            </div>
                            {errors.year && (
                                <p className="mt-1 text-sm text-red-500">{errors.year}</p>
                            )}
                        </div>



                        {/* Has Log Book */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="hasLogBook"
                                    checked={formData?.hasLogBook}
                                    onChange={(e) =>
                                        handleInputChange("hasLogBook", e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="hasLogBook"
                                    className="text-sm font-medium mb-0 text-gray-700"
                                >
                                    Do you need urgent assistance?
                                </label>
                            </div>
                        </div>

                        {/* Has Car Key */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="hasCarKey"
                                    checked={formData?.hasCarKey}
                                    onChange={(e) =>
                                        handleInputChange("hasCarKey", e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="hasCarKey"
                                    className="text-sm font-medium mb-0 text-gray-700"
                                >
                                    Do you have the car key?
                                </label>
                            </div>
                        </div>
                    </>
                ) : selectedCategory === "Click & Collect" ? (
                    <>
                        {/* Store Name */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaStore
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('store_name')}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={formData?.storeName || ""}
                                onChange={(e) => handleInputChange("storeName", e.target.value)}
                                className="input-field"
                                placeholder={t('store_name_ph')}
                            />
                            {errors.storeName && (
                                <p className="mt-1 text-sm text-red-500">{errors.storeName}</p>
                            )}
                        </div>

                        {/* Click & Collect ID Number */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaIdCard
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('click_collect_id')}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={formData?.clickAndCollectIdNumber || ""}
                                onChange={(e) =>
                                    handleInputChange("clickAndCollectIdNumber", e.target.value)
                                }
                                className="input-field"
                                placeholder={t('click_collect_id_ph')}
                            />
                            {errors.clickAndCollectIdNumber && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.clickAndCollectIdNumber}
                                </p>
                            )}
                        </div>

                        {/* Your Name */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaUser
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('your_name')}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={formData?.yourName || ""}
                                onChange={(e) => handleInputChange("yourName", e.target.value)}
                                className="input-field"
                                placeholder={t('your_name_ph')}
                            />
                            {errors.yourName && (
                                <p className="mt-1 text-sm text-red-500">{errors.yourName}</p>
                            )}
                        </div>

                        {/* Contact Number */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                                    <FaPhone
                                        className="mr-2"
                                        style={{ color: "var(--orange)" }}
                                    />
                                    {t('contact_number')}
                                </label>
                            </div>
                            <PhoneInput
                                value={formData?.contactNumber || ""}
                                onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                                className="input-field"
                                placeholder={t('contact_number_ph')}
                            />
                            {errors.contactNumber && (
                                <p className="mt-1 text-sm text-red-500">{errors.contactNumber}</p>
                            )}
                        </div>
                    </>
                )
                    : null}


                {/* notes */}
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <label className="flex items-center text-sm font-medium mb-0 text-gray-700">
                            <FaStickyNote
                                className="mr-2"
                                style={{ color: "var(--orange)" }}
                            />
                            {t('notes')}
                        </label>
                    </div>
                    <textarea
                        value={formData?.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder={t('notes_ph')}
                    />
                </div>
            </div>
        </div >
    )
}

export default DetailForm