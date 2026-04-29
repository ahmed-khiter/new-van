"use client";
import MenuItemForm from "@/components/MenuItemForm";

export default function RestaurantEditMenuItemPage({ params }) {
  return (
    <>
      <div className="pagetitle">
        <h1>Edit Menu Item</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/restaurant/dashboard">Home</a>
            </li>
            <li className="breadcrumb-item">
              <a href="/restaurant/menu-items">Menu Items</a>
            </li>
            <li className="breadcrumb-item active">Edit Menu Item</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <MenuItemForm menuItemId={params.id} redirectPath="/restaurant/menu-items" />
          </div>
        </div>
      </section>
    </>
  );
}

