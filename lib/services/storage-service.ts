import { supabase } from '../supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FileUpload {
  uri: string;
  name: string;
  type: string;
  size: number;
}

// Shared helpers
export const detectMimeTypeFromUri = (uri: string): string => {
  try {
    const match = uri.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (!match) return 'application/octet-stream';
    const ext = match[1].toLowerCase();
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      pdf: 'application/pdf',
    };
    return map[ext] || 'application/octet-stream';
  } catch {
    return 'application/octet-stream';
  }
};

export const extractNameFromUri = (uri: string, fallback: string): string => {
  try {
    const last = uri.split('/').pop() || fallback;
    return last.split('?')[0] || fallback;
  } catch {
    return fallback;
  }
};

// Upload file to Supabase storage
export const uploadFileToStorage = async (
  file: FileUpload,
  bucket: string,
  path?: string
): Promise<UploadResult> => {
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const sanitizedName = (file.name || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${timestamp}_${rand}_${sanitizedName}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    console.log('Uploading file:', {
      uri: file.uri,
      name: file.name,
      type: file.type,
      size: file.size,
      bucket,
      filePath
    });

    // For React Native, we need to read the file as base64 first
    // Then convert it to a format that Supabase can handle
    try {
      let uint8Array: Uint8Array;
      
      // Check if the URI is a base64 data URI
      if (file.uri.startsWith('data:')) {
        // Handle base64 data URI
        const base64Match = file.uri.match(/^data:([^;]+);base64,(.+)$/);
        if (!base64Match) {
          return {
            success: false,
            error: 'Invalid base64 data URI format'
          };
        }
        
        // Extract the base64 string (without the data URI prefix)
        const base64String = base64Match[2];
        
        // Decode base64 to binary string
        const binaryString = atob(base64String);
        
        // Convert binary string to Uint8Array
        uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
      } else {
        // Handle regular URI (file path, URL, etc.)
        const response = await fetch(file.uri);
        const arrayBuffer = await response.arrayBuffer();
        
        // Convert to Uint8Array
        uint8Array = new Uint8Array(arrayBuffer);
      }
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, uint8Array, {
          contentType: file.type,
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('Storage upload error:', error);
        return {
          success: false,
          error: `Failed to upload file: ${error.message}`
        };
      }

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };
    } catch (uploadError) {
      console.error('Upload process error:', uploadError);
      return {
        success: false,
        error: `Failed to process file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
      };
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Delete file from Supabase storage
export const deleteFileFromStorage = async (
  bucket: string,
  path: string
): Promise<UploadResult> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Extract file path from Supabase storage URL
export const extractFilePathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'storage');
    
    if (bucketIndex === -1 || bucketIndex + 2 >= pathParts.length) {
      return null;
    }
    
    // Return the path after the bucket name
    return pathParts.slice(bucketIndex + 3).join('/');
  } catch (error) {
    console.error('Error extracting file path:', error);
    return null;
  }
};

// Get file info from storage URL
export const getFileInfoFromUrl = (url: string): { bucket: string; path: string } | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'storage');
    
    if (bucketIndex === -1 || bucketIndex + 2 >= pathParts.length) {
      return null;
    }
    
    const bucket = pathParts[bucketIndex + 2];
    const path = pathParts.slice(bucketIndex + 3).join('/');
    
    return { bucket, path };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};
