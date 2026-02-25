export interface ExerciseDBItem {
    id: string;
    bodyPart: string;
    equipment: string;
    gifUrl: string;
    name: string;
    target: string;
    secondaryMuscles: string[];
    instructions: string[];
    videoUrl?: string; // v2 support
    overview?: string;
    exerciseTips?: string[];
    variations?: string[];
}

const RAPID_API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
if (!RAPID_API_KEY) {
    console.warn("VITE_RAPIDAPI_KEY is not defined in the environment variables.");
}

const BASE_URL = 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises';

const formatMediaUrl = (url: string, type: 'image' | 'video'): string => {
    if (!url) return '';
    
    // Route established CDNs directly through the Vite proxy to avoid CORS/COEP blocking
    if (url.startsWith('https://cdn.exercisedb.dev')) {
        return url.replace('https://cdn.exercisedb.dev', '/api/cdn-proxy');
    }
    
    if (url.startsWith('http')) return url;
    
    // AscendAPI relative URLs need to be proxied to attach the required X-RapidAPI-Key headers
    return `/api/exercisedb/media/${type}s/${url}`;
};

// Helper to map AscendAPI v2 response to our expected interface
const mapV2Item = (item: any): ExerciseDBItem => ({
    id: item.exerciseId || item.id,
    name: item.name,
    bodyPart: (item.bodyParts && item.bodyParts.length > 0) ? item.bodyParts[0] : (item.bodyPart || ''),
    equipment: (item.equipments && item.equipments.length > 0) ? item.equipments[0] : (item.equipment || ''),
    target: (item.targetMuscles && item.targetMuscles.length > 0) ? item.targetMuscles[0] : (item.target || ''),
    secondaryMuscles: item.secondaryMuscles || [],
    gifUrl: formatMediaUrl(item.imageUrl || item.gifUrl || item.videoUrl, 'image'),
    instructions: item.instructions || [],
    videoUrl: formatMediaUrl(item.videoUrl, 'video'),
    overview: item.overview || '',
    exerciseTips: item.exerciseTips || [],
    variations: item.variations || []
});

// In-memory cache to prevent redundant API calls during the same session
const exerciseCache = {
    bodyPart: {} as Record<string, ExerciseDBItem[]>,
    target: {} as Record<string, ExerciseDBItem[]>
};

export const getExercisesByTarget = async (target: string): Promise<ExerciseDBItem[]> => {
    if (exerciseCache.target[target]) {
        return exerciseCache.target[target];
    }

    // AscendAPI v2 uses query parameters
    const url = `${BASE_URL}?limit=40&target=${encodeURIComponent(target)}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY || '',
                'X-RapidAPI-Host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('ExerciseDB error by target:', response.status, errorData);
            throw new Error(`Failed to fetch exercises by target: ${response.status}`);
        }

        const json = await response.json();
        // Handle both v1 (array) and v2 ({ data: array }) structures just in case
        const dataArray = Array.isArray(json) ? json : (json.data || []);
        const results = dataArray.map(mapV2Item);
        
        // Cache and return
        exerciseCache.target[target] = results;
        return results;
    } catch (error) {
        console.error('Error fetching exercises from ExerciseDB by target:', error);
        throw error;
    }
};

export const getExercisesByBodyPart = async (bodyPart: string, shuffle = true): Promise<ExerciseDBItem[]> => {
    let results: ExerciseDBItem[] = [];
    if (exerciseCache.bodyPart[bodyPart]) {
        results = [...exerciseCache.bodyPart[bodyPart]];
    } else {
        // AscendAPI v2 uses query parameters
        const url = `${BASE_URL}?limit=40&bodyPart=${encodeURIComponent(bodyPart)}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY || '',
                    'X-RapidAPI-Host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('ExerciseDB error by bodyPart:', response.status, errorData);
                throw new Error(`Failed to fetch exercises by bodyPart: ${response.status}`);
            }

            const json = await response.json();
            const dataArray = Array.isArray(json) ? json : (json.data || []);
            results = dataArray.map(mapV2Item);
            
            // Cache original results
            exerciseCache.bodyPart[bodyPart] = results;
        } catch (error) {
            console.error('Error fetching exercises from ExerciseDB by bodyPart:', error);
            throw error;
        }
    }
    
    // Shuffle the results if requested to provide varied daily suggestions
    if (shuffle && results.length > 0) {
        results = [...results].sort(() => 0.5 - Math.random());
    }
    
    return results;
};

// V2 Specific: Fetch detailed exercise info (which includes video and instructions)
export const getExerciseDetails = async (id: string): Promise<ExerciseDBItem> => {
    const url = `${BASE_URL}/${encodeURIComponent(id)}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY || '',
                'X-RapidAPI-Host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch exercise details: ${response.status}`);
        }

        const json = await response.json();
        const item = json.data ? json.data : json;
        return mapV2Item(item);
    } catch (error) {
        console.error('Error fetching exercise details:', error);
        throw error;
    }
};

// Fetch by name since frontend uses localized UUIDs in workout plans
export const getExerciseByName = async (name: string): Promise<ExerciseDBItem | null> => {
    // AscendAPI uses name query parameter.
    const url = `${BASE_URL}?limit=10&name=${encodeURIComponent(name.toLowerCase())}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY || '',
                'X-RapidAPI-Host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch exercise by name: ${response.status}`);
        }

        const json = await response.json();
        const dataArray = Array.isArray(json) ? json : (json.data || []);
        
        if (dataArray.length > 0) {
            // Find an exact match if possible, otherwise take the first
            const exactMatch = dataArray.find((item: any) => item.name?.toLowerCase() === name.toLowerCase()) || dataArray[0];
            const apiId = exactMatch.exerciseId || exactMatch.id;
            
            // To get instructions and video, we MUST fetch by ID individually.
            if (apiId) {
                return await getExerciseDetails(apiId);
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching exercise by name:', error);
        return null; // Return null on failure instead of throwing to prevent crashing the ActiveOverlay
    }
};
