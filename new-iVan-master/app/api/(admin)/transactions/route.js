import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
export const GET = async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const role = req.headers.get("role");
        const userId = req.headers.get("user-id");
        const sourceFilter = searchParams.get("source"); 
        const typeFilter = searchParams.get("type"); 
        const searchTerm = searchParams.get("search"); 

        let whereClause = {};

        
        if (role === "visitor") {
            whereClause.user_id = Number(userId);
        }
        
        if (sourceFilter === "subscription") {
            whereClause.plan_id = { not: null };
        } else if (sourceFilter === "job") {
            whereClause.job_id = { not: null };
            whereClause.order_id = null;
        } else if (sourceFilter === "order") {
            whereClause.order_id = { not: null };
        }

        if (typeFilter) {
            whereClause.type = typeFilter;
        }

        
        if (searchTerm) {
            whereClause.OR = [
                { transaction_id: { contains: searchTerm } },
                { sender: { firstName: { contains: searchTerm } } },
                { sender: { lastName: { contains: searchTerm } } },
                { sender: { email: { contains: searchTerm } } }
            ];
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { date: "desc" }
        });

        
        const jobIds = transactions
            .filter(t => t.job_id)
            .map(t => t.job_id);
        
        const jobs = jobIds.length > 0 ? await prisma.jobs.findMany({
            where: { id: { in: jobIds } },
            select: {
                id: true,
                title: true,
                category: true,
                price: true,
                status: true
            }
        }) : [];

        
        const planIds = transactions
            .filter(t => t.plan_id)
            .map(t => t.plan_id);
        console.log(planIds  , "planIds");
        const plans = planIds.length > 0 ? await prisma.plans.findMany({
            where: { plan_id : { in: planIds } },
            select: {
                plan_id: true,
                name: true,
                price: true
            }
        }) : [];

        // Get order details for product purchases (cart-based)
        const orderIds = transactions
            .filter(t => t.order_id)
            .map(t => t.order_id);
        
        const orders = orderIds.length > 0 ? await prisma.product_orders.findMany({
            where: { id: { in: orderIds } },
            include: {
                cart: {
                    include: {
                        cartItems: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true,
                                        image: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }) : [];

        console.log(plans  , "plans");
        const transactionsWithDetails = transactions.map(transaction => {
            const job = transaction.job_id ? jobs.find(j => j.id === transaction.job_id) : null;
            const plan = transaction.plan_id ? plans.find(p => p.plan_id === transaction.plan_id) : null;
            const order = transaction.order_id ? orders.find(o => o.id === transaction.order_id) : null;
            
            return {
                ...transaction,
                job: job,
                plan: plan,
                order: order
            };
        });

        
        const allTransactions = await prisma.transaction.findMany({
            where: role === "visitor" ? { user_id: Number(userId) } : {},
            select: {
                type: true,
                amount: true,
                plan_id: true,
                job_id: true
            }
        });

        const totalRevenue = allTransactions
            .filter(t => t.type === "payment" && t.amount)
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        
        const totalTransactions = allTransactions.length;

        const stats = {
            totalRevenue,
            totalTransactions
        };

        return NextResponse.json({ transactions: transactionsWithDetails, stats }, { status: 200 });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to fetch transactions" 
        }, { status: 500 });
    }
};
