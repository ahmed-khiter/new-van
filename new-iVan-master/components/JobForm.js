"use client";
import { jobCategories } from "@/utils/helper";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import { getFullDateFromTime } from "@/utils/helper";
import JobFormLocationStep from "./JobForm/JobFormLocationStep";
import JobFormDetailsStep from "./JobForm/JobFormDetailsStep";

const JobForm = ({ 
  jobId = "create", 
  userRole = "admin", 
  redirectPath = "/jobs",
  showCategorySelector = true 
}) => {
  const router = useRouter();
  const isUpdating = jobId !== "create";
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const ValidationSchema = useMemo(
    () =>
      yup.object().shape({
        category: yup.string().required("Category is required"),
        distance: yup.number().min(0),
        price: yup.number().min(0),
        paymentTime: yup.string().required("Payment Time is required"),

        vanSize: yup.string().when("category", {
          is: "Van",
          then: (schema) =>
            schema.required("Van size is required"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => {
              if (o === "" || o === null || o === undefined) return null;
              return v;
            }),
        }),

        movingItem: yup.string().when("category", {
          is: "Van",
          then: (schema) =>
            schema.required("Moving item is required"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => {
              if (o === "" || o === null || o === undefined) return null;
              return v;
            }),
        }),

        isHelpLoading: yup.boolean(),
        isTwoMenRequired: yup.boolean(),
        make: yup.string().when("category", {
          is: (val) => val === "Recovery" || val === "Car Key Replacement",
          then: (schema) => schema.required("Car make is required"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => {
              if (o === "" || o === null || o === undefined) return null;
              return v;
            }),
        }),

        model: yup.string().when("category", {
          is: (val) => val === "Recovery" || val === "Car Key Replacement",
          then: (schema) => schema.required("Car model is required"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => {
              if (o === "" || o === null || o === undefined) return null;
              return v;
            }),
        }),

        year: yup.number().when("category", {
          is: (val) => val === "Recovery" || val === "Car Key Replacement",
          then: (schema) =>
            schema
              .required("Car year is required")
              .typeError("Year must be a number")
              .integer("Year must be an integer")
              .min(1900, "Year must be after 1900")
              .max(new Date().getFullYear(), "Year cannot be in the future"),
          otherwise: (schema) =>
            schema
              .nullable(true)
              .transform((v, o) => {
                if (o === "" || o === null || o === undefined) return null;
                return v;
              })
              .typeError("Year must be a number")
              .integer("Year must be an integer")
              .min(1900, "Year must be after 1900")
              .max(new Date().getFullYear(), "Year cannot be in the future"),
        }),
        howManyRooms: yup.number().when("category", {
          is: "Cleaning",
          then: (schema) =>
            schema
              .required("Number of rooms is required")
              .typeError("Rooms must be a number")
              .integer("Rooms must be an integer")
              .min(1, "At least 1 room is required"),
          otherwise: (schema) =>
            schema
              .nullable(true)
              .transform((v, o) => {
                if (o === "" || o === null || o === undefined) return null;
                return v;
              }),
        }),

        howManyBathrooms: yup.number().when("category", {
          is: "Cleaning",
          then: (schema) =>
            schema
              .required("Number of bathrooms is required")
              .typeError("Bathrooms must be a number")
              .integer("Bathrooms must be an integer")
              .min(1, "At least 1 bathroom is required"),
          otherwise: (schema) =>
            schema
              .nullable(true)
              .transform((v, o) => {
                if (o === "" || o === null || o === undefined) return null;
                return v;
              }),
        }),

        howManyHours: yup.number().when("category", {
          is: "Cleaning",
          then: (schema) =>
            schema
              .required("Number of hours is required")
              .typeError("Hours must be a number")
              .integer("Hours must be an integer")
              .min(1, "At least 1 hour is required"),
          otherwise: (schema) =>
            schema
              .nullable(true)
              .transform((v, o) => {
                if (o === "" || o === null || o === undefined) return null;
                return v;
              }),
        }),

        typeOfPlace: yup.string().when("category", {
          is: "Cleaning",
          then: (schema) => schema.required("Type of place is required"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),

        typeOfKey: yup.string().when("category", {
          is: "Locksmith",
          then: (schema) =>
            schema.required("Type of key is required"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),

        typeOfLock: yup.string().when("category", {
          is: "Locksmith",
          then: (schema) =>
            schema.required("Type of lock is required"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),

        howManyItems: yup.number().when("category", {
          is: "Removals",
          then: (schema) =>
            schema
              .required("Number of items is required")
              .typeError("Number of items must be a valid number")
              .min(1, "Must be at least 1 item"),
          otherwise: (schema) =>
            schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),
        doesCarTurnOn: yup.boolean(),
        hasLogBook: yup.boolean(),
        hasCarKey: yup.boolean(),
        hasCleaningProducts: yup.boolean(),
        storeName: yup.string().when("category", {
          is: "Click & Collect",
          then: (schema) => schema.required("Store Name is required"),
          otherwise: (schema) => schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),
        clickAndCollectIdNumber: yup.string().when("category", {
          is: "Click & Collect",
          then: (schema) => schema.required("Click & Collect ID Number is required"),
          otherwise: (schema) => schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),
        yourName: yup.string().when("category", {
          is: "Click & Collect",
          then: (schema) => schema.required("Your Name is required"),
          otherwise: (schema) => schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),
        contactNumber: yup.string().when("category", {
          is: "Click & Collect",
          then: (schema) =>
            schema
              .required("Contact Number is required")
              .matches(/^[0-9+\-()\s]+$/, "Invalid contact number"),
          otherwise: (schema) => schema.nullable(true).transform((v, o) => (o === "" ? null : v)),
        }),
        notes: yup
          .string()
          .nullable(true)
          .transform((v, o) => (o === "" ? null : v)),
        pickupAddressLine1: yup
          .string()
          .required("Pickup Address Line 1 is required"),
        pickupAddressLine2: yup
          .string()
          .nullable(true)
          .transform((v, o) => (o === "" ? null : v)),

        pickupCity: yup.string().required("Pickup City is required"),
        pickupPostCode: yup.string(),
        pickupDate: yup.date().required("Pickup Date is required"),
        isPickupTimeFlexible: yup.boolean(),
        pickupFixedTime: yup.string().when("isPickupTimeFlexible", {
          is: (value) => value === false,
          then: (schema) => schema.required("Pickup Time is required"),
          otherwise: (schema) => schema.optional(),
        }),
        requireUrgent: yup.boolean(),
        dropOffAddressLine1: yup.string().when("category", {
          is: (cat) => ["Van", "Recovery", "Click & Collect"].includes(cat),
          then: (schema) => schema.required("Dropoff Address Line 1 is required"),
          otherwise: (schema) => schema.nullable().optional(),
        }),
        dropOffAddressLine2: yup
          .string()
          .nullable(true)
          .transform((v, o) => (o === "" ? null : v)),

        dropOffCity: yup.string().when("category", {
          is: (cat) => ["Van", "Recovery", "Click & Collect"].includes(cat),
          then: (schema) => schema.required("Dropoff City is required"),
          otherwise: (schema) => schema.nullable().optional(),
        }),
        dropOffPostCode: yup.string().when("category", {
          is: (cat) => ["Van", "Recovery", "Click & Collect"].includes(cat),
          then: (schema) => schema.nullable().optional(),
          otherwise: (schema) => schema.nullable().optional(),
        }),
        dropOffDate: yup.date().when("category", {
          is: (cat) => ["Van", "Recovery", "Click & Collect"].includes(cat),
          then: (schema) => schema.required("Dropoff Date is required"),
          otherwise: (schema) => schema.nullable().optional(),
        }),
        isDropOffTimeFlexible: yup.boolean(),
        dropOffFixedTime: yup.string().when(["isDropOffTimeFlexible", "category"], {
          is: (flexible, cat) => flexible === false && ["Van", "Recovery", "Click & Collect"].includes(cat),
          then: (schema) => schema.required("Dropoff Time is required"),
          otherwise: (schema) => schema.nullable().optional(),
        }),
      }),
    [selectedCategory]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    trigger,
    watch,
    formState: { errors },
    getValues
  } = useForm({
    resolver: yupResolver(ValidationSchema),
    mode: "onChange",
    defaultValues: {
      isHelpLoading: false,
      isTwoMenRequired: false,
      isPickupTimeFlexible: false,
      isDropOffTimeFlexible: false,
      hasCarKey: false,
      hasLogBook: false,
      doesCarTurnOn: false,
      hasCleaningProducts: false,
      requireUrgent: false
    },
  });

  const isPickupTimeFlexible = watch("isPickupTimeFlexible");
  const isDropOffTimeFlexible = watch("isDropOffTimeFlexible");

  useEffect(() => {
    const fetchJob = async () => {
      setIsFetchingDetails(true)
      try {
        if (isUpdating) {
          const data = await fetch(`/api/jobs/${jobId}`);
          const { job } = await data.json();
          console.log("job details", job);
          setSelectedCategory(job?.category)
          reset({
            ...job,
            category: job?.category, // Ensure category is explicitly set
            pickupFixedTime: job.pickupFixedTime
              ? new Date(job.pickupFixedTime).toISOString().slice(11, 16)
              : "",
            pickupDate: job.pickupDate ?
              new Date(job.pickupDate) : null,
            dropOffFixedTime: job.dropOffFixedTime
              ? new Date(job.dropOffFixedTime).toISOString().slice(11, 16)
              : "",
            dropOffDate: job.dropOffDate ?
              new Date(job.dropOffDate) : null
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsFetchingDetails(false)
      }
    };

    fetchJob();
  }, [isUpdating, jobId, reset]);

  // Ensure category field is always in sync with selectedCategory
  useEffect(() => {
    if (selectedCategory) {
      setValue("category", selectedCategory);
    }
  }, [selectedCategory, setValue]);

  const handleJobSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Ensure price and distance are included in the payload
      const payload = {
        ...data,
        dropOffFixedTime: getFullDateFromTime(data?.dropOffDate, data?.dropOffFixedTime),
        pickupFixedTime: getFullDateFromTime(data?.pickupDate, data?.pickupFixedTime),
        // Ensure price and distance are explicitly included
        price: data.price || 0,
        distance: data.distance || 0,
      };
      
      console.log('Job submission payload:', payload);
      
      const response = await fetch(
        `/api/jobs${isUpdating ? `/${jobId}` : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        const responseData = await response.json();
        
        // Check if payment is required (for visitors)
        if (responseData.requiresPayment && responseData.paymentUrl) {
          toast.success("Job created! Redirecting to payment...");
          // Redirect to Stripe payment
          window.location.href = responseData.paymentUrl;
        } else {
          toast.success(
            `${selectedCategory} job ${isUpdating ? "updated" : "created"} successfully`
          );
          reset();
          setIsLoading(false);
          router.push(redirectPath);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData?.error || "Something went wrong!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const nextStep = async () => {

    // Define base step fields
    const baseStepFields = {
      1: [
        "pickupAddressLine1", "pickupCity", "pickupPostCode",
        "pickupDate", "isPickupTimeFlexible", "pickupFixedTime",
      ],
      2: [
        "paymentTime", "vanSize", "movingItem",
        "isHelpLoading", "isTwoMenRequired", "notes", "make", "model", "year",
        "doesCarTurnOn", "hasLogBook", "hasCarKey", "howManyRooms", "howManyHours",
        "typeOfPlace", "hasCleaningProducts", "typeOfKey", "typeOfLock", "howManyItems",
        "storeName", "clickAndCollectIdNumber", "yourName", "contactNumber"
      ],
    };

    // Add dropoff fields only for categories that require them
    const categoriesRequiringDropoff = ["Van", "Recovery", "Click & Collect"];
    if (categoriesRequiringDropoff.includes(selectedCategory)) {
      baseStepFields[1].push(
        "dropOffAddressLine1", "dropOffCity", "dropOffPostCode",
        "dropOffDate", "isDropOffTimeFlexible", "dropOffFixedTime"
      );
    }

    const isValid = await trigger(baseStepFields[currentStep]);
    if (!isValid) return;

    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      handleSubmit(handleJobSubmit)();
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  return (
    <>
      <div className="pagetitle">
        <h1>Jobs</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href={redirectPath}>Home</Link>
            </li>
            <li className="breadcrumb-item">Jobs</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="card">
          <div className="card-body mt-4">
            {isFetchingDetails ? (
              <div className="d-flex align-items-center justify-content-center p-2">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {showCategorySelector && (
                  <div className="col-md-4 col-sm-12 mb-3">
                    <div className="d-flex align-items-center">
                      <label className="form-label" htmlFor="category">
                        Select Category
                      </label>
                    </div>
                    <select
                      id="category"
                      {...register("category")}
                      className={`form-control ${errors.category ? "is-invalid" : ""}`}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setValue("category", e.target.value); // Update form field
                        setCurrentStep(1);
                        reset();
                      }}
                    >
                      <option value="" hidden>Select Job Category</option>
                      {jobCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <span className="invalid-feedback">
                        {errors.category.message}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {selectedCategory && (
              <>
                <div className="px-[15px]">
                  {currentStep === 1 && (
                    <JobFormLocationStep
                      nextStep={nextStep}
                      handleKeyDown={handleKeyDown}
                      errors={errors}
                      register={register}
                      prevStep={prevStep}
                      isLoading={isLoading}
                      setValue={setValue}
                      isPickupTimeFlexible={isPickupTimeFlexible}
                      isDropOffTimeFlexible={isDropOffTimeFlexible}
                      control={control}
                      selectedCategory={selectedCategory}
                      watch={watch}
                    />
                  )}

                  {currentStep === 2 && (
                    <JobFormDetailsStep
                      handleSubmit={handleSubmit(handleJobSubmit)}
                      handleKeyDown={handleKeyDown}
                      errors={errors}
                      register={register}
                      control={control}
                      isLoading={isLoading}
                      selectedCategory={selectedCategory}
                      setValue={setValue}
                      watch={watch}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default JobForm;
