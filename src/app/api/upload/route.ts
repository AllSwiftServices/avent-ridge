import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    if (!file || !path) {
      return NextResponse.json(
        { message: "File and path are required" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    
    // Upload to 'kyc' bucket
    const { data, error } = await supabaseAdmin.storage
      .from("kyc")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      throw error;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("kyc")
      .getPublicUrl(path);

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
