import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    console.log("Database connected");
    return Response.json({ message: "Database connected" });
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}