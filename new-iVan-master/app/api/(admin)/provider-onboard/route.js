import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serviceVerificationRequirements } from "@/utils/helper";
import { checkFeatureUsage, incrementFeatureUsage } from "../../../../utils/subscriptionService";

// Helper function to check if a document name is an ID document
const isIdDocument = (docName) => {
  const idPatterns = [
    "Government-issued ID",
    "Driving License",
    "Passport"
  ];
  return idPatterns.some(pattern => docName.toLowerCase().includes(pattern.toLowerCase()));
};

// Helper function to check if a document name is a Proof of Address document
const isProofOfAddressDocument = (docName) => {
  const addressPatterns = [
    "Proof of Address",
    "Utility Bill",
    "Bank Statement"
  ];
  return addressPatterns.some(pattern => docName.toLowerCase().includes(pattern.toLowerCase()));
};

// Services that only require basic documents (ID + Proof of Address)
const basicDocumentOnlyServices = ["Cleaning", "Locksmith", "Car Key Replacement", "Removals"];

export const POST = async (request) => {
  const userId = parseInt(request.headers.get("user-id"));
  const userRole = request.headers.get("role");

  if (!userId || !userRole) {
    return NextResponse.json(
      { error: "User ID and role are required" },
      { status: 400 }
    );
  }

  if (userRole !== "provider") {
    return NextResponse.json(
      { error: "Only providers can onboard" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { service, isOnBoard } = body;

    if (!service) {
      return NextResponse.json(
        { error: "Service must be selected" },
        { status: 400 }
      );
    }

    // Get current user settings
    const currentUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    if (!isOnBoard) {
      const result = await checkFeatureUsage({
        userId,
        featureName: "service_slots",
      });
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
    // Parse existing settings or initialize empty object
    const currentSettings = currentUser?.settings || {};
    const existingServices = currentSettings.services || [];

    // Check if service already exists
    const existingService = existingServices.find((s) => s.name === service);

    if (existingService) {
      if (existingService.status === "Approved") {
        return NextResponse.json(
          { error: "Service is already approved" },
          { status: 400 }
        );
      }
      if (existingService.status === "Pending") {
        return NextResponse.json(
          { error: "Service is already pending verification" },
          { status: 400 }
        );
      }
    }

    // Get verification requirements for the selected service
    const requirements = serviceVerificationRequirements[service] || [];

    // Check if the user already has approved ID and Proof of Address documents from ANY service
    const allUserDocuments = await prisma.documents.findMany({
      where: {
        userId,
        status: "Approved",
      },
    });

    const hasApprovedId = allUserDocuments.some(doc => isIdDocument(doc.name));
    const hasApprovedProofOfAddress = allUserDocuments.some(doc => isProofOfAddressDocument(doc.name));
    const hasBasicDocumentsApproved = hasApprovedId && hasApprovedProofOfAddress;

    // Check if this service only requires basic documents (ID + Proof of Address)
    const serviceOnlyRequiresBasicDocs = basicDocumentOnlyServices.includes(service);

    // Determine the status for the new service
    let newServiceStatus = "Pending";
    let shouldAutoApprove = false;

    // If user has basic docs approved AND service only requires basic docs, auto-approve
    if (hasBasicDocumentsApproved && serviceOnlyRequiresBasicDocs) {
      newServiceStatus = "Approved";
      shouldAutoApprove = true;
    }

    // Add new service with appropriate status
    const updatedServices = [
      ...existingServices.filter((s) => s.name !== service), // Remove existing if any
      { name: service, status: newServiceStatus },
    ];

    // Create required documents for the new service
    for (const req of requirements) {
      // Check if doc already exists for this specific service
      const existingDoc = await prisma.documents.findFirst({
        where: { userId, name: req, category: service },
      });

      if (!existingDoc) {
        // Check if this is a basic document (ID or Proof of Address) and user already has it approved
        const isBasicIdDoc = isIdDocument(req);
        const isBasicAddressDoc = isProofOfAddressDocument(req);

        let docStatus = "Required";
        let copyFromDoc = null;

        // If it's a basic document type and user has it approved from another service, auto-approve it
        if (isBasicIdDoc && hasApprovedId) {
          // Find the approved ID document to copy the fileName from
          copyFromDoc = allUserDocuments.find(doc => isIdDocument(doc.name));
          docStatus = "Approved";
        } else if (isBasicAddressDoc && hasApprovedProofOfAddress) {
          // Find the approved Proof of Address document to copy the fileName from
          copyFromDoc = allUserDocuments.find(doc => isProofOfAddressDocument(doc.name));
          docStatus = "Approved";
        }

        await prisma.documents.create({
          data: {
            name: req,
            status: docStatus,
            userId,
            category: service,
            fileName: copyFromDoc?.fileName || null,
          },
        });
      }
    }

    // Update profile with new settings
    const updatedSettings = {
      ...currentSettings,
      services: updatedServices,
    };

    const updatedProfile = await prisma.users.update({
      where: { id: userId },
      data: {
        settings: updatedSettings,
        isFirstTime: false,
      },
    });
    // update the user features usage if onboarding new service
    if (!isOnBoard) {
      await incrementFeatureUsage({
        userId,
        featureName: "service_slots",
      });
    }

    return NextResponse.json(
      { 
        message: shouldAutoApprove 
          ? "Service approved automatically - your documents are already verified" 
          : "Provider onboarded successfully", 
        profile: updatedProfile,
        autoApproved: shouldAutoApprove
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating provider profile:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
};
