/**
 * Procedural Thumbnail Service
 * Generates deterministic, stylish SVG thumbnails for exercises.
 * Zero-cost, zero-latency, and works offline.
 */
export const thumbnailService = {
  /**
   * Generates a unique color based on the exercise name.
   */
  getColor(name: string, lightness: number = 50): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, ${lightness}%)`;
  },

  /**
   * Generates a data URL for a procedural SVG icon.
   */
  generateSvg(exerciseName: string): string {
    const primaryColor = this.getColor(exerciseName);
    const accentColor = this.getColor(exerciseName + 'accent', 60);
    const name = exerciseName.toLowerCase();
    
    // Determine shape/pattern based on keywords
    let innerGraphic = '';
    
    if (name.includes('leg') || name.includes('squat') || name.includes('deadlift')) {
        // Lower body pattern - bold grounding shapes
        innerGraphic = `
            <rect x="150" y="300" width="212" height="60" rx="10" fill="${primaryColor}" opacity="0.8" />
            <rect x="180" y="240" width="152" height="60" rx="10" fill="${accentColor}" />
            <circle cx="256" cy="180" r="40" fill="${primaryColor}" />
        `;
    } else if (name.includes('push') || name.includes('bench') || name.includes('press')) {
        // Push pattern - upward energy
        innerGraphic = `
            <path d="M156 356 L256 156 L356 356 Z" fill="${primaryColor}" opacity="0.6" />
            <rect x="236" y="256" width="40" height="100" rx="20" fill="${accentColor}" />
            <circle cx="256" cy="120" r="30" fill="${primaryColor}" />
        `;
    } else if (name.includes('pull') || name.includes('row') || name.includes('curl')) {
        // Pull pattern - circular/connected tension
        innerGraphic = `
            <circle cx="256" cy="256" r="100" stroke="${primaryColor}" stroke-width="40" fill="none" />
            <circle cx="256" cy="256" r="40" fill="${accentColor}" />
            <rect x="250" y="100" width="12" height="312" rx="6" fill="${primaryColor}" opacity="0.4" />
        `;
    } else {
        // Default abstract geometric pattern
        innerGraphic = `
            <rect x="120" y="120" width="272" height="272" rx="40" fill="${primaryColor}" opacity="0.2" />
            <circle cx="256" cy="256" r="80" fill="${primaryColor}" />
            <rect x="250" y="180" width="12" height="152" rx="6" fill="${accentColor}" transform="rotate(45 256 256)" />
            <rect x="250" y="180" width="12" height="152" rx="6" fill="${accentColor}" transform="rotate(-45 256 256)" />
        `;
    }

    const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#0f172a" /> <!-- Dark Slate Background -->
        <g opacity="0.8">
            ${innerGraphic}
        </g>
        <!-- Subtle Overlay Gradient -->
        <rect width="512" height="512" fill="url(#grad)" opacity="0.3" />
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:white;stop-opacity:0.1" />
                <stop offset="100%" style="stop-color:black;stop-opacity:0.1" />
            </linearGradient>
        </defs>
    </svg>`.trim();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  },

  /**
   * Generates a high-quality achievement badge SVG.
   */
  generateBadge(label: string): string {
    const primaryColor = '#4f46e5'; // Indigo-600
    const goldColor = '#fde047'; // Yellow-300

    const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <title>${label}</title>
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="10" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>
        <rect width="512" height="512" fill="url(#bgGrad)" rx="80" />
        
        <!-- Badge Shield -->
        <path d="M256 80 L400 140 L400 280 C400 380 256 440 256 440 C256 440 112 380 112 280 L112 140 Z" 
              fill="${primaryColor}" stroke="${goldColor}" stroke-width="8" />
        
        <!-- Sparkles -->
        <circle cx="150" cy="150" r="4" fill="white" opacity="0.6">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="360" cy="300" r="6" fill="${goldColor}" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
        </circle>

        <!-- Trophy Icon -->
        <path d="M216 180 H296 V260 C296 282 278 300 256 300 C234 300 216 282 216 260 V180 Z" fill="${goldColor}" />
        <path d="M196 180 H216 V220 C216 230 208 238 198 238 H196 V180 Z" fill="${goldColor}" opacity="0.8" />
        <path d="M316 180 H296 V220 C296 230 304 238 314 238 H316 V180 Z" fill="${goldColor}" opacity="0.8" />
        <rect x="236" y="300" width="40" height="20" fill="${goldColor}" opacity="0.6" />
        <rect x="216" y="320" width="80" height="10" rx="5" fill="${goldColor}" />

        <!-- Label Placeholder (Minimalist) -->
        <rect x="160" y="360" width="192" height="30" rx="15" fill="white" opacity="0.1" />
        <circle cx="180" cy="375" r="5" fill="${goldColor}" />
        <circle cx="332" cy="375" r="5" fill="${goldColor}" />
    </svg>`.trim();

    // Use encodeURIComponent for SVGs instead of btoa to avoid InvalidCharacterError
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
};
