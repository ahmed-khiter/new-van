"use client";
import MenuItemForm from "@/components/MenuItemForm";

export default function RestaurantAddMenuItemPage() {
  return (
    <>
      <div className="pagetitle">
        <h1>Add Menu Item</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/restaurant/dashboard">Home</a>
            </li>
            <li className="breadcrumb-item">
              <a href="/restaurant/menu-items">Menu Items</a>
            </li>
            <li className="breadcrumb-item active">Add Menu Item</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <MenuItemForm menuItemId="create" redirectPath="/restaurant/menu-items" />
          </div>
        </div>
      </section>
    </>
  );
}

