import React, { useState, useEffect } from 'react';
import { View, Image, Pressable } from 'react-native';
import * as ExpoDocumentPicker from 'expo-document-picker';

// Custom Components
import { Icon } from '@/components/ui/icon';
import { FileText, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { cn, compressImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/contexts';

interface FilePickerProps {
    onFileSelected?: (file: { uri: string; name: string; type: string; size: number }) => void;
    onFileRemoved?: () => void;
    initialFile?: { uri: string; name: string; type: string; size: number } | null;
    aspect?: [number, number];
    quality?: number;
    allowsEditing?: boolean;
    placeholder?: string;
    helperText?: string;
    secondHelperText?: string;
    className?: string;
    error?: boolean;
    maxFileSize?: number; // in bytes, default 10MB
    allowedFileTypes?: string[]; // default all file types
    onValidationError?: (error: string) => void;
    showImagePreview?: boolean; // whether to show image preview for image files
}

export function FilePicker({
    onFileSelected,
    onFileRemoved,
    initialFile = null,
    aspect = [4, 3],
    quality = 0.8,
    allowsEditing = true,
    placeholder = "Select a file",
    helperText,
    secondHelperText,
    error = false,
    className,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedFileTypes = ['*/*'], // Allow all file types by default
    onValidationError,
    showImagePreview = true,
}: FilePickerProps) {
    // Helper function to detect MIME type from URL
    const detectMimeTypeFromUri = (uri: string): string => {
        // Check if it's a URL (http/https) or file URI and try to detect from extension
        if (uri.startsWith('http') || uri.startsWith('https') || uri.startsWith('file://')) {
            const extensionMatch = uri.match(/\.([a-z0-9]+)(?:\?|$)/i);
            if (extensionMatch) {
                const ext = extensionMatch[1].toLowerCase();
                const extToMime: { [key: string]: string } = {
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'bmp': 'image/bmp',
                    'pdf': 'application/pdf',
                };
                return extToMime[ext] || 'application/pdf';
            }
        }
        return 'application/pdf'; // Default fallback
    };

    // Process initialFile to detect type if missing
    const processInitialFile = (initial: typeof initialFile): typeof initialFile => {
        if (!initial || !initial.uri) return initial;

        // If type is missing or generic, try to detect from URI
        if (!initial.type || initial.type === 'application/pdf' || initial.type === 'application/octet-stream') {
            const detectedType = detectMimeTypeFromUri(initial.uri);
            return {
                ...initial,
                type: detectedType,
            };
        }

        return initial;
    };

    const [file, setFile] = useState<{ uri: string; name: string; type: string; size: number } | null>(processInitialFile(initialFile));
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Update file state when initialFile changes
    useEffect(() => {
        setFile(processInitialFile(initialFile));
    }, [initialFile]);

    // Helper function to format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Check if file is an image
    const isImageFile = (mimeType: string): boolean => {
        return mimeType.startsWith('image/');
    };

    // Validation functions
    const validateFile = async (fileData: { uri: string; name: string; type: string; size: number }): Promise<{ isValid: boolean; error?: string }> => {
        try {

            // Check file size only if size is available and greater than 0
            if (fileData.size > 0 && fileData.size > maxFileSize) {
                return {
                    isValid: false,
                    error: `File size (${formatFileSize(fileData.size)}) exceeds the maximum allowed size of ${formatFileSize(maxFileSize)}`
                };
            }

            // Check file type if not allowing all types
            if (!allowedFileTypes.includes('*/*') && !allowedFileTypes.includes(fileData.type)) {
                // For expo-document-picker, sometimes MIME type is not detected properly
                // Let's be more lenient and check file extension as fallback
                const fileExtension = fileData.name.split('.').pop()?.toLowerCase();
                const allowedExtensions = allowedFileTypes.flatMap(type => {
                    if (type === 'image/*') return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
                    if (type === 'text/*') return ['txt', 'md', 'json', 'xml', 'js', 'ts', 'css', 'html'];
                    if (type === 'application/pdf') return ['pdf'];
                    if (type === 'application/msword') return ['doc'];
                    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return ['docx'];
                    return [];
                });

                if (fileExtension && !allowedExtensions.includes(fileExtension)) {
                    return {
                        isValid: false,
                        error: `File type .${fileExtension} is not supported. Allowed types: ${allowedFileTypes.join(', ')}`
                    };
                }
            }

            return { isValid: true };
        } catch (error) {
            console.error('Error validating file:', error);
            return { isValid: false, error: 'Failed to validate file' };
        }
    };

    const handleValidationError = (error: string) => {
        let customMessage = error;

        // Customize error messages for better user experience
        if (error.includes('File type') && error.includes('is not supported')) {
            customMessage = 'Please select a supported file type';
        } else if (error.includes('File size') && error.includes('exceeds the maximum')) {
            customMessage = `File is too large. Maximum size allowed is ${formatFileSize(maxFileSize)}`;
        } else if (error.includes('Failed to validate file')) {
            customMessage = 'Unable to process the selected file. Please try a different file';
        }

        toast({
            title: 'Invalid File',
            description: customMessage,
            variant: 'error',
        });
        onValidationError?.(error);
    };

    const pickFile = async () => {
        setLoading(true);

        try {
            const result = await ExpoDocumentPicker.getDocumentAsync({
                type: allowedFileTypes.includes('*/*') ? '*/*' : allowedFileTypes,
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedFile = result.assets[0];

                // Improve MIME type detection - prioritize extension-based detection for accuracy
                const fileName = selectedFile.name || 'Unknown file';
                const fileExtension = fileName.split('.').pop()?.toLowerCase();

                const extensionToMime: { [key: string]: string } = {
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'bmp': 'image/bmp',
                    'txt': 'text/plain',
                    'md': 'text/markdown',
                    'json': 'application/json',
                    'xml': 'application/xml',
                    'js': 'application/javascript',
                    'ts': 'application/typescript',
                    'css': 'text/css',
                    'html': 'text/html',
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                };

                // Always try to detect from file extension first (more reliable, especially for images)
                let mimeType = 'application/octet-stream';
                if (fileExtension && extensionToMime[fileExtension]) {
                    mimeType = extensionToMime[fileExtension];
                } else if (selectedFile.mimeType && selectedFile.mimeType !== 'application/octet-stream') {
                    // Fall back to picker's MIME type if extension doesn't match
                    mimeType = selectedFile.mimeType;
                } else {
                    mimeType = selectedFile.mimeType || 'application/octet-stream';
                }

                const fileData = {
                    uri: selectedFile.uri,
                    name: fileName,
                    type: mimeType,
                    size: selectedFile.size || 0,
                };


                // Validate the selected file
                const validation = await validateFile(fileData);
                if (!validation.isValid) {
                    handleValidationError(validation.error || 'Invalid file');
                    setLoading(false);
                    return;
                }

                // Compress image if it's an image file
                let finalFileData = fileData;
                const isImage = isImageFile(mimeType);

                if (isImage) {
                    try {
                        const compressedUri = await compressImage(fileData.uri, quality);
                        finalFileData = {
                            ...fileData,
                            uri: compressedUri,
                            type: 'image/jpeg', // Compressed images are converted to JPEG
                            name: (fileExtension === 'jpg' || fileExtension === 'jpeg') ? fileName : fileName.replace(/\.[^.]+$/, '.jpg'), // Update name extension to .jpg
                        };
                    } catch (error) {
                        // If compression fails, ensure we still have the correct image type
                        finalFileData = {
                            ...fileData,
                            type: mimeType, // Keep original image type
                        };
                    }
                } else {
                    console.log('Not an image file:', finalFileData);
                }

                // Ensure file type is set correctly (double check)
                if (!finalFileData.type || finalFileData.type === 'application/octet-stream') {
                    finalFileData.type = mimeType;
                }
                // setFile(finalFileData);
                onFileSelected?.(finalFileData);
            }
        } catch (error) {
            console.error('Error picking file:', error);
            toast({
                title: 'Error',
                description: 'Failed to pick file. Please try again.',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        onFileRemoved?.();
    };

    const renderFilePreview = () => {
        if (!file) return null;
        if (isImageFile(file.type) && showImagePreview) {
            return (
                <View className='w-20 h-20 rounded-full border border-border'>
                    <Image
                        source={{ uri: file.uri }}
                        className='w-full h-full rounded-full'
                        onError={(error) => {
                            console.error('Image load error:', error);
                        }}
                        onLoad={() => {
                            console.log('Image loaded successfully');
                        }}
                    />

                    <Button
                        variant="destructive"
                        size="sm"
                        onPress={removeFile}
                        className='w-5 h-5 p-0 rounded-full absolute top-0.5 right-0.5'
                    >
                        <Icon as={X} size={16} className='text-white' />
                    </Button>
                </View>
            );
        }

        return (
            <View className='w-20 h-20 flex items-center bg-foreground border border-border justify-center rounded-full'>
                <Icon as={FileText} size={36} strokeWidth={1} className='text-background' />
                <Button
                    variant="destructive"
                    size="sm"
                    onPress={removeFile}
                    className='w-5 h-5 p-0 rounded-full absolute top-0.5 right-0.5'
                >
                    <Icon as={X} size={16} className='text-white' />
                </Button>
            </View>
        );
    };

    return (
        <View className={cn("h-48 w-full", className)}>
            {file ? (
                <View className='w-full h-full rounded-xl overflow-hidden relative border border-dashed border-border'>
                    <View className='w-full h-full bg-background flex items-center justify-center'>
                        {renderFilePreview()}
                        <Text className='text-text-secondary text-sm mt-2 text-center px-4 font-medium'>
                            {file.name}
                        </Text>
                    </View>
                </View>
            ) : (
                <Pressable
                    onPress={pickFile}
                    disabled={loading}
                    className='w-full h-full py-4 px-5 border border-dashed border-border rounded-xl items-center justify-center'
                >
                    <View style={{ position: 'relative' }}>
                        <View className='w-20 h-20 flex items-center bg-background-secondary border border-border justify-center rounded-full mb-2'>
                            <Image
                                source={require('@/assets/images/icons/document.png')}
                                style={{ width: 42, height: 42 }}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                    <Text
                        className={cn(error ? "text-destructive" : "text-text-secondary", "text-sm")}
                    >
                        {loading ? 'Selecting...' : placeholder}
                    </Text>
                    {helperText && !file && (
                        <View className="max-w-52 mt-1">
                            <Text
                                variant="muted"
                                className="text-text-secondary text-xs text-center"
                            >
                                {helperText}
                            </Text>
                        </View>
                    )}
                    {secondHelperText && !file && (
                        <View className="max-w-52 mt-1">
                            <Text
                                variant="muted"
                                className="text-text-secondary text-xs text-center"
                            >
                                {secondHelperText}
                            </Text>
                        </View>
                    )}
                </Pressable>
            )}
        </View>
    );
}
