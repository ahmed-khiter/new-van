"use client";
import JobDetailView from "@/components/JobDetailView";

const JobDetails = ({ params }) => {
    const { id } = params;

    return (
        <JobDetailView 
            jobId={id} 
            showAcceptButton={true}
        />
    );
};

export default JobDetails;

