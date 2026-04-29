"use client";
import { FaCar, FaGamepad, FaMusic, FaUsers } from 'react-icons/fa';
import { FiGift } from 'react-icons/fi';
import { GiKnifeFork, GiScissors } from 'react-icons/gi';
import { MdLocalBar, MdLocalHospital, MdSpa } from "react-icons/md";

export const ServiceIcon = ({ type, className }) => {
  const cls = className || "absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]";
  switch (type) {
    case 'restaurant':
      return <GiKnifeFork className={cls} />;
    case 'beauty':
      return <GiScissors className={cls} />;
    case 'shisha':
      return <MdLocalBar className={cls} />;
    case 'mot':
      return <FaCar className={cls} />;
    case 'spa':
      return <MdSpa className={cls} />;
    case 'healthcare':
      return <MdLocalHospital className={cls} />;
    case 'events':
      return <FaMusic className={cls} />;
    case 'entertainment':
      return <FaGamepad className={cls} />;
    default:
      return <FiGift className={cls} />;
  }
};

export const NumberOfServices = ({ type, className }) => {
  const cls = className || "absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]";
  switch (type) {
    case 'restaurant':
      return <FaUsers className={cls} />;
    case 'beauty':
      return <FaUsers className={cls} />;
    case 'shisha':
      return <FaUsers className={cls} />;
    case 'mot':
      return <FaCar className={cls} />;
    case 'spa':
      return <FaUsers className={cls} />;
    case 'healthcare':
      return <FaUsers className={cls} />;
    case 'events':
      return <FaUsers className={cls} />;
    case 'entertainment':
      return <FaUsers className={cls} />;
    default:
      return <FiGift className={cls} />;
  }
};

