import React from "react";

const LoadingOverlay = () => {
  return (
    <div className="overlay h-100 w-100 d-flex justify-content-center align-items-center">
      <div className="spinner-border " role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
