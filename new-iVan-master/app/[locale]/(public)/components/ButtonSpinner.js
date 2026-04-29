"use client";

const ButtonSpinner = ({ 
  isLoading = false, 
  loadingText = "Loading...", 
  children, 
  className = "",
  size = "sm",
  ...props 
}) => {
  
  return (
    <button 
      className={className}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        {loadingText}
      </div>
      ) : (
        children
      )}
    </button>
  );
};

export default ButtonSpinner;
