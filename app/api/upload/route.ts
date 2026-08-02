import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type") === "avatar" ? "avatar" : "car";

  // Only admins manage the fleet; any signed-in user may upload their own avatar.
  if (type === "car" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: type === "avatar" ? "rental-cars/avatars" : "rental-cars/cars",
  });

  return NextResponse.json({ url: result.secure_url });
}
