import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.8,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        // Create a new file with the correct extension if needed, though browser-image-compression handles it mostly.
        // We'll return the blob as a File object with the proper name/type.
        return new File([compressedFile], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now(),
        });
    } catch (error) {
        console.error('Error compressing image:', error);
        // If compression fails, return original file (fallback)
        return file;
    }
};
