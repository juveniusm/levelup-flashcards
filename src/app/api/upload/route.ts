import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { v2 as cloudinary } from "cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import sharp from "sharp";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const useCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        if (limiter.check(30, ip)) { // Max 30 upload calls per minute per IP
            return NextResponse.json({ message: "Too Many Requests" }, { status: 429 });
        }
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as { role?: string }).role;
        if (role !== "ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ message: "File too large. Maximum size is 5 MB." }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json({ message: "Invalid file type. Only images are allowed." }, { status: 400 });
        }

        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return NextResponse.json({ message: "Invalid file extension." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // ── Production: Cloudinary ────────────────────────────────────────
        if (useCloudinary) {
            const url: string = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "levelup-flashcards", resource_type: "image" },
                    (error, result) => {
                        if (error || !result) return reject(error ?? new Error("Upload failed"));
                        resolve(result.secure_url);
                    }
                );
                stream.end(buffer);
            });

            return NextResponse.json({ url }, { status: 200 });
        }

        // ── Development: local disk ───────────────────────────────────────
        const uploadsDir = join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Strip payload/metadata from raster images before saving to disk
        const safeBuffer = await sharp(buffer).toBuffer();

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
        const safeFilename = `${uniqueSuffix}.${ext}`;
        await writeFile(join(uploadsDir, safeFilename), safeBuffer);

        return NextResponse.json({ url: `/uploads/${safeFilename}` }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ message: "Upload failed" }, { status: 500 });
    }
}
