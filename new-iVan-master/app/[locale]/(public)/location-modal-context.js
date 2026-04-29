"use client";

import { createContext, useContext } from "react";

export const LocationModalContext = createContext({
  open: () => {},
  registerOpener: () => {},
});

export const useLocationModal = () => useContext(LocationModalContext);
