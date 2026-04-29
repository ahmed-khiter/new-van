import DatePicker from 'react-datepicker';
import { Controller } from 'react-hook-form';

function DropOffDetailForm({
    handleSubmit,
    handleKeyDown,
    errors,
    register,
    prevStep,
    isLoading,
    setValue,
    isDropOffTimeFlexible,
    control
}) {
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
            onKeyDown={handleKeyDown}
            className="space-y-3"
        >
            <div className="form-group">
                <label className="form-label" htmlFor="dropOffAddressLine1">
                    Drop Off Address Line 1
                </label>
                <input
                    type="text"
                    id="dropOffAddressLine1"
                    {...register("dropOffAddressLine1")}
                    className={`form-control ${errors.dropOffAddressLine1 ? "is-invalid" : ""
                        }`}
                />
                {errors.dropOffAddressLine1 && (
                    <span className="invalid-feedback">
                        {errors.dropOffAddressLine1.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="dropOffAddressLine2">
                    Drop Off Address Line 2 (optional)
                </label>
                <input
                    type="text"
                    id="dropOffAddressLine2"
                    {...register("dropOffAddressLine2")}
                    className={`form-control ${errors.dropOffAddressLine2 ? "is-invalid" : ""
                        }`}
                />
                {errors.dropOffAddressLine2 && (
                    <span className="invalid-feedback">
                        {errors.dropOffAddressLine2.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="dropOffCity">Drop Off City</label>
                <input
                    type="text"
                    id="dropOffCity"
                    {...register("dropOffCity")}
                    className={`form-control ${errors.dropOffCity ? "is-invalid" : ""
                        }`}
                />
                {errors.dropOffCity && (
                    <span className="invalid-feedback">
                        {errors.dropOffCity.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="dropOffPostCode">
                    Drop Off Postcode
                </label>
                <input
                    type="text"
                    id="dropOffPostCode"
                    {...register("dropOffPostCode")}
                    className={`form-control ${errors.dropOffPostCode ? "is-invalid" : ""
                        }`}
                />
                {errors.dropOffPostCode && (
                    <span className="invalid-feedback">
                        {errors.dropOffPostCode.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label block" htmlFor="dropOffDate">Drop Off Date</label>
                <Controller
                    name="dropOffDate"
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            {...field}
                            selected={field.value || null}
                            onChange={(date) => field.onChange(date)}
                            className={`form-control ${errors.dropOffDate ? "is-invalid" : ""
                                }`}
                            dateFormat="MMMM d, yyyy"
                            minDate={new Date()}
                            placeholderText="Select Drop Off Date"
                        />
                    )}
                />
                {errors.dropOffDate && (
                    <span className="invalid-feedback">
                        {errors.dropOffDate.message}
                    </span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label">Is drop off time flexible?</label>
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
                                onChange={() =>
                                    setValue("isDropOffTimeFlexible", true)
                                }
                                className="ms-2"
                            />{" "}
                            Yes
                            <input
                                type="radio"
                                id="isDropOffTimeFlexibleNo"
                                {...field}
                                value="false"
                                checked={field.value === false}
                                onChange={() =>
                                    setValue("isDropOffTimeFlexible", false)
                                }
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
            {!isDropOffTimeFlexible && (
                <div className="form-group">
                    <label className="form-label" htmlFor="dropOffFixedTime">Drop Off Time</label>
                    <input
                        type="time"
                        id="dropOffFixedTime"
                        {...register("dropOffFixedTime")}
                        className={`form-control ${errors.dropOffFixedTime ? "is-invalid" : ""
                            }`}
                    />
                    {errors.dropOffFixedTime && (
                        <span className="invalid-feedback">
                            {errors.dropOffFixedTime.message}
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

export default DropOffDetailForm