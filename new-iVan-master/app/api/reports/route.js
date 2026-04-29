import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/utils/s3Helper";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET endpoint to fetch reports (for admin)
export async function GET(req) {
  try {
    const userRole = req.headers.get("role");

    if (userRole !== "admin" && userRole !== "affiliate") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { issueType: { contains: search } },
        { description: { contains: search } },
        { job: { title: { contains: search } } }
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.reports.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              category: true,
              status: true
            }
          },
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.reports.count({ where })
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const userId = req.headers.get("user-id");
    const userRole = req.headers.get("role");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    
    const jobId = formData.get("jobId");
    const issueType = formData.get("issueType");
    const description = formData.get("description");
    const desiredAction = formData.get("desiredAction") || "";
    const notifyByEmail = formData.get("notifyByEmail") === "true";
    const notifyInApp = formData.get("notifyInApp") === "true";

    // Validate required fields
    if (!jobId || !issueType || !description) {
      return NextResponse.json(
        { error: "Job ID, issue type, and description are required" },
        { status: 400 }
      );
    }

    // Verify job exists and user has access
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: { id: true, createdById: true, acceptedById: true }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user is the job creator or acceptor
    const isJobCreator = job.createdById === parseInt(userId);
    const isJobAcceptor = job.acceptedById === parseInt(userId);
    
    if (!isJobCreator && !isJobAcceptor) {
      return NextResponse.json(
        { error: "You don't have permission to report issues for this job" },
        { status: 403 }
      );
    }

    // Handle evidence file uploads
    const evidenceFiles = formData.getAll("evidence");
    const uploadedEvidence = [];

    for (const file of evidenceFiles) {
      if (file && file.size > 0) {
        try {
          const fileName = await uploadFileToS3(file);
          if (fileName) {
            uploadedEvidence.push(fileName);
          }
        } catch (uploadError) {
          console.error('Error uploading evidence file:', uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    // Store report in database
    const report = await prisma.reports.create({
      data: {
        jobId,
        issueType,
        description,
        desiredAction: desiredAction || null,
        notifyByEmail,
        notifyInApp,
        evidenceFiles: uploadedEvidence.length > 0 ? uploadedEvidence : null,
        reportedById: parseInt(userId),
        reportedByRole: userRole || "visitor",
        status: "pending"
      }
    });
    
    // Send notification email if requested
    if (notifyByEmail) {
      // TODO: Implement email notification
      console.log("Email notification requested for report");
    }

    return NextResponse.json({
      success: true,
      message: "Issue reported successfully. We'll review it and get back to you.",
      data: {
        reportId: report.id,
        jobId,
        issueType,
        evidenceCount: uploadedEvidence.length
      }
    });

  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update report status (for admin)
export async function PATCH(req) {
  try {
    const userRole = req.headers.get("role");

    if (userRole !== "admin" && userRole !== "affiliate") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { reportId, status, adminNotes } = await req.json();

    if (!reportId || !status) {
      return NextResponse.json(
        { error: "Report ID and status are required" },
        { status: 400 }
      );
    }

    const updateData = {
      status,
      adminNotes: adminNotes || null
    };

    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const report = await prisma.reports.update({
      where: { id: reportId },
      data: updateData,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      data: report
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update report" },
      { status: 500 }
    );
  }
}

