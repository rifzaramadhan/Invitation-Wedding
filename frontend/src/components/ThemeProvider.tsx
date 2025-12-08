import { createContext, useContext, useEffect, ReactNode } from 'react';
import { ThemeConfig, getTheme, ThemeId } from '../themes/themes';

interface ThemeContextValue {
    theme: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    themeId?: string;
    children: ReactNode;
}

export function ThemeProvider({ themeId, children }: ThemeProviderProps) {
    const theme = getTheme(themeId);

    useEffect(() => {
        // Apply CSS custom properties to root
        const root = document.documentElement;

        root.style.setProperty('--theme-primary', theme.colors.primary);
        root.style.setProperty('--theme-primary-light', theme.colors.primaryLight);
        root.style.setProperty('--theme-primary-dark', theme.colors.primaryDark);
        root.style.setProperty('--theme-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-secondary-light', theme.colors.secondaryLight);
        root.style.setProperty('--theme-accent', theme.colors.accent);
        root.style.setProperty('--theme-accent-light', theme.colors.accentLight);
        root.style.setProperty('--theme-background', theme.colors.background);
        root.style.setProperty('--theme-background-alt', theme.colors.backgroundAlt);
        root.style.setProperty('--theme-text', theme.colors.text);
        root.style.setProperty('--theme-text-light', theme.colors.textLight);

        root.style.setProperty('--font-heading', theme.fonts.heading);
        root.style.setProperty('--font-body', theme.fonts.body);
        root.style.setProperty('--font-script', theme.fonts.script);

        // Set data attribute for CSS targeting
        root.setAttribute('data-theme', theme.id);

        // Cleanup on unmount or theme change
        return () => {
            root.removeAttribute('data-theme');
        };
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Export ThemeId for convenience
export type { ThemeId };
