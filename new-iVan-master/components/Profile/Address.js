"use client";
import { AppContext } from "@/lib/contexts/context";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";

const schema = yup.object().shape({
    address1: yup
        .string()
        .required("Address 1 is required")
        .min(3, "Address 1 must be at least 3 characters"),
    address2: yup.string().nullable(), // optional
    city: yup
        .string()
        .required("City is required")
        .min(2, "City must be at least 2 characters"),
    postCode: yup
        .string()
        .required("Post Code is required")
        .min(3, "Post Code must be at least 3 characters"),
});

const ProviderAddress = ({ userData }) => {
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
    } = useForm({
        resolver: yupResolver(schema),
        mode: "onChange",
    });


    useEffect(() => {
        reset({
            address1: userData?.address1 || "",
            address2: userData?.address2 || "",
            city: userData?.city || "",
            postCode: userData?.postCode || "",
        });
    }, [reset, userData]);


    const onSubmit = async (data) => {
        setIsLoadingUpdate(true);

        try {
            const formData = new FormData();
            formData.append("address1", data.address1);
            formData.append("address2", data.address2);
            formData.append("city", data.city);
            formData.append("postCode", data.postCode);

            const response = await fetch("/api/profile", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.errors?.length > 0) {
                    errorData.errors.forEach((error) =>
                        toast.error(`${error.field || ""} ${error.message || ""}`)
                    );
                } else {
                    toast.error("Failed to update address");
                }
                return;
            }
            router.back()
            toast.success("Address book updated successfully!");
            reset(data);
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error(error.message || "Failed to update address");
        } finally {
            setIsLoadingUpdate(false);
        }
    };


    return (
        <>
            <div className="row">
                <div className="col-sm-12 col-md-6">
                    <div className="card p-4 mb-0">
                        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">

                            <div className="mb-3">
                                <label htmlFor="address1" className="form-label">
                                    Address 1
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.address1 ? "is-invalid" : ""
                                        }`}
                                    id="address1"
                                    placeholder="Address Line 1"
                                    {...register("address1")}
                                />
                                {errors.address1 && (
                                    <div className="invalid-feedback">
                                        {errors.address1.message}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="address2" className="form-label">
                                    Address 2 (optional)
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.address2 ? "is-invalid" : ""
                                        }`}
                                    id="address2"
                                    placeholder="Address Line 2"
                                    {...register("address2")}
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="city" className="form-label">
                                    City
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.city ? "is-invalid" : ""
                                        }`}
                                    id="city"
                                    placeholder="City"
                                    {...register("city")}
                                />
                                {errors.city && (
                                    <div className="invalid-feedback">
                                        {errors.city.message}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="postCode" className="form-label">
                                    Post Code
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.postCode ? "is-invalid" : ""
                                        }`}
                                    id="postCode"
                                    placeholder="Post Code"
                                    {...register("postCode")}
                                />
                                {errors.postCode && (
                                    <div className="invalid-feedback">
                                        {errors.postCode.message}
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn btn-primary"
                                type="submit"
                                disabled={isLoadingUpdate || !isValid}
                            >
                                {isLoadingUpdate ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        Saving...
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProviderAddress;
