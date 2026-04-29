import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/utils/s3Helper";
import { getUserFullName } from "@/utils/helper";
import { sendEmail } from "@/lib/sendEmail"

export const POST = async (request) => {
    try {
        const formData = await request.formData();
        const ids = formData.getAll("ids");
        const files = formData.getAll("files");
        const isJobFlow = formData.get("isJob") === "true";
        const vehicleType = formData.get("vehicleType");
        const userId = parseInt(request.headers.get("user-id"));

        const user = await prisma.users.findFirst({ where: { id: userId } });

        if (!ids.length || !files.length) {
            return NextResponse.json(
                { error: "At least one document id and file required" },
                { status: 400 }
            );
        }

        const results = [];
        let category = null;

        // Get category from first document to validate vehicle type early
        if (ids.length > 0) {
            const firstDoc = await prisma.documents.findUnique({ where: { id: ids[0] } });
            if (firstDoc) {
                category = firstDoc.category;
            }
        }

        // Validate vehicle type for Van, restaurant, and shop services before processing (only if provider doesn't have any vehicle types yet)
        if (!isJobFlow && (category === "Van" || category === "restaurant" || category === "shop") && !vehicleType) {
            // Check if provider already has vehicle types for this service
            const courierService = await prisma.services.findFirst({
                where: { name: {contains : "Courier"} }
            });

            if (courierService) {
                // Find vehicle types for the courier service
                const courierVehicleTypes = await prisma.vehicle_types.findMany({
                    where: {
                        serviceId: courierService.id,
                        isActive: true
                    },
                    select: { id: true }
                });

                if (courierVehicleTypes.length > 0) {
                    const vehicleTypeIds = courierVehicleTypes.map(vt => vt.id);
                    
                    // Check if provider has any of these vehicle types
                    const existingProviderVehicles = await prisma.provider_vehicles.findFirst({
                        where: {
                            userId: userId,
                            vehicleTypeId: { in: vehicleTypeIds }
                        }
                    });

                    // Only require vehicle type if provider doesn't have any yet
                    if (!existingProviderVehicles) {
                        return NextResponse.json(
                            { error: "Vehicle type is required for Van service" },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const file = files[i];
            const fileName = await uploadFileToS3(file);

            const existingDoc = await prisma.documents.findUnique({ where: { id } });
            if (!existingDoc) {
                results.push({ id, error: "Document not found" });
                continue;
            }

            // Category already set above
            let updatedDoc;

            if (existingDoc.status === "Rejected") {
                await prisma.documents.update({
                    where: { id: existingDoc.id },
                    data: { status: "Reuploaded", userId },
                });

                updatedDoc = await prisma.documents.create({
                    data: {
                        name: existingDoc.name,
                        userId,
                        category: existingDoc.category,
                        jobId: existingDoc.jobId,
                        fileName,
                        status: "Waiting For Approval",
                    },
                });
            } else if (existingDoc.status === "Required") {
                updatedDoc = await prisma.documents.update({
                    where: { id: existingDoc.id },
                    data: { fileName, status: "Waiting For Approval", userId },
                });
                if (isJobFlow) {
                    await prisma.jobs.updateMany({
                        where: { id: existingDoc.jobId },
                        data: { status: "pending" }
                    });
                }
            } else {
                results.push({
                    id,
                    error: "Only Required or Rejected documents can be resubmitted",
                });
                continue;
            }

            results.push({ id, document: updatedDoc });
        }

        // Handle vehicle type for Van, restaurant, and shop services
        if (!isJobFlow && (category === "Van" || category === "restaurant" || category === "shop") && vehicleType) {
            // Find the Courier (Van service)
            const courierService = await prisma.services.findFirst({
                where: { name: { contains: "Courier" } }
            });

            if (courierService) {
                // Find the vehicle type by name and serviceId
                const vehicleTypeRecord = await prisma.vehicle_types.findFirst({
                    where: {
                        name: vehicleType,
                        serviceId: courierService.id,
                        isActive: true
                    }
                });
                if (vehicleTypeRecord) {
                    // Check if provider already has this vehicle type
                    const existingProviderVehicle = await prisma.provider_vehicles.findFirst({
                        where: {
                            userId: userId,
                            vehicleTypeId: vehicleTypeRecord.id
                        }
                    });

                    // Only create if it doesn't exist
                    if (!existingProviderVehicle) {
                        const newProviderVehicle = await prisma.provider_vehicles.create({
                            data: {
                                userId: userId,
                                vehicleTypeId: vehicleTypeRecord.id
                            }
                        });
                        console.log("Provider vehicle created:", newProviderVehicle);
                    } else {
                        console.log("Provider vehicle already exists for userId:", userId, "vehicleTypeId:", vehicleTypeRecord.id);
                    }
                } else {
                    console.warn(`Vehicle type "${vehicleType}" not found for Courier`);
                }
            } else {
                console.warn("Courier not found");
            }
        }

        if (!isJobFlow && category) {
            await sendEmail({
                name: getUserFullName(user.firstName, user.lastName),
                email: user.email,
                serviceName: category,
                subject: `Your ${category} Service Documents Have Been Successfully Received`,
                type: "serviceDocumentUpload",
            });
        }

        return NextResponse.json({ message: "Documents processed", results });
    } catch (err) {
        console.error("Error uploading documents:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
};



export const GET = async (request) => {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const jobId = searchParams.get("jobId");
        const userId = request.headers.get("user-id");

        if (!userId) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        if (!category && !jobId) {
            return NextResponse.json(
                { error: "Either jobId or category is required" },
                { status: 400 }
            );
        }


        const requirements = await prisma.documents.findMany({
            where: {
                userId: Number(userId),
                status: { not: "Reuploaded" },
                ...(jobId ? { jobId } : { category }),
            }
        });

        const order = {
            "Required": 1,
            "Rejected": 2,
            "Waiting For Approval": 3,
            "Approved": 4,
        };

        const sortedRequirements = requirements.sort(
            (a, b) => (order[a.status] || 999) - (order[b.status] || 999)
        );
        let jobStatus = "pending";
        if (jobId && sortedRequirements.every(doc => doc.status === "Approved")) {
            await prisma.jobs.updateMany({
                where: { id: jobId },
                data: { 
                    status: "completed",
                    completedAt: new Date(),
                    providerPaymentStatus: "pending"
                },
            });
               // Also mark related product orders as completed
                await prisma.product_orders.updateMany({
                    where: { 
                        jobId: jobId,
                        status: "paid"
                    },
                    data: { shopOwnerPaymentStatus: "pending" }
                });
            jobStatus = "completed";
        }

        // Add jobStatus to each requirement if jobId is provided
        const requirementsWithJobStatus = jobId 
            ? sortedRequirements.map(req => ({ ...req, jobStatus }))
            : sortedRequirements;

        // Fetch provider's selected vehicle types for Van, restaurant, and shop services
        let selectedVehicleType = null;
        if (category === "Van" || category === "restaurant" || category === "shop") {
            const courierService = await prisma.services.findFirst({
                where: { name: { contains: "Courier" } }
            });

            if (courierService) {
                const providerVehicles = await prisma.provider_vehicles.findMany({
                    where: {
                        userId: Number(userId),
                    },
                    include: {
                        vehicleType: true,
                    },
                });

                selectedVehicleType = providerVehicles
                    .find(pv => pv.vehicleType && pv.vehicleType.serviceId === courierService.id && pv.vehicleType.isActive)
                    ?.vehicleType?.name;
                    console.log("selectedVehicleType", selectedVehicleType);
                    console.log("providerVehicles", providerVehicles);
            }
          
            console.log("courierService", courierService);
        }

        return NextResponse.json({
            requirements: requirementsWithJobStatus,
            selectedVehicleType
        });
    } catch (err) {
        console.error("Error fetching requirements:", err);
        return NextResponse.json(
            { error: err.message || "Server error while fetching requirements" }, 
            { status: 500 }
        );
    }
};
