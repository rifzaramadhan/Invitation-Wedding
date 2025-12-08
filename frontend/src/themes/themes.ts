// Theme type definition
export type ThemeId = 'elegant' | 'rustic' | 'minimalist' | 'royal';

export interface ThemeConfig {
    id: ThemeId;
    name: string;
    description: string;
    colors: {
        primary: string;
        primaryLight: string;
        primaryDark: string;
        secondary: string;
        secondaryLight: string;
        accent: string;
        accentLight: string;
        background: string;
        backgroundAlt: string;
        text: string;
        textLight: string;
    };
    fonts: {
        heading: string;
        body: string;
        script: string;
    };
}

// Theme definitions
export const themes: Record<ThemeId, ThemeConfig> = {
    elegant: {
        id: 'elegant',
        name: 'Elegant',
        description: 'Classic rose gold with warm tones',
        colors: {
            primary: '#cc4539',
            primaryLight: '#fdf4f3',
            primaryDark: '#8e3129',
            secondary: '#7c5a4e',
            secondaryLight: '#f8f6f4',
            accent: '#cca01f',
            accentLight: '#fbf9eb',
            background: '#ffffff',
            backgroundAlt: '#fdf4f3',
            text: '#543f39',
            textLight: '#956f5d',
        },
        fonts: {
            heading: 'Playfair Display',
            body: 'Outfit',
            script: 'Great Vibes',
        },
    },
    rustic: {
        id: 'rustic',
        name: 'Rustic',
        description: 'Earthy forest greens with cream',
        colors: {
            primary: '#2d5a3d',
            primaryLight: '#e8f0eb',
            primaryDark: '#1a3624',
            secondary: '#8b7355',
            secondaryLight: '#faf7f2',
            accent: '#a67c52',
            accentLight: '#f5efe8',
            background: '#fffcf7',
            backgroundAlt: '#f5f0e8',
            text: '#3d3226',
            textLight: '#6b5d4d',
        },
        fonts: {
            heading: 'Lora',
            body: 'Open Sans',
            script: 'Dancing Script',
        },
    },
    minimalist: {
        id: 'minimalist',
        name: 'Minimalist',
        description: 'Clean black and white with gold accents',
        colors: {
            primary: '#1a1a1a',
            primaryLight: '#f5f5f5',
            primaryDark: '#000000',
            secondary: '#666666',
            secondaryLight: '#fafafa',
            accent: '#b8860b',
            accentLight: '#fdf8e8',
            background: '#ffffff',
            backgroundAlt: '#f8f8f8',
            text: '#1a1a1a',
            textLight: '#888888',
        },
        fonts: {
            heading: 'Cormorant Garamond',
            body: 'Montserrat',
            script: 'Alex Brush',
        },
    },
    royal: {
        id: 'royal',
        name: 'Royal',
        description: 'Regal deep purple with ivory',
        colors: {
            primary: '#4a1c6b',
            primaryLight: '#f3e8f8',
            primaryDark: '#2d1040',
            secondary: '#6b5b7c',
            secondaryLight: '#f9f7fa',
            accent: '#c9a227',
            accentLight: '#fdf9e8',
            background: '#fffef8',
            backgroundAlt: '#f8f5ff',
            text: '#2d1040',
            textLight: '#7a6b8a',
        },
        fonts: {
            heading: 'Cinzel',
            body: 'Raleway',
            script: 'Pinyon Script',
        },
    },
};

// Get theme by ID with fallback to elegant
export function getTheme(themeId: string | undefined): ThemeConfig {
    if (!themeId || !(themeId in themes)) {
        return themes.royal;
    }
    return themes[themeId as ThemeId];
}

// Get all available themes as array for dropdowns
export function getThemeList(): ThemeConfig[] {
    return Object.values(themes);
}
