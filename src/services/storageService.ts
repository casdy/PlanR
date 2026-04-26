import { supabase } from '../lib/supabase';

/**
 * Service for handling file uploads to Supabase Storage.
 */
export const StorageService = {
    /**
     * Uploads a physique progress photo to the 'physique_photos' bucket.
     * 
     * @param blob The image blob to upload.
     * @param fileName The name of the file (usually includes sessionId).
     * @returns The public URL of the uploaded photo.
     */
    uploadPhysiquePhoto: async (blob: Blob, fileName: string): Promise<string> => {
        // Ensure bucket exists or handled by Supabase admin
        const { data, error } = await supabase.storage
            .from('physique_photos')
            .upload(`${fileName}.jpg`, blob, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            // Fallback for guest/dev: return local object URL
            return URL.createObjectURL(blob);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('physique_photos')
            .getPublicUrl(data.path);

        return publicUrl;
    }
};
