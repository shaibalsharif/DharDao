"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { updateUserPhoto } from "@/app/actions"

interface ProfilePhotoProps {
  userId: string
  photoURL: string | null
  displayName: string | null
  email: string | null
  onPhotoUpdated: (newPhotoURL: string) => void
}

export default function ProfilePhoto({ userId, photoURL, displayName, email, onPhotoUpdated }: ProfilePhotoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = () => {
    // Explicitly focus and click the file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setIsUploading(true)
    try {
      const file = fileInputRef.current.files[0]

      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)

      // Upload to server
      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()

      // Update user profile with new photo URL
      await updateUserPhoto(userId, data.url)

      // Update UI
      onPhotoUpdated(data.url)

      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully",
      })

      // Close dialog
      setIsOpen(false)
      setPreviewUrl(null)
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If image fails to load, set src to empty to show the fallback avatar
    e.currentTarget.src = ""
  }

  return (
    <>
      <div className="relative group">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {photoURL ? (
            <img
              src={photoURL || "/placeholder.svg"}
              alt={displayName || email || "User"}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <span className="text-4xl font-bold">{displayName?.charAt(0) || email?.charAt(0) || "U"}</span>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsOpen(true)}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
              ) : photoURL ? (
                <img
                  src={photoURL || "/placeholder.svg"}
                  alt={displayName || email || "User"}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <span className="text-5xl font-bold">{displayName?.charAt(0) || email?.charAt(0) || "U"}</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleFileSelect} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                Select Image
              </Button>

              {previewUrl && (
                <Button variant="outline" onClick={() => setPreviewUrl(null)} disabled={isUploading}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              aria-hidden="true"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!previewUrl || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
