import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";

export async function GET() {
    try {
        await connectDB();
        const tenants = await Tenant.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: tenants }, { status: 200 });
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
        const tenant = await Tenant.create(body);
        return NextResponse.json({ success: true, data: tenant }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
