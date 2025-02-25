import { DetachedStyle, LibraryInfo, MatchResult, StyleCategory, StyleInfo, VariableMatch } from '../../types';
import { colorsMatch, normalizeHexColor } from '../../utils/colorUtils';
import { checkForConflicts } from '../library';

/**
 * Finds matches for detached styles in libraries
 * @param detachedStyles Array of detached styles
 * @param libraries Array of libraries
 * @returns Array of match results
 */
export const findMatches = (
  detachedStyles: DetachedStyle[],
  libraries: LibraryInfo[]
): MatchResult[] => {
  // Convert libraries array to record for checkForConflicts
  const librariesRecord: Record<string, LibraryInfo> = {};
  libraries.forEach(library => {
    librariesRecord[library.id] = library;
  });
  
  // Detect conflicts between libraries
  const conflicts = checkForConflicts(librariesRecord);
  
  // Find matches for each detached style
  return detachedStyles.map(detachedStyle => {
    const matches = findMatchesForStyle(detachedStyle, libraries);
    
    // Check if there are conflicts
    const hasConflict = matches.length > 1 && 
      matches.some(match => {
        const value = typeof match.value === 'string' 
          ? match.value.toLowerCase() 
          : JSON.stringify(match.value);
        
        return conflicts[value] && conflicts[value].length > 1;
      });
    
    return {
      detachedStyleId: detachedStyle.id,
      matches,
      hasConflict
    };
  });
};

/**
 * Finds matches for a detached style in libraries
 * @param detachedStyle The detached style
 * @param libraries Array of libraries
 * @returns Array of variable matches
 */
const findMatchesForStyle = (
  detachedStyle: DetachedStyle,
  libraries: LibraryInfo[]
): VariableMatch[] => {
  const matches: VariableMatch[] = [];
  
  // Find matches based on style category
  switch (detachedStyle.category) {
    case StyleCategory.COLOR:
      matches.push(...findColorMatches(detachedStyle, libraries));
      break;
    case StyleCategory.TYPOGRAPHY:
      matches.push(...findTypographyMatches(detachedStyle, libraries));
      break;
    case StyleCategory.SPACING:
      matches.push(...findSpacingMatches(detachedStyle, libraries));
      break;
    case StyleCategory.CORNER_RADIUS:
      matches.push(...findCornerRadiusMatches(detachedStyle, libraries));
      break;
    default:
      // No matches for other categories
      break;
  }
  
  return matches;
};

/**
 * Finds color matches for a detached style
 * @param detachedStyle The detached style
 * @param libraries Array of libraries
 * @returns Array of variable matches
 */
const findColorMatches = (
  detachedStyle: DetachedStyle,
  libraries: LibraryInfo[]
): VariableMatch[] => {
  const matches: VariableMatch[] = [];
  const detachedColor = normalizeHexColor(detachedStyle.value);
  
  for (const library of libraries) {
    // Check for matching variables
    for (const variableId in library.variables) {
      const variable = library.variables[variableId];
      
      // Skip non-color variables
      if (variable.category !== StyleCategory.COLOR) {
        continue;
      }
      
      // Check if colors match
      if (typeof variable.value === 'string' && colorsMatch(variable.value, detachedColor)) {
        matches.push({
          id: variable.id,
          name: variable.name,
          libraryId: library.id,
          libraryName: library.name,
          value: variable.value,
          variableId: variable.id,
          variableName: variable.name,
          exactMatch: true
        });
      }
    }
    
    // Check for matching styles
    for (const styleId in library.styles) {
      const style = library.styles[styleId];
      
      // Skip non-color styles
      if (style.category !== StyleCategory.COLOR) {
        continue;
      }
      
      // Check if colors match
      if (typeof style.value === 'string' && colorsMatch(style.value, detachedColor)) {
        matches.push({
          id: style.id,
          name: style.name,
          libraryId: library.id,
          libraryName: library.name,
          value: style.value,
          styleId: style.id,
          styleName: style.name,
          exactMatch: true
        });
      }
    }
  }
  
  return matches;
};

/**
 * Finds typography matches for a detached style
 * @param detachedStyle The detached style
 * @param libraries Array of libraries
 * @returns Array of variable matches
 */
const findTypographyMatches = (
  detachedStyle: DetachedStyle,
  libraries: LibraryInfo[]
): VariableMatch[] => {
  const matches: VariableMatch[] = [];
  
  // For now, we'll do a simple string comparison
  // In the future, we could parse the typography values and do more sophisticated matching
  for (const library of libraries) {
    // Check for matching variables
    for (const variableId in library.variables) {
      const variable = library.variables[variableId];
      
      // Skip non-typography variables
      if (variable.category !== StyleCategory.TYPOGRAPHY) {
        continue;
      }
      
      // Check if typography values match
      if (typeof variable.value === 'string' && 
          variable.value.toLowerCase() === detachedStyle.value.toLowerCase()) {
        matches.push({
          id: variable.id,
          name: variable.name,
          libraryId: library.id,
          libraryName: library.name,
          value: variable.value,
          variableId: variable.id,
          variableName: variable.name,
          exactMatch: true
        });
      }
    }
    
    // Check for matching styles
    for (const styleId in library.styles) {
      const style = library.styles[styleId];
      
      // Skip non-typography styles
      if (style.category !== StyleCategory.TYPOGRAPHY) {
        continue;
      }
      
      // Check if typography values match
      if (typeof style.value === 'string' && 
          style.value.toLowerCase() === detachedStyle.value.toLowerCase()) {
        matches.push({
          id: style.id,
          name: style.name,
          libraryId: library.id,
          libraryName: library.name,
          value: style.value,
          styleId: style.id,
          styleName: style.name,
          exactMatch: true
        });
      }
    }
  }
  
  return matches;
};

