"use client";
import JobDetailView from "@/components/JobDetailView";

const AdminJobView = ({ params }) => {
    const { id } = params;

    return (
        <JobDetailView 
            jobId={id} 
            showAcceptButton={false}
        />
    );
};

export default AdminJobView;
