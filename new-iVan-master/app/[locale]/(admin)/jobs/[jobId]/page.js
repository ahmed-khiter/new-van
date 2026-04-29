"use client";
import JobForm from "@/components/JobForm";
const Job = ({ params }) => {
  const { jobId } = params;
  
  return (
    <JobForm 
      jobId={jobId}
      userRole="admin"
      redirectPath="/jobs"
      showCategorySelector={true}
    />
  );
};

export default Job;