import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Tenant from "@/models/Tenant";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenantId");
        const month = searchParams.get("month");

        await connectDB();
        let query = {};
        if (tenantId) query.tenantId = tenantId;
        if (month) query.month = month;

        const bills = await Bill.find(query)
            .populate("tenantId", "name room rent")
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: bills }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const body = await req.json();
        const { tenantId } = body;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return NextResponse.json(
                { success: false, error: "Tenant not found" },
                { status: 404 }
            );
        }

        // Electricity calculations
        const prevUnit = Number(body.prevUnit) || 0;
        const currUnit = Number(body.currUnit) || 0;
        const usedUnit = currUnit - prevUnit;
        const unitPrice = body.unitPrice !== undefined ? Number(body.unitPrice) : 10;
        const electricityCost = usedUnit * unitPrice;

        const water = Number(body.water) || 0;
        const rent = body.rent !== undefined ? Number(body.rent) : tenant.rent;

        // Previous Due Logic
        let previousDue = Number(body.previousDue);
        if (isNaN(previousDue) || body.previousDue === undefined || body.previousDue === null) {
            const lastBill = await Bill.findOne({ tenantId }).sort({ createdAt: -1 });
            previousDue = lastBill ? (lastBill.remaining || 0) : 0;
        }

        const total = rent + water + electricityCost + previousDue;

        // Split payment support
        const cashAmount = Number(body.cashAmount) || 0;
        const onlineAmount = Number(body.onlineAmount) || 0;
        const paidAmount = cashAmount + onlineAmount;
        const remaining = total - paidAmount;

        // Determine payment method
        let paymentMethod = "cash";
        if (cashAmount > 0 && onlineAmount > 0) paymentMethod = "both";
        else if (onlineAmount > 0) paymentMethod = "online";
        else paymentMethod = "cash";

        const billData = {
            tenantId,
            month: body.month,
            rent,
            prevUnit,
            currUnit,
            usedUnit,
            unitPrice,
            electricityCost,
            water,
            previousDue,
            total,
            cashAmount,
            onlineAmount,
            paidAmount,
            remaining,
            paymentMethod,
            remarks: body.remarks || "",
        };

        const bill = await Bill.create(billData);
        return NextResponse.json({ success: true, data: bill }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
