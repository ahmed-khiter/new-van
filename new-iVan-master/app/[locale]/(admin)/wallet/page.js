"use client";
import Wallet from "@/components/Profile/Wallet";

const AdminWalletPage = () => {
  return (
    <>
      <div className="pagetitle">
        <h1>Wallet Management</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item active">Wallet Management</li>
          </ol>
        </nav>
      </div>
      <Wallet accountType="affiliate"/>
    </>
  );
};

export default AdminWalletPage;
