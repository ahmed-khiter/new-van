"use client";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/lib/contexts/CartContext";

import React from "react";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <CartProvider>
      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "17px",
          },
        }}
      />
      {children}
    </CartProvider>
  );
};

export default Providers;
