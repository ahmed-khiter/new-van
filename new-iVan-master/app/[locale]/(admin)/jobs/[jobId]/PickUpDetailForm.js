import DatePicker from 'react-datepicker';
import { Controller } from 'react-hook-form';

function PickUpDetailForm({
    nextStep,
    handleKeyDown,
    errors,
    register,
    prevStep,
    isLoading,
    setValue,
    isPickupTimeFlexible,
    control , selectedCategory
}) {
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); console.log("clicked"); nextStep(); }}
            onKeyDown={handleKeyDown}
            className="space-y-3">
            <div className="form-group">
                <label className="form-label" htmlFor="pickupAddressLine1">
                    Pick Up Address Line 1
                </label>
                <input
                    type="text"
                    id="pickupAddressLine1"
                    {...register("pickupAddressLine1")}
                    className={`form-control ${errors.pickupAddressLine1 ? "is-invalid" : ""
                        }`}
                />
                {errors.pickupAddressLine1 && (
                    <span className="invalid-feedback">
                        {errors.pickupAddressLine1.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="pickupAddressLine2">
                    Pick Up Address Line 2 (optional)
                </label>
                <input
                    type="text"
                    id="pickupAddressLine2"
                    {...register("pickupAddressLine2")}
                    className={`form-control ${errors.pickupAddressLine2 ? "is-invalid" : ""
                        }`}
                />
                {errors.pickupAddressLine2 && (
                    <span className="invalid-feedback">
                        {errors.pickupAddressLine2.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="pickupCity">Pick Up City</label>
                <input
                    type="text"
                    id="pickupCity"
                    {...register("pickupCity")}
                    className={`form-control ${errors.pickupCity ? "is-invalid" : ""
                        }`}
                />
                {errors.pickupCity && (
                    <span className="invalid-feedback">
                        {errors.pickupCity.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="pickupPostCode">
                    Pick Up Postcode
                </label>
                <input
                    type="text"
                    id="pickupPostCode"
                    {...register("pickupPostCode")}
                    className={`form-control ${errors.pickupPostCode ? "is-invalid" : ""
                        }`}
                />
                {errors.pickupPostCode && (
                    <span className="invalid-feedback">
                        {errors.pickupPostCode.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label block" htmlFor="pickupDate">
                    {(() => {
                        if (selectedCategory === "Cleaning") {
                            return "What date would you like the cleaner?";
                        }
                        // Categories that keep "Pickup Date" terminology: Van (Couriers), Recovery, Removals (Rubbish), Click & Collect
                        const keepPickupDateCategories = ["Van", "Recovery", "Removals", "Click & Collect"];
                        return keepPickupDateCategories.includes(selectedCategory) ? "Pick Up Date" : "Job Date";
                    })()}
                </label>
                <Controller
                    name="pickupDate"
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            {...field}
                            selected={field.value || null}
                            onChange={(date) => field.onChange(date)}
                            className={`form-control ${errors.pickupDate ? "is-invalid" : ""
                                }`}
                            dateFormat="MMMM d, yyyy"
                            minDate={new Date()}
                            placeholderText={(() => {
                                if (selectedCategory === "Cleaning") {
                                    return "Select Cleaning Date";
                                }
                                const keepPickupDateCategories = ["Van", "Recovery", "Removals", "Click & Collect"];
                                return keepPickupDateCategories.includes(selectedCategory) ? "Select Pick Up Date" : "Select Job Date";
                            })()}
                        />
                    )}
                />
                {errors.pickupDate && (
                    <span className="invalid-feedback">
                        {errors.pickupDate.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label">Is pick up time flexible?</label>
                <Controller
                    name="isPickupTimeFlexible"
                    control={control}
                    render={({ field }) => (
                        <>
                            <input
                                type="radio"
                                id="isPickupTimeFlexibleYes"
                                {...field}
                                value="true"
                                checked={field.value === true}
                                onChange={() =>
                                    setValue("isPickupTimeFlexible", true)
                                }
                                className="ms-2"
                            />{" "}
                            Yes
                            <input
                                type="radio"
                                id="isPickupTimeFlexibleNo"
                                {...field}
                                value="false"
                                checked={field.value === false}
                                onChange={() =>
                                    setValue("isPickupTimeFlexible", false)
                                }
                                className="ms-2"
                            />{" "}
                            No
                        </>
                    )}
                />
                {errors.isPickupTimeFlexible && (
                    <span className="invalid-feedback">
                        {errors.isPickupTimeFlexible.message}
                    </span>
                )}
            </div>
            {!isPickupTimeFlexible && (
                <div className="form-group">
                    <label className="form-label" htmlFor="pickupFixedTime">Pick Up Time</label>
                    <input
                        type="time"
                        id="pickupFixedTime"
                        {...register("pickupFixedTime")}
                        className={`form-control ${errors.pickupFixedTime ? "is-invalid" : ""
                            }`}
                    />
                    {errors.pickupFixedTime && (
                        <span className="invalid-feedback">
                            {errors.pickupFixedTime.message}
                        </span>
                    )}
                </div>
            )}
            <div className="button-group !mt-[24px]">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={prevStep}
                    disabled={isLoading}
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="btn btn-primary ms-3"
                    disabled={isLoading}
                >
                    Continue
                </button>
            </div>
        </form>
    )
}

export default PickUpDetailForm