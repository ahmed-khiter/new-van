import { NextResponse } from "next/server";
import { calculateJobPrice } from "@/utils/pricingService";
import {
  assignVehicleForCartAI,
  calculateVehiclePrice,
} from "../../../utils/vehicleAssigner";

export async function POST(request) {
  try {
    const body = await request.json();
    const { category, jobDetails, cartItems } = body;

    // Validation
    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }
    let calculatedPrice = 0.0;
    let tokenUsage = null;
    let vanSize = "small_van";
    if (cartItems) {
      const {vehicle: vehicleForOrder, ai_tokens} = await assignVehicleForCartAI(cartItems);
      console.log(
        "Calculating price based on vehicle assigned: ",
        vehicleForOrder
      );
      tokenUsage = ai_tokens;
      vanSize = vehicleForOrder;
      if (vehicleForOrder) {
      calculatedPrice = await calculateVehiclePrice(vehicleForOrder, {
        ...jobDetails,
        distance: parseFloat(jobDetails.distance),
        category,
      });
      console.log("Calculated price based on vehicle: ", calculatedPrice);
      } else {
        console.log("No vehicle assigned, falling back to jobDetails only");
        calculatedPrice = await calculateJobPrice(category, {
          ...jobDetails,
          distance: parseFloat(jobDetails.distance),
        });
      }
    } else {
      console.log("Calculating price fallback to jobDetails only");
      calculatedPrice = await calculateJobPrice(category, {
        ...jobDetails,
        distance: parseFloat(jobDetails.distance),
      });
    }

    return NextResponse.json({
      price: calculatedPrice,
      category,
      jobDetails,
      tokenUsage,
      vanSize,
    });
  } catch (error) {
    console.error("Error calculating price:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
