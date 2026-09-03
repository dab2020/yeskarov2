import { Platform } from 'react-native';

export const colors = {
  brand: '#672844',
  brandDark: '#512036',
  brandSoft: '#F7EEF3',
  ink: '#211B1F',
  muted: '#746B71',
  tertiary: '#9B9097',
  canvas: '#FAF8FA',
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F0F2',
  navSurface: '#E8DCE5',
  border: '#E8E1E5',
  success: '#2F7554',
  successSoft: '#EDF7F2',
  warning: '#A16A28',
  warningSoft: '#FBF4E8',
  danger: '#9E3555',
  dangerSoft: '#FAEDF2',
  info: '#1A67B3',
  infoSoft: '#EAF4FF',
  white: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radii = { sm: 8, md: 12, lg: 16, xl: 23, pill: 999 } as const;
export const fontSizes = { xs: 10, sm: 12, md: 13.5, lg: 17, xl: 21, xxl: 25, hero: 31 } as const;
export const fonts = { regular: 'Poppins_400Regular', medium: 'Poppins_500Medium', semibold: 'Poppins_600SemiBold', extraBold: 'Poppins_800ExtraBold' } as const;
export const shadows = Platform.select({ web: { boxShadow: 'none' } as const, default: { elevation: 0 } });

// Placeholder tokens derived from the product prompt. Replace once final Figma assets are supplied.
export const theme = { colors, spacing, radii, fontSizes, fonts, shadows };
