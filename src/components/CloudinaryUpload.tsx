// src/components/CloudinaryUpload.tsx
"use client";

import React, { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Box, Button, IconButton, CircularProgress, Stack, Avatar } from "@mui/material";
import { ImageOutlined, Close as CloseIcon } from "@mui/icons-material";
import Image from "next/image";
interface CloudinaryUploadProps {
  // Single image mode (for avatars)
  currentImage?: string;
  onUploadSuccess?: (url: string) => void;
  
  // Multiple images mode (for posts)
  currentImages?: string[];
  onUploadSuccessMultiple?: (urls: string[]) => void;
  
  // Common props
  folder?: string;
  maxFiles?: number;
  showPreview?: boolean;
  buttonText?: string;
  buttonVariant?: "text" | "outlined" | "contained";
  fullWidth?: boolean;
  width?: number;
  height?: number;
}

// Type guard for Cloudinary response
interface CloudinaryInfo {
  secure_url: string;
}

export function CloudinaryUpload({
  currentImage,
  onUploadSuccess,
  currentImages = [],
  onUploadSuccessMultiple,
  folder = "familyfirst/posts",
  maxFiles = 1,
  showPreview = true,
  buttonText,
  buttonVariant = "outlined",
  fullWidth = false,
  width,
  height,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);

  // Determine if single or multiple mode
  const isSingleMode = onUploadSuccess !== undefined;
  const images = isSingleMode ? (currentImage ? [currentImage] : []) : currentImages;

  const handleRemoveImage = (index: number) => {
    if (isSingleMode && onUploadSuccess) {
      onUploadSuccess("");
    } else if (onUploadSuccessMultiple) {
      const newImages = images.filter((_, i) => i !== index);
      onUploadSuccessMultiple(newImages);
    }
  };

  const hasSecureUrl = (info: unknown): info is CloudinaryInfo => {
    return typeof info === "object" && info !== null && "secure_url" in info;
  };

  return (
    <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
        options={{
          multiple: maxFiles > 1,
          maxFiles: maxFiles,
          folder: folder,
          resourceType: "image",
          clientAllowedFormats: ["jpg", "png", "webp", "gif", "jpeg"],
          maxFileSize: 10485760,
          maxImageWidth: width || 2000,
          maxImageHeight: height || 2000,
          sources: ["local", "camera"],
          cropping: maxFiles === 1 && isSingleMode, // Enable cropping for avatars
          croppingAspectRatio: 1,
          styles: {
            palette: {
              window: "#ffffff",
              sourceBg: "#f4f4f5",
              windowBorder: "#90a4ae",
              tabIcon: "#667eea",
              inactiveTabIcon: "#90a4ae",
              menuIcons: "#667eea",
              link: "#667eea",
              action: "#667eea",
              inProgress: "#667eea",
              complete: "#10b981",
              error: "#ef4444",
              textDark: "#1a202c",
              textLight: "#ffffff",
            },
          },
        }}
        onSuccess={(result: CloudinaryUploadWidgetResults) => {
          if (hasSecureUrl(result.info)) {
            if (isSingleMode && onUploadSuccess) {
              onUploadSuccess(result.info.secure_url);
            } else if (onUploadSuccessMultiple) {
              const newImages = [...images, result.info.secure_url];
              onUploadSuccessMultiple(newImages);
            }
          }
        }}
        onQueuesEnd={() => {
          setUploading(false);
        }}
        onOpen={() => {
          setUploading(true);
        }}
        onClose={() => {
          setUploading(false);
        }}
        onError={(error) => {
          console.error("Upload error:", error);
          setUploading(false);
        }}
      >
        {({ open }) => (
          <Box>
            {/* Show Avatar for single image mode */}
            {isSingleMode && showPreview ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={currentImage}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "#667eea",
                  }}
                >
                  {!currentImage && <ImageOutlined sx={{ fontSize: 40 }} />}
                </Avatar>
                <Button
                  variant={buttonVariant}
                  onClick={() => open()}
                  disabled={uploading}
                  startIcon={uploading ? <CircularProgress size={16} /> : <ImageOutlined />}
                >
                  {uploading ? "Uploading..." : buttonText || (currentImage ? "Change Photo" : "Upload Photo")}
                </Button>
              </Box>
            ) : (
              <>
                {/* Upload Button */}
                <Button
                  variant={buttonVariant}
                  onClick={() => open()}
                  disabled={uploading || images.length >= maxFiles}
                  startIcon={uploading ? <CircularProgress size={16} /> : <ImageOutlined />}
                  fullWidth={fullWidth}
                  sx={{ mb: showPreview && images.length > 0 ? 2 : 0 }}
                >
                  {uploading
                    ? "Uploading..."
                    : buttonText || (images.length > 0 ? `Add Photos (${images.length}/${maxFiles})` : "Add Photos")}
                </Button>

                {/* Image Previews for multiple mode */}
                {showPreview && images.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {images.map((imageUrl, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: 100,
                          height: 100,
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "2px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Upload ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "white",
                            "&:hover": {
                              bgcolor: "rgba(0,0,0,0.8)",
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
              </>
            )}
          </Box>
        )}
      </CldUploadWidget>
    </Box>
  );
}