import AddressInput from '@/components/Fields/AddressInput';
import { calculateDistance as calculateStraightLineDistance } from '@/utils/helper';
import { useTranslations } from 'next-intl';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";
import DatePicker from 'react-datepicker';
import { Controller } from "react-hook-form";

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
});

function JobFormLocationStep({
    nextStep,
    handleKeyDown,
    errors,
    register,
    prevStep,
    isLoading,
    setValue,
    isPickupTimeFlexible,
    isDropOffTimeFlexible,
    control,
    selectedCategory,
    watch
}) {
    const t = useTranslations('PublicPages.jobDistanceForm');
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropoffLocation, setDropoffLocation] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const { isGoogleMapsLoaded } = useGoogleMaps();


    // Calculate distance when both locations are set, or price for services without dropoff
    useEffect(() => {
        if (pickupLocation && dropoffLocation) {
            calculateDistance();
        } else if (pickupLocation && !["Van", "Recovery", "Click & Collect"].includes(selectedCategory)) {
            // For services without dropoff, set distance to 0
            setValue("distance", 0);
        }
    }, [pickupLocation, dropoffLocation, selectedCategory]);

    // Handle urgent checkbox - set ASAP in pickup time when urgent is checked
    const requireUrgent = watch("requireUrgent");
    const pickupFixedTime = watch("pickupFixedTime");
    useEffect(() => {
        if (requireUrgent && !isPickupTimeFlexible) {
            setValue("pickupFixedTime", "ASAP");
        } else if (!requireUrgent && pickupFixedTime === "ASAP") {
            setValue("pickupFixedTime", "");
        }
    }, [requireUrgent, isPickupTimeFlexible, setValue, pickupFixedTime]);

    const calculateDistance = async () => {
        if (!pickupLocation || !dropoffLocation) return;

        setIsCalculating(true);

        try {
            if (window.google && window.google.maps) {
                // Use Google Maps Distance Matrix API
                const service = new window.google.maps.DistanceMatrixService();
                service.getDistanceMatrix(
                    {
                        origins: [{ lat: pickupLocation.lat, lng: pickupLocation.lng }],
                        destinations: [{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }],
                        travelMode: window.google.maps.TravelMode.DRIVING,
                        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
                    },
                    (response, status) => {
                        if (status === 'OK' && response) {
                            const element = response.rows[0].elements[0];
                            if (element.status === 'OK') {
                                const distanceText = element.distance.text;
                                const distanceValue = parseFloat(distanceText.replace(/[^\d.]/g, ''));
                                setValue("distance", distanceValue);
                                
                                console.log('Distance calculated:', distanceText);
                            } else {
                                console.warn('Distance calculation failed:', element.status);
                                // Fallback to straight-line distance
                                const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
                                setValue("distance", straightLineDistance);
                            }
                        } else {
                            console.warn('Distance Matrix API failed:', status);
                            // Fallback to straight-line distance
                            const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
                            setValue("distance", straightLineDistance);
                        }
                        setIsCalculating(false);
                    }
                );
            } else {
                // Fallback to straight-line distance if Google Maps not loaded
                const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
                setValue("distance", straightLineDistance);
                
                setIsCalculating(false);
            }
        } catch (error) {
            console.error('Error calculating distance:', error);
            // Fallback to straight-line distance
            const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
            setValue("distance", straightLineDistance);
            
            setIsCalculating(false);
        }
    };

   

    const handlePickupLocationSelect = async (location) => {
        console.log('Pickup location selected:', location);
        setPickupLocation(location);
        // Update all pickup related fields in form data
        setValue("pickupAddressLine1", location?.address);
        setValue("pickupLat", location?.lat);
        setValue("pickupLng", location?.lng);
        setValue("pickupPostCode", location?.postcode || '');
        setValue("pickupCity", location?.city || location?.address?.split(',')[0] || '');
    };

    const handleDropoffLocationSelect = async (location) => {
        console.log('Dropoff location selected:', location);
        setDropoffLocation(location);
        // Update all dropoff related fields in form data
        setValue("dropOffAddressLine1", location?.address);
        setValue("dropOffLat", location?.lat);
        setValue("dropOffLng", location?.lng);
        setValue("dropOffPostCode", location?.postcode || '');
        setValue("dropOffCity", location?.city || location?.address?.split(',')[0] || '');
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                nextStep();
            }}
            onKeyDown={handleKeyDown}
            className="space-y-3"
        >
            {/* Address Input Section */}
            <div>
                {!isGoogleMapsLoaded && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">🔄 Loading Google Maps...</p>
                    </div>
                )}
                <div className="space-y-6">
                    <AddressInput
                        value={watch("pickupAddressLine1")}
                        onChange={(val) => setValue("pickupAddressLine1", val)}
                        onLocationSelect={handlePickupLocationSelect}
                        placeholder="Enter pickup address"
                        label="Pickup Address"
                    />
                    {errors.pickupAddressLine1 && (
                        <p className="mt-1 text-sm text-red-500">{errors.pickupAddressLine1.message}</p>
                    )}

                    {["Van", "Recovery", "Click & Collect"].includes(selectedCategory) && (
                        <>
                            <AddressInput
                                value={watch("dropOffAddressLine1")}
                                onChange={(val) => setValue("dropOffAddressLine1", val)}
                                onLocationSelect={handleDropoffLocationSelect}
                                placeholder="Enter dropoff address"
                                label="Dropoff Address"
                            />
                            {errors.dropOffAddressLine1 && (
                                <p className="mt-1 text-sm text-red-500">{errors.dropOffAddressLine1.message}</p>
                            )}

                            {/* Distance Display */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    Estimated Distance: {watch("distance")} miles
                                    {isCalculating && <span className="ml-2">🔄 Calculating...</span>}
                                </p>
                            </div>
                            {errors.distance && (
                                <p className="mt-1 text-sm text-red-500">{errors.distance.message}</p>
                            )}
                        </>
                    )}

                    {/* Location Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pickupLocation && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-sm text-green-800">✓ Pickup: {pickupLocation?.address}</p>
                            </div>
                        )}
                        {dropoffLocation && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <p className="text-sm text-red-800">✓ Dropoff: {dropoffLocation?.address}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Location Map</h3>
                <MapComponent
                    pickupLocation={pickupLocation}
                    dropoffLocation={dropoffLocation}
                    onPickupSelect={handlePickupLocationSelect}
                    onDropoffSelect={handleDropoffLocationSelect}
                />
            </div>
            {/* Pickup Details */}
            <div className="row">
                <div className="col-md-6">
                    <h4 className="mb-3">Pickup Details</h4>
                    
                    {/* Pickup Address Line 2 */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="pickupAddressLine2">
                            Pickup Address Line 2 (optional)
                        </label>
                        <input
                            type="text"
                            id="pickupAddressLine2"
                            {...register("pickupAddressLine2")}
                            className={`form-control ${errors.pickupAddressLine2 ? "is-invalid" : ""}`}
                        />
                        {errors.pickupAddressLine2 && (
                            <span className="invalid-feedback">
                                {errors.pickupAddressLine2.message}
                            </span>
                        )}
                    </div>

                    {/* Pickup Date */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="pickupDate">
                            {(() => {
                                // Categories that keep "Pickup Date" terminology: Van (Couriers), Recovery, Removals (Rubbish), Click & Collect
                                const keepPickupDateCategories = ["Van", "Recovery", "Removals", "Click & Collect"];
                                return keepPickupDateCategories.includes(selectedCategory) ? "Pickup Date" : "Job Date";
                            })()}
                        </label>
                        <div className="mt-1">
                            <Controller
                                name="pickupDate"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        {...field}
                                        selected={field.value}
                                        onChange={(date) => field.onChange(date)}
                                        dateFormat="dd/MM/yyyy"
                                        minDate={new Date()}
                                        className={`form-control w-full ${errors.pickupDate ? "is-invalid" : ""}`}
                                        placeholderText={(() => {
                                            const keepPickupDateCategories = ["Van", "Recovery", "Removals", "Click & Collect"];
                                            return keepPickupDateCategories.includes(selectedCategory) ? "Select pickup date" : "Select job date";
                                        })()}
                                        wrapperClassName="w-full"
                                    />
                                )}
                            />
                        </div>
                        {errors.pickupDate && (
                            <span className="invalid-feedback">
                                {errors.pickupDate.message}
                            </span>
                        )}
                    </div>


                    {/* Require Urgent */}
                    <div className="form-group">
                        <label className="form-label">Do you require someone to come to your location urgently?</label>
                        <Controller
                            name="requireUrgent"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input
                                        type="radio"
                                        id="requireUrgentYes"
                                        {...field}
                                        value="true"
                                        checked={field.value === true}
                                        onChange={() => setValue("requireUrgent", true)}
                                        className="ms-2"
                                    />{" "}
                                    Yes
                                    <input
                                        type="radio"
                                        id="requireUrgentNo"
                                        {...field}
                                        value="false"
                                        checked={field.value === false}
                                        onChange={() => setValue("requireUrgent", false)}
                                        className="ms-2"
                                    />{" "}
                                    No
                                </>
                            )}
                        />
                        {errors.requireUrgent && (
                            <span className="invalid-feedback">
                                {errors.requireUrgent.message}
                            </span>
                        )}
                    </div>

                    {/* Pickup Fixed Time */}
                    {!isPickupTimeFlexible && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="pickupFixedTime">
                                Pickup Time
                            </label>
                            {watch("requireUrgent") ? (
                                <input
                                    type="text"
                                    id="pickupFixedTime"
                                    value="ASAP"
                                    readOnly
                                    className="form-control"
                                />
                            ) : (
                                <input
                                    type="time"
                                    id="pickupFixedTime"
                                    {...register("pickupFixedTime")}
                                    className={`form-control ${errors.pickupFixedTime ? "is-invalid" : ""}`}
                                />
                            )}
                            {errors.pickupFixedTime && (
                                <span className="invalid-feedback">
                                    {errors.pickupFixedTime.message}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Dropoff Details */}
                {["Van", "Recovery", "Click & Collect"].includes(selectedCategory) && (
                    <div className="col-md-6">
                        <h4 className="mb-3">Dropoff Details</h4>
                        
                        {/* Dropoff Address Line 2 */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="dropOffAddressLine2">
                                Dropoff Address Line 2 (optional)
                            </label>
                            <input
                                type="text"
                                id="dropOffAddressLine2"
                                {...register("dropOffAddressLine2")}
                                className={`form-control ${errors.dropOffAddressLine2 ? "is-invalid" : ""}`}
                            />
                            {errors.dropOffAddressLine2 && (
                                <span className="invalid-feedback">
                                    {errors.dropOffAddressLine2.message}
                                </span>
                            )}
                        </div>


                        {/* Dropoff Date */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="dropOffDate">
                                Dropoff Date
                            </label>
                            <div className="mt-1">
                                <Controller
                                    name="dropOffDate"
                                    control={control}
                                    render={({ field }) => (
                                        <DatePicker
                                            {...field}
                                            selected={field.value}
                                            onChange={(date) => field.onChange(date)}
                                            dateFormat="dd/MM/yyyy"
                                            minDate={new Date()}
                                            className={`form-control w-full ${errors.dropOffDate ? "is-invalid" : ""}`}
                                            placeholderText="Select dropoff date"
                                            wrapperClassName="w-full"
                                        />
                                    )}
                                />
                            </div>
                            {errors.dropOffDate && (
                                <span className="invalid-feedback">
                                    {errors.dropOffDate.message}
                                </span>
                            )}
                        </div>

                        {/* Dropoff Time Flexible */}
                        <div className="form-group">
                            <label className="form-label">Is dropoff time flexible?</label>
                            <Controller
                                name="isDropOffTimeFlexible"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <input
                                            type="radio"
                                            id="isDropOffTimeFlexibleYes"
                                            {...field}
                                            value="true"
                                            checked={field.value === true}
                                            onChange={() => setValue("isDropOffTimeFlexible", true)}
                                            className="ms-2"
                                        />{" "}
                                        Yes
                                        <input
                                            type="radio"
                                            id="isDropOffTimeFlexibleNo"
                                            {...field}
                                            value="false"
                                            checked={field.value === false}
                                            onChange={() => setValue("isDropOffTimeFlexible", false)}
                                            className="ms-2"
                                        />{" "}
                                        No
                                    </>
                                )}
                            />
                            {errors.isDropOffTimeFlexible && (
                                <span className="invalid-feedback">
                                    {errors.isDropOffTimeFlexible.message}
                                </span>
                            )}
                        </div>

                        {/* Dropoff Fixed Time */}
                        {!isDropOffTimeFlexible && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="dropOffFixedTime">
                                    Dropoff Time
                                </label>
                                <input
                                    type="time"
                                    id="dropOffFixedTime"
                                    {...register("dropOffFixedTime")}
                                    className={`form-control ${errors.dropOffFixedTime ? "is-invalid" : ""}`}
                                />
                                {errors.dropOffFixedTime && (
                                    <span className="invalid-feedback">
                                        {errors.dropOffFixedTime.message}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between mt-4">
                <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-secondary"
                    disabled={isLoading}
                >
                    Previous
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    Continue
                </button>
            </div>
        </form>
    );
}

export default JobFormLocationStep;
