"use client";
import JobDetailView from "@/components/JobDetailView";

const VisitorJobDetails = ({ params }) => {
    const { id } = params;

    return (
        <JobDetailView 
            jobId={id} 
            showAcceptButton={false}
            showPaymentButton={true}
        />
    );
};

export default VisitorJobDetails;

