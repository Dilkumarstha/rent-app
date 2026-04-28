import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const bill = await Bill.findById(id).populate("tenantId", "name room rent");
        if (!bill) {
            return NextResponse.json(
                { success: false, error: "Bill not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: bill }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const body = await req.json();

        const billToUpdate = await Bill.findById(id);
        if (!billToUpdate) {
            return NextResponse.json(
                { success: false, error: "Bill not found" },
                { status: 404 }
            );
        }

        const prevUnit =
            body.prevUnit !== undefined ? Number(body.prevUnit) : billToUpdate.prevUnit;
        const currUnit =
            body.currUnit !== undefined ? Number(body.currUnit) : billToUpdate.currUnit;
        const usedUnit = currUnit - prevUnit;
        const unitPrice =
            body.unitPrice !== undefined ? Number(body.unitPrice) : billToUpdate.unitPrice;
        const electricityCost = usedUnit * unitPrice;

        const water =
            body.water !== undefined ? Number(body.water) : billToUpdate.water;
        const rent = body.rent !== undefined ? Number(body.rent) : billToUpdate.rent;
        const previousDue =
            body.previousDue !== undefined
                ? Number(body.previousDue)
                : billToUpdate.previousDue;

        const total = rent + water + electricityCost + previousDue;

        // Split payment support
        const cashAmount = body.cashAmount !== undefined ? Number(body.cashAmount) : (billToUpdate.cashAmount || 0);
        const onlineAmount = body.onlineAmount !== undefined ? Number(body.onlineAmount) : (billToUpdate.onlineAmount || 0);
        const paidAmount = cashAmount + onlineAmount;
        const remaining = total - paidAmount;

        // Determine payment method
        let paymentMethod = "cash";
        if (cashAmount > 0 && onlineAmount > 0) paymentMethod = "both";
        else if (onlineAmount > 0) paymentMethod = "online";
        else paymentMethod = "cash";

        const updatedData = {
            month: body.month || billToUpdate.month,
            prevUnit,
            currUnit,
            usedUnit,
            unitPrice,
            electricityCost,
            water,
            rent,
            previousDue,
            total,
            cashAmount,
            onlineAmount,
            paidAmount,
            remaining,
            paymentMethod,
            remarks: body.remarks !== undefined ? body.remarks : billToUpdate.remarks,
        };

        const bill = await Bill.findByIdAndUpdate(id, updatedData, {
            new: true,
            runValidators: true,
        });

        return NextResponse.json({ success: true, data: bill }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const bill = await Bill.findByIdAndDelete(id);
        if (!bill) {
            return NextResponse.json(
                { success: false, error: "Bill not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
