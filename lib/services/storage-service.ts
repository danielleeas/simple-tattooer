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

// Upload file to Supabase storage
export const uploadFileToStorage = async (
  file: FileUpload,
  bucket: string,
  path?: string
): Promise<UploadResult> => {
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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
      // Read the file as base64
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();
      
      // Convert to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);
      
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
