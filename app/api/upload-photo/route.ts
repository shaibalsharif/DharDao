import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

// Create a simple file storage solution
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique filename
    const timestamp = Date.now()
    const uniqueId = uuidv4()
    const originalName = file.name.replace(/\s+/g, "-")
    const filename = `${userId}-${timestamp}-${uniqueId}-${originalName}`

    // Create directory if it doesn't exist
    const publicDir = join(process.cwd(), "public")
    const uploadsDir = join(publicDir, "uploads")
    const profilePhotosDir = join(uploadsDir, "profile-photos")

    try {
      await writeFile(join(profilePhotosDir, filename), buffer)
    } catch (error) {
      console.error("Error writing file:", error)
      // If directory doesn't exist, create it and try again
      const { mkdir } = await import("fs/promises")
      await mkdir(profilePhotosDir, { recursive: true })
      await writeFile(join(profilePhotosDir, filename), buffer)
    }

    // Return the URL to the uploaded file
    const url = `/uploads/profile-photos/${filename}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
