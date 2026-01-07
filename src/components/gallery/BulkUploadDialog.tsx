"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Stack,
  IconButton,
  Grid,
  useTheme,
  CircularProgress,
  Tooltip,
  Paper,
  alpha,
  Alert,
  Snackbar,
} from "@mui/material";
import { 
  Close, 
  CloudUpload, 
  Delete, 
  AddPhotoAlternate, 
  CheckCircle, 
  Error as ErrorIcon, 
  Compress,
  Cancel,
  Refresh,
  CloudQueue,
} from "@mui/icons-material";
import Image from "next/image";
import imageCompression from "browser-image-compression";

interface BulkUploadDialogProps {
  open: boolean;
  onClose: () => void;
  albumId: string;
  onUploadComplete: () => void;
}

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'queued' | 'compressing' | 'uploading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  errorMessage?: string;
  // We store the result here after success
  uploadResult?: { url: string; publicId: string };
}

const MAX_IMAGES = 100;
const MAX_FILE_SIZE_MB = 10;

export default function BulkUploadDialog({
  open,
  onClose,
  albumId,
  onUploadComplete,
}: BulkUploadDialogProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<LocalImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [hasFailures, setHasFailures] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const [errorSnackbar, setErrorSnackbar] = useState<string | null>(null);
  const [currentOperation, setCurrentOperation] = useState<string>("");

  const xhrRefs = useRef<Record<string, XMLHttpRequest>>({});
  const cancelAllRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      Object.values(xhrRefs.current).forEach(xhr => xhr.abort());
      selectedFiles.forEach(file => {
        if (file.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processFiles = (files: FileList | File[]) => {
    const filesArray = Array.from(files);
    const remainingSlots = MAX_IMAGES - selectedFiles.length;

    if (filesArray.length > remainingSlots) {
      setLimitWarning(
        `You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}. Maximum limit is ${MAX_IMAGES} images per upload.`
      );
      filesArray.splice(remainingSlots);
    } else {
      setLimitWarning(null);
    }

    const newFiles: LocalImage[] = filesArray.map((file) => {
      const isImage = file.type.startsWith("image/");
      const isTooLarge = file.size > MAX_FILE_SIZE_MB * 1024 * 1024;
      
      let status: LocalImage['status'] = 'queued';
      let errorMessage: string | undefined;

      if (!isImage) {
        status = 'error';
        errorMessage = "Not an image file";
      } else if (isTooLarge) {
        status = 'error';
        errorMessage = `File too large (max ${MAX_FILE_SIZE_MB}MB)`;
      }

      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : "/assets/file-error.png",
        status,
        progress: 0,
        errorMessage,
      };
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processFiles(files);
  };

  const handleRemove = (id: string) => {
    setSelectedFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed && removed.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return filtered;
    });
    setLimitWarning(null);
  };

  const updateFileState = (id: string, updates: Partial<LocalImage>) => {
    setSelectedFiles((prev) => 
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleCancelUpload = (id: string) => {
    if (xhrRefs.current[id]) {
      xhrRefs.current[id].abort();
      delete xhrRefs.current[id];
    }
    updateFileState(id, { status: 'cancelled', progress: 0 });
  };

  const handleCancelAll = () => {
    cancelAllRef.current = true;
    Object.keys(xhrRefs.current).forEach(id => {
      xhrRefs.current[id].abort();
      updateFileState(id, { status: 'cancelled' });
    });
    xhrRefs.current = {};
    setIsProcessing(false);
    setCurrentOperation("Cancelled");
  };

  // ✅ ROBUST XHR UPLOAD FUNCTION
  const uploadToCloudinaryXHR = (file: File, fileId: string): Promise<{ url: string; publicId: string }> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (cancelAllRef.current) {
          return reject(new Error("Cancelled"));
        }

        // 1. COMPRESSION
        updateFileState(fileId, { status: 'compressing', progress: 0 });
        
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg" as const,
        };
        
        let compressedFile;
        try {
          compressedFile = await imageCompression(file, options);
        } catch (err) {
          updateFileState(fileId, { status: 'error', errorMessage: "Compression failed" });
          return reject(err);
        }

        if (cancelAllRef.current) return reject(new Error("Cancelled"));

        // 2. UPLOAD via XHR
        updateFileState(fileId, { status: 'uploading', progress: 0 });

        const formData = new FormData();
        // IMPORTANT: Append with filename to ensure Cloudinary treats it correctly
        formData.append("file", compressedFile, file.name); 
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
        formData.append("folder", "firstfamily/family_albums");

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) throw new Error("Cloudinary config missing");

        const xhr = new XMLHttpRequest();
        xhrRefs.current[fileId] = xhr;
        
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

        // Track Progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            updateFileState(fileId, { progress: percentComplete });
          }
        };

        xhr.onload = () => {
          delete xhrRefs.current[fileId];
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              
              // ✅ CRITICAL FIX: Extract IDs here safely
              const result = {
                url: data.secure_url,
                publicId: data.public_id // Cloudinary returns this directly
              };

              updateFileState(fileId, { 
                status: 'completed', 
                progress: 100, 
                uploadResult: result // Store result in state
              });
              
              resolve(result);
            } catch (parseErr) {
              updateFileState(fileId, { status: 'error', errorMessage: "Invalid response" });
              reject(new Error("Invalid JSON response"));
            }
          } else {
            // Try to get error message from Cloudinary
            let errorMsg = "Upload failed";
            try {
               const errData = JSON.parse(xhr.responseText);
               errorMsg = errData.error?.message || errorMsg;
            } catch(e) {}
            
            updateFileState(fileId, { status: 'error', errorMessage: errorMsg });
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => {
          delete xhrRefs.current[fileId];
          updateFileState(fileId, { status: 'error', errorMessage: "Network error" });
          reject(new Error("Network error"));
        };

        xhr.onabort = () => {
          delete xhrRefs.current[fileId];
          updateFileState(fileId, { status: 'cancelled', progress: 0 });
          reject(new Error("Cancelled"));
        };

        xhr.send(formData);

      } catch (error) {
        updateFileState(fileId, { 
          status: 'error', 
          errorMessage: error instanceof Error ? error.message : "Unknown error" 
        });
        reject(error);
      }
    });
  };

  const handleUploadAll = async () => {
    const pending = selectedFiles.filter(f => f.status !== 'completed' && f.status !== 'error');
    if (pending.length === 0 && selectedFiles.length === 0) {
      setErrorSnackbar("No images to upload");
      return;
    }

    setIsProcessing(true);
    setHasFailures(false);
    cancelAllRef.current = false;

    // We'll collect results here
    const uploadedResults: { url: string; publicId: string }[] = [];
    
    // Also include previously completed items so we don't lose them
    selectedFiles.forEach(f => {
      if (f.status === 'completed' && f.uploadResult) {
        uploadedResults.push(f.uploadResult);
      }
    });

    let successCount = uploadedResults.length;
    let failureCount = 0;
    const total = selectedFiles.length;

    // Reset failed/cancelled for retry
    setSelectedFiles(prev => prev.map(f => 
      f.status === 'error' || f.status === 'cancelled' 
      ? { ...f, status: 'queued', progress: 0, errorMessage: undefined } 
      : f
    ));

    // Sequential Processing
    for (let i = 0; i < total; i++) {
      if (cancelAllRef.current) break;
      
      const item = selectedFiles[i]; // Note: State inside loop is stale, but object ref is stable enough for ID access
      
      // Skip completed
      if (item.status === 'completed') continue; 
      // Skip hard errors (like "invalid file type" marked during selection)
      if (item.errorMessage === "Not an image file") {
          failureCount++;
          continue;
      }

      setCurrentOperation(`Uploading ${i + 1} of ${total}...`);

      try {
        const result = await uploadToCloudinaryXHR(item.file, item.id);
        uploadedResults.push(result);
        successCount++;
      } catch (err) {
        console.error(`Failed: ${item.file.name}`);
        failureCount++;
      }
      
      setGlobalProgress(Math.round(((i + 1) / total) * 100));
    }

    // SAVE TO DB
    if (uploadedResults.length > 0 && !cancelAllRef.current) {
      setCurrentOperation("Saving to album...");
      try {
        const response = await fetch(`/api/albums/${albumId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // ✅ CRITICAL FIX: Send the exact structure the API expects
            images: uploadedResults.map((res) => ({ 
              url: res.url, 
              cloudinaryId: res.publicId, // Use real public_id
              tags: [] 
            })),
          }),
        });

        if (!response.ok) throw new Error("Failed to save to database");

        const result = await response.json();
        onUploadComplete();
        
        if (failureCount === 0) {
          setErrorSnackbar(`Successfully saved ${result.count} images!`);
          setTimeout(() => {
            onClose();
            setSelectedFiles([]);
          }, 1500);
        } else {
          setHasFailures(true);
          setErrorSnackbar(`Saved ${successCount}, but ${failureCount} failed.`);
        }
      } catch (error) {
        console.error("DB Save error", error);
        setHasFailures(true);
        setErrorSnackbar("Images uploaded but failed to save to album.");
      }
    } else if (failureCount > 0) {
      setHasFailures(true);
      setErrorSnackbar(`Uploads failed.`);
    }

    setIsProcessing(false);
    cancelAllRef.current = false;
    setGlobalProgress(0);
    setCurrentOperation("");
  };

  const handleRetryFailed = () => {
    handleUploadAll();
  };

  const isAtLimit = selectedFiles.length >= MAX_IMAGES;
  const completedCount = selectedFiles.filter(f => f.status === 'completed').length;
  const errorCount = selectedFiles.filter(f => f.status === 'error').length;
  const validImagesCount = selectedFiles.length; // Simplified for UI

  return (
    <Dialog 
      open={open} 
      onClose={isProcessing ? undefined : onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Bulk Upload Images</Typography>
            <Typography variant="caption" color="text.secondary">
              Max {MAX_IMAGES} images • Auto-compressed
            </Typography>
          </Box>
          {!isProcessing && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ position: 'relative', p: 0 }}>
        <Box sx={{ p: 3, pb: isProcessing ? 10 : 3 }}>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelect}
            disabled={isAtLimit}
          />

          {!isProcessing && selectedFiles.length === 0 && (
            <Box 
              textAlign="center" 
              py={6}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: "2px dashed",
                borderColor: isDragging ? "primary.main" : "divider",
                bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                borderRadius: 2,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<AddPhotoAlternate />}
                onClick={handleTriggerFileSelect}
                size="large"
              >
                Select Images
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Or drag and drop files here
              </Typography>
            </Box>
          )}

          {selectedFiles.length > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2">
                  {validImagesCount} images ready
                </Typography>
                {!isProcessing && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={handleTriggerFileSelect} disabled={isAtLimit}>Add</Button>
                    <Button size="small" color="error" onClick={() => setSelectedFiles([])}>Clear</Button>
                  </Stack>
                )}
              </Stack>

              <Grid container spacing={2}>
                {selectedFiles.map((item) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
                    <Box sx={{ 
                      position: "relative", 
                      paddingTop: "100%", 
                      borderRadius: 2, 
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: item.status === 'error' ? 'error.main' : 'divider'
                    }}>
                      <Image
                        src={item.previewUrl}
                        alt="Preview"
                        fill
                        style={{ 
                          objectFit: "cover",
                          filter: item.status !== 'queued' && item.status !== 'completed' ? 'brightness(0.5)' : 'none'
                        }}
                      />
                      
                      {/* Status Overlays */}
                      {item.status !== 'queued' && (
                        <Box sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          bgcolor: "rgba(0,0,0,0.4)",
                          color: "white"
                        }}>
                          {item.status === 'compressing' && (
                            <>
                              <Compress sx={{ mb: 1, animation: 'pulse 1s infinite' }} />
                              <Typography variant="caption">Compressing</Typography>
                            </>
                          )}
                          
                          {item.status === 'uploading' && (
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress variant="determinate" value={item.progress} color="inherit" />
                              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="caption" fontWeight="bold">
                                  {`${Math.round(item.progress)}%`}
                                </Typography>
                              </Box>
                              {/* Individual Cancel */}
                              <IconButton 
                                size="small" 
                                onClick={(e) => { e.stopPropagation(); handleCancelUpload(item.id); }}
                                sx={{ position: 'absolute', top: -35, right: -35, color: 'white' }}
                              >
                                <Cancel />
                              </IconButton>
                            </Box>
                          )}

                          {item.status === 'completed' && <CheckCircle color="success" fontSize="large" />}
                          
                          {item.status === 'error' && (
                            <Tooltip title={item.errorMessage || "Error"}>
                              <ErrorIcon color="error" fontSize="large" sx={{ cursor: 'help' }} />
                            </Tooltip>
                          )}

                          {item.status === 'cancelled' && (
                             <Typography variant="caption" sx={{ bgcolor: 'rgba(0,0,0,0.6)', px: 1, borderRadius: 1 }}>
                                Cancelled
                             </Typography>
                          )}
                        </Box>
                      )}

                      {/* Remove Button */}
                      {item.status === 'queued' && !isProcessing && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemove(item.id)}
                          sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.5)", color: "white" }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        {/* Sticky Progress Footer */}
        {isProcessing && (
          <Paper elevation={4} sx={{ position: 'sticky', bottom: 0, p: 2, zIndex: 10, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>{currentOperation}</Typography>
                <Typography variant="body2">{globalProgress}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={globalProgress} />
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                onClick={handleCancelAll}
                fullWidth
                startIcon={<Cancel />}
              >
                Cancel All
              </Button>
            </Stack>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isProcessing}>Close</Button>
        {!isProcessing && (
          <Button 
            variant="contained" 
            onClick={hasFailures ? handleRetryFailed : handleUploadAll}
            startIcon={hasFailures ? <Refresh /> : <CloudUpload />}
            disabled={selectedFiles.length === 0 || (completedCount === validImagesCount && !hasFailures)}
          >
            {hasFailures ? "Retry Failed" : "Upload All"}
          </Button>
        )}
      </DialogActions>

      <Snackbar
        open={!!errorSnackbar}
        autoHideDuration={4000}
        onClose={() => setErrorSnackbar(null)}
        message={errorSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorSnackbar(null)}>
            {errorSnackbar}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}