/**
 * Finds spacing matches for a detached style
 * @param detachedStyle The detached style
 * @param libraries Array of libraries
 * @returns Array of variable matches
 */
const findSpacingMatches = (
  detachedStyle: DetachedStyle,
  libraries: LibraryInfo[]
): VariableMatch[] => {
  const matches: VariableMatch[] = [];
  
  // Extract numeric value from spacing (e.g., "16px" -> 16)
  const spacingValue = parseFloat(detachedStyle.value);
  
  if (isNaN(spacingValue)) {
    return matches;
  }
  
  for (const library of libraries) {
    // Check for matching variables
    for (const variableId in library.variables) {
      const variable = library.variables[variableId];
      
      // Skip non-spacing variables
      if (variable.category !== StyleCategory.SPACING) {
        continue;
      }
      
      // Check if spacing values match
      let variableValue: number;
      
      if (typeof variable.value === 'number') {
        variableValue = variable.value;
      } else if (typeof variable.value === 'string') {
        variableValue = parseFloat(variable.value);
      } else {
        continue;
      }
      
      if (!isNaN(variableValue) && variableValue === spacingValue) {
        matches.push({
          id: variable.id,
          name: variable.name,
          libraryId: library.id,
          libraryName: library.name,
          value: String(variable.value),
          variableId: variable.id,
          variableName: variable.name,
          exactMatch: true
        });
      }
    }
    
    // Check for matching styles
    for (const styleId in library.styles) {
      const style = library.styles[styleId];
      
      // Skip non-spacing styles
      if (style.category !== StyleCategory.SPACING) {
        continue;
      }
      
      // Check if spacing values match
      let styleValue: number;
      
      if (typeof style.value === 'number') {
        styleValue = style.value;
      } else if (typeof style.value === 'string') {
        styleValue = parseFloat(style.value);
      } else {
        continue;
      }
      
      if (!isNaN(styleValue) && styleValue === spacingValue) {
        matches.push({
          id: style.id,
          name: style.name,
          libraryId: library.id,
          libraryName: library.name,
          value: String(style.value),
          styleId: style.id,
          styleName: style.name,
          exactMatch: true
        });
      }
    }
  }
  
  return matches;
};

/**
 * Finds corner radius matches for a detached style
 * @param detachedStyle The detached style
 * @param libraries Array of libraries
 * @returns Array of variable matches
 */
const findCornerRadiusMatches = (
  detachedStyle: DetachedStyle,
  libraries: LibraryInfo[]
): VariableMatch[] => {
  const matches: VariableMatch[] = [];
  
  // Extract numeric value from corner radius (e.g., "8px" -> 8)
  const radiusValue = parseFloat(detachedStyle.value);
  
  if (isNaN(radiusValue)) {
    return matches;
  }
  
  for (const library of libraries) {
    // Check for matching variables
    for (const variableId in library.variables) {
      const variable = library.variables[variableId];
      
      // Skip non-corner radius variables
      if (variable.category !== StyleCategory.CORNER_RADIUS) {
        continue;
      }
      
      // Check if corner radius values match
      let variableValue: number;
      
      if (typeof variable.value === 'number') {
        variableValue = variable.value;
      } else if (typeof variable.value === 'string') {
        variableValue = parseFloat(variable.value);
      } else {
        continue;
      }
      
      if (!isNaN(variableValue) && variableValue === radiusValue) {
        matches.push({
          id: variable.id,
          name: variable.name,
          libraryId: library.id,
          libraryName: library.name,
          value: String(variable.value),
          variableId: variable.id,
          variableName: variable.name,
          exactMatch: true
        });
      }
    }
    
    // Check for matching styles
    for (const styleId in library.styles) {
      const style = library.styles[styleId];
      
      // Skip non-corner radius styles
      if (style.category !== StyleCategory.CORNER_RADIUS) {
        continue;
      }
      
      // Check if corner radius values match
      let styleValue: number;
      
      if (typeof style.value === 'number') {
        styleValue = style.value;
      } else if (typeof style.value === 'string') {
        styleValue = parseFloat(style.value);
      } else {
        continue;
      }
      
      if (!isNaN(styleValue) && styleValue === radiusValue) {
        matches.push({
          id: style.id,
          name: style.name,
          libraryId: library.id,
          libraryName: library.name,
          value: String(style.value),
          styleId: style.id,
          styleName: style.name,
          exactMatch: true
        });
      }
    }
  }
  
  return matches;
}; 