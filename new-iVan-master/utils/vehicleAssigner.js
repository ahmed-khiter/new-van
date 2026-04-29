import OpenAI from "openai";
import { courierVehicleTypes } from "./helper.js";
import { calculateJobPrice } from "./pricingService.js";
import prisma from "@/lib/prisma";

/**
 * Use OpenAI model to determine the best vehicle type for the given cart items.
 * The model will analyze weight, dimensions, and quantity and return one of the defined vehicle types.
 */
export async function assignVehicleForCartAI(cartItems = []) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return "small_van"; // Default fallback
  }

  console.log("Assigning vehicle for cart items via AI:", cartItems);

  const vehicleList = courierVehicleTypes.map((v) => v.value).join(", ");

  const prompt = `
You are a logistics expert. Available vehicles: ${vehicleList}

Input: a JSON array of cart items with fields:
{ name, quantity, weight (kg), dimensions: { length, width, height } (cm) }.
If weight or dimensions are missing, estimate conservatively.

Task:
Analyze each item (weight, volume, largest dimension, item type, fragility inferred from name) and determine the single MOST SUITABLE vehicle that safely fits the full load with minimal over-capacity.

--------------- CART ITEMS ---------------
${JSON.stringify(cartItems, null, 2)}
-------------------------------------------

Rules for Item Analysis:
1. Infer category from name:
   - electronics, headset, earbuds, mouse, phone → small electronics
   - monitor, TV, large glass, vase → fragile & large
   - food, documents, parcels → small light items
   - furniture, appliances, boxes → bulky/heavy

2. Fragility Logic (IMPORTANT):
   - Small fragile electronics (e.g., "headset", "earbuds", "phone", "camera"):
       *Fragile but compact and can safely be delivered on bike/motorbike if total load is small.*
   - Large fragile items (e.g., "monitor", "glass table"):
       *Must be enclosed → choose car or any van.*

3. Weight & Volume:
   - Very light & compact (<10kg total, low volume) → bike or motorbike
   - Moderate (<30kg total or <5 medium items) → car or small_van
   - Heavy or large (>100kg or bulky items) → large_van or xl_van
   - Mixed small + some bulky → small_van → medium_van → large_van progressively

4. Vehicle capacity logic:
   - Must fit total volume, weight limit, and largest single-item dimensions.
   - If multiple vehicles fit → choose the SMALLEST safe vehicle.
   
Output:
Provide ONLY the vehicle type as output.`;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert logistics vehicle selector." },
        { role: "user", content: prompt },
      ],
      max_tokens: 20,
      temperature: 0.2,
    });

    const response = completion.choices[0].message.content.trim().toLowerCase();

    const valid = courierVehicleTypes.find((v) => v.value === response);

    return {
      vehicle: valid ? valid.value : "small_van",
      ai_tokens: completion.usage,
    };
  } catch (err) {
    console.error("OpenAI vehicle assignment error:", err);
    return { vehicle: "small_van" };
  }
}


export const calculateVehiclePrice = async (vehicleType, job) => {
  const { category, distance } = job;
  try {
    const vehicle = await prisma.vehicle_types.findFirst({
      where: { name: vehicleType },
      select: {
        pricePerMile: true,
        callOutCharge: true,
      },
    });

    if (vehicle) {
      const totalPrice =
        parseFloat(vehicle.pricePerMile || 0) * parseFloat(distance || 0) +
        parseFloat(vehicle.callOutCharge || 0);
      return totalPrice;
    }

    // Fallback if no vehicle record found
    const calculatedPrice = await calculateJobPrice(category, {
      distance: parseFloat(distance),
    });
    return calculatedPrice;
  } catch (error) {
    console.error("Error fetching vehicle price:", error);
    // Fallback to custom calculation on error
    const calculatedPrice = await calculateJobPrice(category, {
      distance: parseFloat(distance),
    });
    return calculatedPrice;
  }
};
