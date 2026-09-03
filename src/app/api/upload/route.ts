import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Otentikasi diperlukan" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const isImage = imageTypes.includes(file.type);
    const isVideo = videoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Format file harus JPG, PNG, WEBP, GIF (foto) atau MP4, WEBM, MOV (video)" },
        { status: 400 }
      );
    }

    const imageLimit = 5 * 1024 * 1024;
    const videoLimit = 100 * 1024 * 1024;
    const limit = isVideo ? videoLimit : imageLimit;
    if (file.size > limit) {
      return NextResponse.json(
        { error: isVideo ? "Ukuran video maksimal 100MB" : "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "data", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const extMap: Record<string, string> = {
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/quicktime": "mov",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extMap[file.type] ?? (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg"));
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah file" }, { status: 500 });
  }
}
