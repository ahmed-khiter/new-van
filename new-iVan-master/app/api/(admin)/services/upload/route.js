import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/utils/s3Helper";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const role = req.headers.get("role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, JPEG, WEBP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
    }

    if (!process.env.S3_BUCKET || !process.env.S3_KEY || !process.env.S3_SECRET || !process.env.S3_REGION) {
      return NextResponse.json({ error: "File storage is not configured" }, { status: 500 });
    }

    const key = await uploadFileToS3(file);
    return NextResponse.json({ key }, { status: 200 });
  } catch (error) {
    console.error("Error uploading service image:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
