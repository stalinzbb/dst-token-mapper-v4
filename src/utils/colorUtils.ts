import tinycolor from 'tinycolor2';

/**
 * Normalizes a color to a standard hex format
 * @param color The color to normalize
 * @returns Normalized hex color string
 */
export const normalizeHexColor = (color: string): string => {
  return tinycolor(color).toHexString().toLowerCase();
};

/**
 * Converts Figma RGBA color to hex
 * @param color Figma RGBA or RGB color object
 * @returns Hex color string
 */
export const figmaRGBToHex = (color: RGB | RGBA): string => {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  
  // If alpha is present and not 1, we'll use rgba format
  if ('a' in color && color.a < 1) {
    return tinycolor({ r, g, b, a: color.a }).toRgbString().toLowerCase();
  }
  
  return tinycolor({ r, g, b }).toHexString().toLowerCase();
};

/**
 * Extracts color from a paint style
 * @param paint Figma paint style
 * @returns Hex color string or null if not a solid color
 */
export const extractColorFromPaint = (paint: Paint): string | null => {
  if (paint.type === 'SOLID') {
    return figmaRGBToHex(paint.color);
  }
  
  // For now, we only support solid colors
  return null;
};

/**
 * Checks if two colors are exactly the same
 * @param color1 First color
 * @param color2 Second color
 * @returns True if colors match exactly
 */
export const colorsMatch = (color1: string, color2: string): boolean => {
  return normalizeHexColor(color1) === normalizeHexColor(color2);
}; 