import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import Bill from "@/models/Bill";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const tenant = await Tenant.findById(id);
        if (!tenant) {
            return NextResponse.json(
                { success: false, error: "Tenant not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: tenant }, { status: 200 });
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
        const tenant = await Tenant.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });
        if (!tenant) {
            return NextResponse.json(
                { success: false, error: "Tenant not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: tenant }, { status: 200 });
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
        const tenant = await Tenant.findByIdAndDelete(id);
        if (!tenant) {
            return NextResponse.json(
                { success: false, error: "Tenant not found" },
                { status: 404 }
            );
        }
        // Delete associated bills
        await Bill.deleteMany({ tenantId: id });
        return NextResponse.json({ success: true, message: "Tenant deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
