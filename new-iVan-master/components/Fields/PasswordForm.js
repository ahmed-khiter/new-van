"use client";
import React, { useState } from 'react';

function PasswordForm({ name, label, placeholder, icon, getFieldValues, fieldErrors }) {
    const [showPassword, setShowPassword] = useState(false);
    const toggleIconVisible = () => {
        setShowPassword(!showPassword);
    };

    return (
        <>
            {label && <label className="form-label" htmlFor={name}>{label}</label>}
            <input
                className={`form-control ${fieldErrors?.[name] ? "is-invalid" : ""}`}
                type={showPassword ? "text" : "password"}
                name={name}
                placeholder={placeholder || ''}
                {...getFieldValues(name)}
            />
            {icon && (
                <i className={`bi ${icon}${showPassword ? "" : '-slash'}`} onClick={toggleIconVisible}></i>
            )}
            {fieldErrors?.[name] && (
                <div className="invalid-feedback">
                    {fieldErrors?.[name].message}
                </div>
            )}
        </>
    );
}

export default PasswordForm;
