import React from "react";
import { Controller } from "react-hook-form";
import {
    howManyHoursOptions,
    howManyItemsOptions,
    howManyRoomsOptions,
    howManyBathroomsOptions,
    typeOfKeyOptions,
    typeOfLockOptions,
    typeOfPlaceOptions,
    vehicleData,
} from "@/utils/helper";

function JobFormFirstStep({
    nextStep,
    handleKeyDown,
    errors,
    register,
    control,
    isLoading,
    selectedCategory,
    setValue,
    watch
}) {
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                nextStep();
            }}
            onKeyDown={handleKeyDown}
            className="space-y-3"
        >
            { selectedCategory === "Click & Collect" && (
                <>
                    {/* Store Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="storeName">
                            Store Name
                        </label>
                        <input
                            type="text"
                            id="storeName"
                            {...register("storeName")}
                            className={`form-control ${errors.storeName ? "is-invalid" : ""}`}
                        />
                        {errors.storeName && (
                            <span className="invalid-feedback">
                                {errors.storeName.message}
                            </span>
                        )}
                    </div>

                    {/* Click & Collect ID Number */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="clickAndCollectIdNumber">
                            Click & Collect ID Number
                        </label>
                        <input
                            type="text"
                            id="clickAndCollectIdNumber"
                            {...register("clickAndCollectIdNumber")}
                            className={`form-control ${errors.clickAndCollectIdNumber ? "is-invalid" : ""
                                }`}
                        />
                        {errors.clickAndCollectIdNumber && (
                            <span className="invalid-feedback">
                                {errors.clickAndCollectIdNumber.message}
                            </span>
                        )}
                    </div>

                    {/* Your Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="yourName">
                            Your Name
                        </label>
                        <input
                            type="text"
                            id="yourName"
                            {...register("yourName")}
                            className={`form-control ${errors.yourName ? "is-invalid" : ""}`}
                        />
                        {errors.yourName && (
                            <span className="invalid-feedback">
                                {errors.yourName.message}
                            </span>
                        )}
                    </div>

                    {/* Contact Number */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="contactNumber">
                            Contact Number
                        </label>
                        <input
                            type="text"
                            id="contactNumber"
                            {...register("contactNumber")}
                            className={`form-control ${errors.contactNumber ? "is-invalid" : ""
                                }`}
                        />
                        {errors.contactNumber && (
                            <span className="invalid-feedback">
                                {errors.contactNumber.message}
                            </span>
                        )}
                    </div>
                </>
            )}
            <div className="form-group">
                <label className="form-label" htmlFor="distance">
                    Distance
                </label>
                <input
                    type="number"
                    id="distance"
                    {...register("distance")}
                    className={`form-control ${errors.distance ? "is-invalid" : ""}`}
                />
                {errors.distance && (
                    <span className="invalid-feedback">{errors.distance.message}</span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="price">
                    Price
                </label>
                <input
                    type="number"
                    id="price"
                    {...register("price")}
                    className={`form-control ${errors.price ? "is-invalid" : ""}`}
                />
                {errors.price && (
                    <span className="invalid-feedback">{errors.price.message}</span>
                )}
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="paymentTime">
                    Payment Time
                </label>
                <Controller
                    name="paymentTime"
                    control={control}
                    render={({ field }) => (
                        <select
                            {...field}
                            className={`form-control ${errors.paymentTime ? "is-invalid" : ""
                                }`}
                            id="paymentTime"
                        >
                            <option value="" hidden>
                                Select Payment Time
                            </option>
                            <option value="immediate">Immediate</option>
                            <option value="30 days">30 Days</option>
                            <option value="60 days">60 Days</option>
                        </select>
                    )}
                />

                {errors.paymentTime && (
                    <span className="invalid-feedback">{errors.paymentTime.message}</span>
                )}
            </div>
            {selectedCategory === "Van" ? (
                <>
                    {/* Van Size */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="vanSize">
                            Van Size
                        </label>
                        <Controller
                            name="vanSize"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.vanSize ? "is-invalid" : ""
                                        }`}
                                    id="vanSize"
                                >
                                    <option value="" hidden>
                                        Select Vehicle Type
                                    </option>
                                    <option value="bike">Bike</option>
                                    <option value="motorbike">Motorbike</option>
                                    <option value="car">Car</option>
                                    <option value="small_van">Small van</option>
                                    <option value="medium_van">Medium van</option>
                                    <option value="large_van">Large van</option>
                                    <option value="xl_van">XL van</option>
                                </select>
                            )}
                        />
                        {errors.vanSize && (
                            <span className="invalid-feedback">{errors.vanSize.message}</span>
                        )}
                    </div>

                    {/* Moving Item */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="movingItem">
                            What are you moving?
                        </label>
                        <input
                            type="text"
                            id="movingItem"
                            {...register("movingItem")}
                            className={`form-control ${errors.movingItem ? "is-invalid" : ""
                                }`}
                        />
                        {errors.movingItem && (
                            <span className="invalid-feedback">
                                {errors.movingItem.message}
                            </span>
                        )}
                    </div>

                    {/* Help Loading */}
                    <div className="form-group">
                        <label className="form-label">
                            Are you going to help in loading?
                        </label>
                        <Controller
                            name="isHelpLoading"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input
                                        type="radio"
                                        id="isHelpLoadingYes"
                                        {...field}
                                        value="true"
                                        checked={field.value === true}
                                        onChange={() => setValue("isHelpLoading", true)}
                                        className="ms-2"
                                    />{" "}
                                    Yes
                                    <input
                                        type="radio"
                                        id="isHelpLoadingNo"
                                        {...field}
                                        value="false"
                                        checked={field.value === false}
                                        onChange={() => setValue("isHelpLoading", false)}
                                        className="ms-2"
                                    />{" "}
                                    No
                                </>
                            )}
                        />
                        {errors.isHelpLoading && (
                            <span className="invalid-feedback">
                                {errors.isHelpLoading.message}
                            </span>
                        )}
                    </div>

                    {/* Two Men Required */}
                    <div className="form-group">
                        <label className="form-label">Are 2 men required?</label>
                        <Controller
                            name="isTwoMenRequired"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input
                                        type="radio"
                                        id="isTwoMenRequiredYes"
                                        {...field}
                                        value="true"
                                        checked={field.value === true}
                                        onChange={() => setValue("isTwoMenRequired", true)}
                                        className="ms-2"
                                    />{" "}
                                    Yes
                                    <input
                                        type="radio"
                                        id="isTwoMenRequiredNo"
                                        {...field}
                                        value="false"
                                        checked={field.value === false}
                                        onChange={() => setValue("isTwoMenRequired", false)}
                                        className="ms-2"
                                    />{" "}
                                    No
                                </>
                            )}
                        />
                        {errors.isTwoMenRequired && (
                            <span className="invalid-feedback">
                                {errors.isTwoMenRequired.message}
                            </span>
                        )}
                    </div>
                </>
            ) : selectedCategory === "Recovery" ? (
                <>
                    {/* Make */}
                <div className="form-group">
                <label className="form-label" htmlFor="make">
                    Vehicle Make
                </label>
                <select
                    id="make"
                    {...register("make")}
                    className={`form-control ${errors.make ? "is-invalid" : ""}`}
                >
                    <option value="">Select Vehicle Make</option>
                    {Object.keys(vehicleData).map((make) => (
                    <option key={make} value={make}>
                        {make}
                    </option>
                    ))}
                </select>
                {errors.make && (
                    <span className="invalid-feedback">{errors.make.message}</span>
                )}
                </div>

                {/* Model */}
                <div className="form-group">
                <label className="form-label" htmlFor="model">
                    Vehicle Model
                </label>
                <select
                    id="model"
                    {...register("model")}
                    className={`form-control ${errors.model ? "is-invalid" : ""}`}
                    disabled={!watch("make")} // disable if no make selected
                >
                    <option value="">Select Vehicle Model</option>
                    {watch("make") &&
                    vehicleData[watch("make")]?.map((model) => (
                        <option key={model} value={model}>
                        {model}
                        </option>
                    ))}
                </select>
                {errors.model && (
                    <span className="invalid-feedback">{errors.model.message}</span>
                )}
                </div>

                    {/* Year */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="year">
                            Vehicle Year
                        </label>
                        <input
                            type="text"
                            id="year"
                            {...register("year")}
                            className={`form-control ${errors.year ? "is-invalid" : ""}`}
                        />
                        {errors.year && (
                            <span className="invalid-feedback">{errors.year.message}</span>
                        )}
                    </div>

                    {/* Does Car Turn On */}
                    <div className="form-group">
                        <label className="form-label">Does the car turn on?</label>
                        <Controller
                            name="doesCarTurnOn"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input
                                        type="radio"
                                        id="doesCarTurnOnYes"
                                        {...field}
                                        value="true"
                                        checked={field.value === true}
                                        onChange={() => setValue("doesCarTurnOn", true)}
                                        className="ms-2"
                                    />{" "}
                                    Yes
                                    <input
                                        type="radio"
                                        id="doesCarTurnOnNo"
                                        {...field}
                                        value="false"
                                        checked={field.value === false}
                                        onChange={() => setValue("doesCarTurnOn", false)}
                                        className="ms-2"
                                    />{" "}
                                    No
                                </>
                            )}
                        />
                        {errors.doesCarTurnOn && (
                            <span className="invalid-feedback">
                                {errors.doesCarTurnOn.message}
                            </span>
                        )}
                    </div>
                </>
            ) : selectedCategory === "Removals" ? (
                <>
                    {/* How Many Items */}
                    <div className="form-group">
                        <label className="form-label block" htmlFor="howManyItems">
                            How Many Items
                        </label>
                        <Controller
                            name="howManyItems"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.howManyItems ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="" hidden>
                                        Select
                                    </option>
                                    {howManyItemsOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.howManyItems && (
                            <span className="invalid-feedback">
                                {errors.howManyItems.message}
                            </span>
                        )}
                    </div>
                </>
            ) : selectedCategory === "Locksmith" ? (
                <>
                    <div className="form-group">
                        <label className="form-label block" htmlFor="typeOfKey">
                            Type Of Key
                        </label>
                        <Controller
                            name="typeOfKey"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.typeOfKey ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="" hidden>
                                        Select
                                    </option>
                                    {typeOfKeyOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.typeOfKey && (
                            <span className="invalid-feedback">
                                {errors.typeOfKey.message}
                            </span>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label block" htmlFor="typeOfLock">
                            Type Of Lock
                        </label>
                        <Controller
                            name="typeOfLock"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.typeOfLock ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="" hidden>
                                        Select
                                    </option>
                                    {typeOfLockOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.typeOfLock && (
                            <span className="invalid-feedback">
                                {errors.typeOfLock.message}
                            </span>
                        )}
                    </div>
                </>
            ) : selectedCategory === "Cleaning" ? (
                <>
                    {/* How many Bedrooms */}
                    <div className="form-group">
                        <label className="form-label block" htmlFor="howManyRooms">
                            How many Bedrooms
                        </label>
                        <Controller
                            name="howManyRooms"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.howManyRooms ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="" hidden>
                                        Select
                                    </option>
                                    {howManyRoomsOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.howManyRooms && (
                            <span className="invalid-feedback">
                                {errors.howManyRooms.message}
                            </span>
                        )}
                    </div>

                    {/* How many Bathrooms */}
                    <div className="form-group">
                        <label className="form-label block" htmlFor="howManyBathrooms">
                            How many Bathrooms
                        </label>
                        <Controller
                            name="howManyBathrooms"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.howManyBathrooms ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="" hidden>
                                        Select
                                    </option>
                                    {howManyBathroomsOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.howManyBathrooms && (
                            <span className="invalid-feedback">
                                {errors.howManyBathrooms.message}
                            </span>
                        )}
                    </div>

                    {/* How Many Hours */}
                    <div className="form-group">
                        <label className="form-label block" htmlFor="howManyHours">
                            How Many Hours
                        </label>
                        <Controller
                            name="howManyHours"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.howManyHours ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="" hidden>
                                        Select
                                    </option>
                                    {howManyHoursOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.howManyHours && (
                            <span className="invalid-feedback">
                                {errors.howManyHours.message}
                            </span>
                        )}
                    </div>

                    {/* Type Of Property */}
                    <div className="form-group">
                        <label className="form-label block" htmlFor="typeOfPlace">
                            Type Of Property
                        </label>
                        <Controller
                            name="typeOfPlace"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-control ${errors.typeOfPlace ? "is-invalid" : ""
                                        }`}
                                >
                                    <option value="" hidden>
                                        Select
                                    </option>
                                    {typeOfPlaceOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.typeOfPlace && (
                            <span className="invalid-feedback">
                                {errors.typeOfPlace.message}
                            </span>
                        )}
                    </div>

                    {/* Has Cleaning Products */}
                    <div className="form-group">
                        <label className="form-label">Do you have cleaning products?</label>
                        <Controller
                            name="hasCleaningProducts"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input
                                        type="radio"
                                        id="hasCleaningProductsYes"
                                        {...field}
                                        value="true"
                                        checked={field.value === true}
                                        onChange={() => setValue("hasCleaningProducts", true)}
                                        className="ms-2"
                                    />{" "}
                                    Yes
                                    <input
                                        type="radio"
                                        id="hasCleaningProductsNo"
                                        {...field}
                                        value="false"
                                        checked={field.value === false}
                                        onChange={() => setValue("hasCleaningProducts", false)}
                                        className="ms-2"
                                    />{" "}
                                    No
                                </>
                            )}
                        />
                        {errors.hasCleaningProducts && (
                            <span className="invalid-feedback">
                                {errors.hasCleaningProducts.message}
                            </span>
                        )}
                    </div>
                </>
            ) : selectedCategory === "Car Key Replacement" ? (
                <>
                    {/* Make */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="make">
                            Vehicle Make
                        </label>
                        <input
                            type="text"
                            id="make"
                            {...register("make")}
                            className={`form-control ${errors.make ? "is-invalid" : ""}`}
                        />
                        {errors.make && (
                            <span className="invalid-feedback">{errors.make.message}</span>
                        )}
                    </div>

                    {/* Model */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="model">
                            Vehicle Model
                        </label>
                        <input
                            type="text"
                            id="model"
                            {...register("model")}
                            className={`form-control ${errors.model ? "is-invalid" : ""}`}
                        />
                        {errors.model && (
                            <span className="invalid-feedback">{errors.model.message}</span>
                        )}
                    </div>

                    {/* Year */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="year">
                            Vehicle Year
                        </label>
                        <input
                            type="text"
                            id="year"
                            {...register("year")}
                            className={`form-control ${errors.year ? "is-invalid" : ""}`}
                        />
                        {errors.year && (
                            <span className="invalid-feedback">{errors.year.message}</span>
                        )}
                    </div>

                    {/* Has Log Book */}
                    <div className="form-group">
                        <label className="form-label">Do you need urgent assistance?</label>
                        <Controller
                            name="hasLogBook"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input
                                        type="radio"
                                        id="hasLogBookYes"
                                        {...field}
                                        value="true"
                                        checked={field.value === true}
                                        onChange={() => setValue("hasLogBook", true)}
                                        className="ms-2"
                                    />{" "}
                                    Yes
                                    <input
                                        type="radio"
                                        id="hasLogBookNo"
                                        {...field}
                                        value="false"
                                        checked={field.value === false}
                                        onChange={() => setValue("hasLogBook", false)}
                                        className="ms-2"
                                    />{" "}
                                    No
                                </>
                            )}
                        />
                        {errors.hasLogBook && (
                            <span className="invalid-feedback">
                                {errors.hasLogBook.message}
                            </span>
                        )}
                    </div>

                    {/* Has Car Key */}
                    <div className="form-group">
                        <label className="form-label">Do you have the car key?</label>
                        <Controller
                            name="hasCarKey"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input
                                        type="radio"
                                        id="hasCarKeyYes"
                                        {...field}
                                        value="true"
                                        checked={field.value === true}
                                        onChange={() => setValue("hasCarKey", true)}
                                        className="ms-2"
                                    />{" "}
                                    Yes
                                    <input
                                        type="radio"
                                        id="hasCarKeyNo"
                                        {...field}
                                        value="false"
                                        checked={field.value === false}
                                        onChange={() => setValue("hasCarKey", false)}
                                        className="ms-2"
                                    />{" "}
                                    No
                                </>
                            )}
                        />
                        {errors.hasCarKey && (
                            <span className="invalid-feedback">
                                {errors.hasCarKey.message}
                            </span>
                        )}
                    </div>
                </>
            ) : null}

            <div className="form-group">
                <label className="form-label" htmlFor="notes">
                    Notes
                </label>
                <textarea
                    type="text"
                    id="notes"
                    {...register("notes")}
                    className={`form-control ${errors.notes ? "is-invalid" : ""}`}
                />
                {errors.notes && (
                    <span className="invalid-feedback">{errors.notes.message}</span>
                )}
            </div>
            <button
                type="submit"
                className="btn btn-primary !mt-[24px]"
                disabled={isLoading}
            >
                Continue
            </button>
        </form>
    );
}

export default JobFormFirstStep;
