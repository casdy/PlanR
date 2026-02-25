// Use a placeholder or the actual key provided in the environment.
// The Noun Project API typically uses OAuth 1.0a or simply a Key/Secret pair for authorization.
// For browser-based apps, hitting their REST API directly might require a proxy or 
// sending both key and secret base64 encoded as Basic auth if allowed.
// https://api.thenounproject.com/getting_started.html#authentication

import OAuth from 'oauth-1.0a';
import CryptoJS from 'crypto-js';

const API_KEY = import.meta.env.VITE_NOUN_API_KEY || '';
const API_SECRET = import.meta.env.VITE_NOUN_API_SECRET || '';

const BASE_URL = 'https://api.thenounproject.com/v2/icon';
const PROXY_URL = '/api/nounproject/v2/icon';

export interface NounIcon {
  id: string;
  thumbnail_url: string;
  preview_url: string;
  term: string;
}

const oauth = new OAuth({
  consumer: { key: API_KEY, secret: API_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
  },
});

export const fetchExerciseIcon = async (term: string): Promise<string | null> => {
  if (!API_KEY || !API_SECRET) {
    if (import.meta.env.DEV) {
      console.warn("Noun Project API credentials not configured. Using fallback.");
    }
    return null; 
  }

  const queryParams = `?query=${encodeURIComponent(term)}&limit=1`;
  const targetUrl = `${BASE_URL}${queryParams}`;
  const fetchUrl = `${PROXY_URL}${queryParams}`;
  
  const request_data = {
    url: targetUrl,
    method: 'GET',
  };

  const headers = oauth.toHeader(oauth.authorize(request_data)) as unknown as Record<string, string>;

  try {
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Noun Project API Error:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.icons && data.icons.length > 0) {
      return data.icons[0].thumbnail_url || data.icons[0].preview_url;
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Noun Project:', error);
    return null;
  }
};

