import { Theme } from '../dto/theme.enum';

export interface AccessibilityPreferences {
  highContrast: boolean;
  fontSizeMultiplier: number;
}

export interface LocalizationPreferences {
  dateFormat: string;
}

export interface Preferences {
  theme: Theme;
  accessibility: AccessibilityPreferences;
  localization: LocalizationPreferences;
}

// Mirrors the JSONB default declared in schema.prisma - used as the
// fallback base when merging partial preference updates.
export const DEFAULT_PREFERENCES: Preferences = {
  theme: Theme.LIGHT,
  accessibility: {
    highContrast: false,
    fontSizeMultiplier: 1,
  },
  localization: {
    dateFormat: 'DD/MM/YYYY',
  },
};
