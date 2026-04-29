"use client";
import JobForm from "@/components/JobForm";

export default function VisitorEditJobPage({ params }) {
    const { id } = params;
    
    return (
        <JobForm 
            jobId={id}
            userRole="visitor"
            redirectPath="/customer/jobs"
            showCategorySelector={true}
        />
    );
}

