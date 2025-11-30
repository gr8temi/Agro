const palette = {
  primary: '#2E7D32', // Deep Green
  secondary: '#FBC02D', // Gold/Yellow
  error: '#D32F2F', // Red
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F5F5F5',
  gray200: '#E0E0E0',
  gray300: '#BDBDBD',
  gray800: '#424242',
  gray900: '#212121',
  darkBackground: '#121212',
  darkSurface: '#1E1E1E',
};

const typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
  },
};

const spacing = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

const borderRadius = {
  s: 4,
  m: 8,
  l: 12,
};

export const lightTheme = {
  dark: false,
  colors: {
    primary: palette.primary,
    secondary: palette.secondary,
    background: palette.gray100,
    surface: palette.white,
    text: palette.gray900,
    textSecondary: '#757575',
    error: palette.error,
    border: palette.gray200,
    icon: palette.gray900,
  },
  spacing,
  borderRadius,
  typography: {
    ...typography,
    h1: { ...typography.h1, color: palette.gray900 },
    h2: { ...typography.h2, color: palette.gray900 },
    h3: { ...typography.h3, color: palette.gray900 },
    body: { ...typography.body, color: palette.gray900 },
    button: { ...typography.button, color: palette.white },
  },
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: '#4CAF50', // Lighter Green for Dark Mode
    secondary: '#FFD54F', // Lighter Yellow for Dark Mode
    background: palette.darkBackground,
    surface: palette.darkSurface,
    text: '#E0E0E0',
    textSecondary: '#B0B0B0',
    error: '#EF5350', // Lighter Red
    border: '#333333',
    icon: '#E0E0E0',
  },
  spacing,
  borderRadius,
  typography: {
    ...typography,
    h1: { ...typography.h1, color: '#E0E0E0' },
    h2: { ...typography.h2, color: '#E0E0E0' },
    h3: { ...typography.h3, color: '#E0E0E0' },
    body: { ...typography.body, color: '#E0E0E0' },
    button: { ...typography.button, color: palette.black },
  },
};

// Backwards compatibility (default to light)
export const theme = lightTheme;
