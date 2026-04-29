"use client";
import React, { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";

const schema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: yup
    .string()
    .nullable()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
  role: yup
    .string()
    .required("Role is required")
    .oneOf(["admin", "team-member"], "Please select a valid role")
});

export default function TeamMemberDetailModal({
  show,
  onHide,
  mode, // "add" or "edit"
  member, // member data for edit mode
  onSuccess // callback when operation is successful
}) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange"
  });

  // Reset form when modal opens/closes or member changes
  useEffect(() => {
    if (show) {
      if (mode === "edit" && member) {
        setValue("firstName", member.firstName || "");
        setValue("lastName", member.lastName || "");
        setValue("email", member.email || "");
        setValue("role", member.role || "team-member");
      } else {
        reset({
          firstName: "",
          lastName: "",
          email: "",
          role: "team-member"
        });
      }
    }
  }, [show, mode, member, setValue, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let response;
      
      if (mode === "add") {
        // Add new team member
        response = await fetch("/api/team-members", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } else {
        // Update existing team member
        response = await fetch(`/api/team-members/${member.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} team member`);
      }

      const result = await response.json();
      toast.success(result.message || `Member ${mode === 'add' ? 'added' : 'updated'} successfully`);
      
      // Call success callback with the result
      if (onSuccess) {
        onSuccess(result, mode);
      }
      
      onHide();
    } catch (error) {
      toast.error(error.message);
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} team member:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="md">
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === "add" ? "Add Member" : "Edit Member"}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>First Name *</Form.Label>
            <Form.Control
              type="text"
              {...register("firstName")}
              isInvalid={!!errors.firstName}
              placeholder="Enter first name"
            />
            <Form.Control.Feedback type="invalid">
              {errors.firstName?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              {...register("lastName")}
              isInvalid={!!errors.lastName}
              placeholder="Enter last name (optional)"
            />
            <Form.Control.Feedback type="invalid">
              {errors.lastName?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email *</Form.Label>
            <Form.Control
              type="email"
              {...register("email")}
              isInvalid={!!errors.email}
              placeholder="Enter email address"
            />
            <Form.Control.Feedback type="invalid">
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Role *</Form.Label>
            <Form.Select
              {...register("role")}
              isInvalid={!!errors.role}
            >
              <option value="team-member">Team Member</option>
              <option value="admin">Admin</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.role?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || !isValid}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {mode === "add" ? "Adding..." : "Updating..."}
              </>
            ) : (
              mode === "add" ? "Add Member" : "Update Member"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
