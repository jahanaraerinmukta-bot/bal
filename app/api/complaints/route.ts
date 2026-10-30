import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/supabase-admin";

const allowed = new Set(["extortion","threat","harassment","corruption","public_service","other"]);
function cleanText(v: unknown, max: number) {
  if (typeof v !== "string") return "";
  return v.replace(/\u0000/g, "").trim().slice(0, max);
}
export async function POST(req: Request) {
  try {
    // Basic origin check; add managed rate limiting / bot protection before public launch.
    const origin = req.headers.get("origin");
    const siteUrl = process.env.SITE_URL;
    if (origin && siteUrl && new URL(origin).origin !== new URL(siteUrl).origin) {
      return NextResponse.json({error:"অনুরোধ গ্রহণ করা যায়নি।"}, {status:403});
    }
    const body = await req.formData();
    const category = cleanText(body.get("category"), 40);
    const district = cleanText(body.get("district"), 80) || null;
    const narrative = cleanText(body.get("narrative"), 5000);
    const date = cleanText(body.get("incident_date"), 10) || null;
    const image = body.get("image");
    let imagePath: string | null = null;
    if (image instanceof File && image.size > 0) {
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      if (!allowedTypes.has(image.type) || image.size > 5 * 1024 * 1024) {
        return NextResponse.json({error:"ছবি JPG, PNG বা WebP হতে হবে এবং সর্বোচ্চ ৫ MB হতে পারবে।"}, {status:400});
      }
    }
    if (!allowed.has(category) || narrative.length < 30) {
      return NextResponse.json({error:"অভিযোগের ধরন বেছে নিন এবং কমপক্ষে ৩০ অক্ষরের বিবরণ লিখুন।"}, {status:400});
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({error:"তারিখ সঠিক নয়।"}, {status:400});
    }
    const db = adminDb();
    if (image instanceof File && image.size > 0) {
      const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
      imagePath = `${crypto.randomUUID()}.${ext}`;
      const bytes = Buffer.from(await image.arrayBuffer());
      const { error: uploadError } = await db.storage.from("complaint-images").upload(imagePath, bytes, { contentType:image.type, upsert:false });
      if (uploadError) return NextResponse.json({error:"ছবি আপলোড করা যায়নি। পরে আবার চেষ্টা করুন।"}, {status:500});
    }
    const {data,error} = await db.from("complaint_submissions").insert({
      category, district, incident_date:date, narrative, image_path:imagePath, status:"pending"
    }).select("reference_code").single();
    if (error && imagePath) await db.storage.from("complaint-images").remove([imagePath]);
    if (error || !data) {
      console.error("Complaint intake failed"); // Do not log complaint text or request body.
      return NextResponse.json({error:"এই মুহূর্তে জমা দেওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।"}, {status:500});
    }
    return NextResponse.json({ok:true, reference_code:data.reference_code}, {status:201});
  } catch {
    return NextResponse.json({error:"অনুরোধটি প্রক্রিয়া করা যায়নি।"}, {status:400});
  }
}
