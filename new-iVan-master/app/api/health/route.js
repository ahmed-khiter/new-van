// app/api/health/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const startTime = Date.now();
    
    try {
        // Run a simple raw SQL query to verify DB connectivity
        await prisma.$queryRaw`SELECT 1`;
        
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json(
            { 
                status: "ok", 
                message: "Swipped Deployed and Running",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                responseTime: `${responseTime}ms`,
                environment: process.env.NODE_ENV
            },
            { status: 200 }
        );
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json(
            { 
                status: "error", 
                message: "Database connection failed", 
                error: error.message,
                timestamp: new Date().toISOString(),
                responseTime: `${responseTime}ms`
            },
            { status: 500 }
        );
    }
}
