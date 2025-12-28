import { createTheme } from '@mui/material/styles';

// Design tokens for the admin module
export const tokens = {
    colors: {
        // Background colors
        bg: {
            primary: '#0a0a0a',
            secondary: '#141414',
            tertiary: '#1a1a1a',
            hover: '#252525',
            elevated: '#1f1f1f',
        },
        // Text colors
        text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
            muted: '#666666',
            disabled: '#444444',
        },
        // Border colors
        border: {
            subtle: '#2a2a2a',
            visible: '#3a3a3a',
            focus: '#f97316',
        },
        // Accent colors (orange theme)
        accent: {
            primary: '#f97316',
            secondary: '#ea580c',
            tertiary: '#c2410c',
            glow: 'rgba(249, 115, 22, 0.1)',
            glowStrong: 'rgba(249, 115, 22, 0.2)',
        },
        // Status colors
        status: {
            success: '#22c55e',
            successBg: 'rgba(34, 197, 94, 0.1)',
            warning: '#eab308',
            warningBg: 'rgba(234, 179, 8, 0.1)',
            error: '#ef4444',
            errorBg: 'rgba(239, 68, 68, 0.1)',
            info: '#3b82f6',
            infoBg: 'rgba(59, 130, 246, 0.1)',
        },
        // Stock status
        stock: {
            inStock: '#22c55e',
            lowStock: '#eab308',
            outOfStock: '#ef4444',
        },
    },
    // Typography
    typography: {
        fontSans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontMono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    },
    // Spacing scale
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
    },
    // Border radius
    radius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },
    // Shadows
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px rgba(0, 0, 0, 0.3)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
        xl: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px rgba(249, 115, 22, 0.3)',
        glowStrong: '0 0 30px rgba(249, 115, 22, 0.4)',
    },
    // Transitions
    transitions: {
        fast: 'all 0.15s ease',
        normal: 'all 0.2s ease',
        slow: 'all 0.3s ease',
    },
};

// MUI Theme configuration
export const adminTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: tokens.colors.accent.primary,
            light: tokens.colors.accent.primary,
            dark: tokens.colors.accent.secondary,
        },
        secondary: {
            main: tokens.colors.text.secondary,
        },
        background: {
            default: tokens.colors.bg.primary,
            paper: tokens.colors.bg.secondary,
        },
        text: {
            primary: tokens.colors.text.primary,
            secondary: tokens.colors.text.secondary,
            disabled: tokens.colors.text.disabled,
        },
        error: {
            main: tokens.colors.status.error,
        },
        warning: {
            main: tokens.colors.status.warning,
        },
        success: {
            main: tokens.colors.status.success,
        },
        info: {
            main: tokens.colors.status.info,
        },
        divider: tokens.colors.border.subtle,
    },
    typography: {
        fontFamily: tokens.typography.fontSans,
        h1: {
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h3: {
            fontSize: '1.25rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        h4: {
            fontSize: '1.125rem',
            fontWeight: 600,
        },
        h5: {
            fontSize: '1rem',
            fontWeight: 600,
        },
        h6: {
            fontSize: '0.875rem',
            fontWeight: 600,
        },
        body1: {
            fontSize: '0.938rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        caption: {
            fontSize: '0.75rem',
            color: tokens.colors.text.muted,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: tokens.colors.bg.primary,
                    color: tokens.colors.text.primary,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: tokens.radius.md,
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '10px 20px',
                    transition: tokens.transitions.fast,
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: tokens.shadows.glow,
                    },
                },
                outlined: {
                    borderColor: tokens.colors.border.visible,
                    '&:hover': {
                        borderColor: tokens.colors.accent.primary,
                        backgroundColor: tokens.colors.accent.glow,
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: tokens.colors.bg.tertiary,
                        borderRadius: tokens.radius.md,
                        '& fieldset': {
                            borderColor: tokens.colors.border.subtle,
                        },
                        '&:hover fieldset': {
                            borderColor: tokens.colors.border.visible,
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: tokens.colors.accent.primary,
                            boxShadow: `0 0 0 3px ${tokens.colors.accent.glow}`,
                        },
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    backgroundColor: tokens.colors.bg.tertiary,
                    borderRadius: tokens.radius.md,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: tokens.colors.bg.secondary,
                    backgroundImage: 'none',
                    borderRadius: tokens.radius.lg,
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: tokens.colors.bg.secondary,
                    backgroundImage: 'none',
                    borderRadius: tokens.radius.lg,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    padding: '24px 28px',
                },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '28px',
                },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '20px 28px',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: tokens.colors.border.subtle,
                    padding: '16px',
                },
                head: {
                    backgroundColor: tokens.colors.bg.tertiary,
                    fontWeight: 600,
                    color: tokens.colors.text.secondary,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: tokens.colors.bg.hover,
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: tokens.radius.sm,
                    fontWeight: 500,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: tokens.radius.md,
                    transition: tokens.transitions.fast,
                    '&:hover': {
                        backgroundColor: tokens.colors.bg.hover,
                    },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: tokens.colors.bg.elevated,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    borderRadius: tokens.radius.sm,
                    fontSize: '0.813rem',
                    padding: '8px 12px',
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: tokens.colors.bg.secondary,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    borderRadius: tokens.radius.md,
                    boxShadow: tokens.shadows.lg,
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    padding: '10px 16px',
                    '&:hover': {
                        backgroundColor: tokens.colors.bg.hover,
                    },
                    '&.Mui-selected': {
                        backgroundColor: tokens.colors.accent.glow,
                        '&:hover': {
                            backgroundColor: tokens.colors.accent.glowStrong,
                        },
                    },
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: tokens.colors.text.muted,
                    '&.Mui-checked': {
                        color: tokens.colors.accent.primary,
                    },
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                root: {
                    '& .MuiSwitch-switchBase.Mui-checked': {
                        color: tokens.colors.accent.primary,
                        '& + .MuiSwitch-track': {
                            backgroundColor: tokens.colors.accent.primary,
                        },
                    },
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    backgroundColor: tokens.colors.bg.tertiary,
                    borderRadius: tokens.radius.full,
                },
                bar: {
                    backgroundColor: tokens.colors.accent.primary,
                    borderRadius: tokens.radius.full,
                },
            },
        },
        MuiSkeleton: {
            styleOverrides: {
                root: {
                    backgroundColor: tokens.colors.bg.tertiary,
                },
            },
        },
    },
});

export default adminTheme;

