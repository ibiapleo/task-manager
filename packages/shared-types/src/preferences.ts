import { z } from 'zod';
import { ThemeSchema } from './enums';

export const AccessibilityPreferencesSchema = z.object({
  highContrast: z.boolean(),
  fontSizeMultiplier: z.number().min(0.5).max(3),
});
export type AccessibilityPreferences = z.infer<
  typeof AccessibilityPreferencesSchema
>;

export const AccessibilityPreferencesInputSchema =
  AccessibilityPreferencesSchema.partial();

export const LocalizationPreferencesSchema = z.object({
  dateFormat: z.string().max(20),
});
export type LocalizationPreferences = z.infer<
  typeof LocalizationPreferencesSchema
>;

export const LocalizationPreferencesInputSchema =
  LocalizationPreferencesSchema.partial();

export const PreferencesSchema = z.object({
  theme: ThemeSchema,
  accessibility: AccessibilityPreferencesSchema,
  localization: LocalizationPreferencesSchema,
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const PreferencesInputSchema = z.object({
  theme: ThemeSchema.optional(),
  accessibility: AccessibilityPreferencesInputSchema.optional(),
  localization: LocalizationPreferencesInputSchema.optional(),
});
export type PreferencesInput = z.infer<typeof PreferencesInputSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  accessibility: {
    highContrast: false,
    fontSizeMultiplier: 1,
  },
  localization: {
    dateFormat: 'DD/MM/YYYY',
  },
};
