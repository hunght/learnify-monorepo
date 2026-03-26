/**
 * LearnifyTube Mobile Theme Colors
 * Matches the electron app's dark mode color scheme
 */

export const colors = {
  // Core backgrounds
  background: "#0A0F1A", // Main app background
  card: "#151B28", // Card/surface background
  cardHover: "#1C2333", // Card hover state
  muted: "#242C3D", // Muted/secondary surfaces

  // Text colors
  foreground: "#F8FAFC", // Primary text (near white)
  mutedForeground: "#ADB5C4", // Secondary text
  textTertiary: "#8B95A8", // Tertiary/placeholder text

  // Brand colors
  primary: "#60A5FA", // Primary blue (bright for dark mode)
  primaryForeground: "#0A0F1A", // Text on primary
  accent: "#12D594", // Accent green
  accentForeground: "#0A0F1A", // Text on accent

  // Semantic colors
  success: "#12D594", // Success green
  successForeground: "#0A0F1A",
  warning: "#F7AC22", // Warning orange
  warningForeground: "#0A0F1A",
  destructive: "#F87171", // Error/destructive red
  destructiveForeground: "#FFFFFF",

  // UI elements
  border: "#323B4E", // Border color
  input: "#323B4E", // Input border
  ring: "#60A5FA", // Focus ring

  // Status colors
  downloading: "#F7AC22", // Yellow for downloading
  queued: "#60A5FA", // Blue for queued
  completed: "#12D594", // Green for completed
  failed: "#F87171", // Red for failed
  pending: "#6B7280", // Gray for pending

  // Overlay colors
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.5)",

  // Placeholder avatar colors (for channels without thumbnails)
  avatarColors: [
    "#818CF8", // indigo
    "#A78BFA", // violet
    "#C084FC", // purple
    "#F472B6", // pink
    "#FB7185", // rose
    "#F87171", // red
    "#FB923C", // orange
    "#FBBF24", // yellow
    "#34D399", // green
    "#2DD4BF", // teal
    "#22D3EE", // cyan
    "#60A5FA", // blue
  ],
} as const;

// Spacing scale (matches electron app)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

// Border radius
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Font sizes
export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
} as const;

// Font weights
export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

// Helper to get a deterministic placeholder color based on string
export function getPlaceholderColor(text: string): string {
  const index =
    text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.avatarColors.length;
  return colors.avatarColors[index];
}
