import React from "react";
import Wallet from "@/components/Profile/Wallet";

function page() {
  return (
    <>
      <div className="pagetitle">
        <h1>Wallet Management</h1>
        {/* <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/customer/dashboard">Home</a>
            </li>
            <li className="breadcrumb-item active">Wallet Management</li>
          </ol>
        </nav> */}
      </div>
      <Wallet accountType="customer" />
    </>
  );
}

export default page;

