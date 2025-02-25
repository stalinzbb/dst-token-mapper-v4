import { StyleCategory } from '../../types';
import { colorsMatch, normalizeHexColor } from '../../utils/colorUtils';
import { detectConflicts } from '../library';
/**
 * Finds matches for detached styles in libraries
 * @param detachedStyles Array of detached styles
 * @param libraries Array of libraries
 * @returns Array of match results
 */
export const findMatches = (detachedStyles, libraries) => {
    // Detect conflicts between libraries
    const conflicts = detectConflicts(libraries);
    // Find matches for each detached style
    return detachedStyles.map(detachedStyle => {
        const matches = findMatchesForStyle(detachedStyle, libraries);
        // Check if there are conflicts
        const hasConflict = matches.length > 1 &&
            matches.some(match => {
                const value = typeof match.value === 'string'
                    ? match.value.toLowerCase()
                    : JSON.stringify(match.value);
                return conflicts[value] && conflicts[value].libraryIds.length > 1;
            });
        // Get conflicting libraries
        const conflictingLibraries = hasConflict
            ? [...new Set(matches.map(match => match.libraryName))]
            : undefined;
        return {
            detachedStyle,
            matches,
            hasConflict,
            conflictingLibraries
        };
    });
};
/**
 * Finds matches for a detached style in libraries
 * @param detachedStyle The detached style
 * @param libraries Array of libraries
 * @returns Array of variable matches
 */
const findMatchesForStyle = (detachedStyle, libraries) => {
    const matches = [];
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
const findColorMatches = (detachedStyle, libraries) => {
    const matches = [];
    const detachedColor = normalizeHexColor(detachedStyle.value);
    for (const library of libraries) {
        for (const variableId in library.variables) {
            const variable = library.variables[variableId];
            // Skip non-color variables
            if (variable.category !== StyleCategory.COLOR) {
                continue;
            }
            // Check if colors match
            if (typeof variable.value === 'string' && colorsMatch(variable.value, detachedColor)) {
                matches.push({
                    variableId: variable.id,
                    variableName: variable.name,
                    libraryName: library.name,
                    libraryId: library.id,
                    value: variable.value,
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
const findTypographyMatches = (detachedStyle, libraries) => {
    const matches = [];
    // For now, we'll do a simple string comparison
    // In the future, we could parse the typography values and do more sophisticated matching
    for (const library of libraries) {
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
                    variableId: variable.id,
                    variableName: variable.name,
                    libraryName: library.name,
                    libraryId: library.id,
                    value: variable.value,
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
const findSpacingMatches = (detachedStyle, libraries) => {
    const matches = [];
    // Extract numeric value from spacing (e.g., "16px" -> 16)
    const spacingValue = parseFloat(detachedStyle.value);
    if (isNaN(spacingValue)) {
        return matches;
    }
    for (const library of libraries) {
        for (const variableId in library.variables) {
            const variable = library.variables[variableId];
            // Skip non-spacing variables
            if (variable.category !== StyleCategory.SPACING) {
                continue;
            }
            // Check if spacing values match
            let variableValue;
            if (typeof variable.value === 'number') {
                variableValue = variable.value;
            }
            else if (typeof variable.value === 'string') {
                variableValue = parseFloat(variable.value);
            }
            else {
                continue;
            }
            if (!isNaN(variableValue) && variableValue === spacingValue) {
                matches.push({
                    variableId: variable.id,
                    variableName: variable.name,
                    libraryName: library.name,
                    libraryId: library.id,
                    value: String(variable.value),
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
const findCornerRadiusMatches = (detachedStyle, libraries) => {
    const matches = [];
    // Extract numeric value from corner radius (e.g., "8px" -> 8)
    const radiusValue = parseFloat(detachedStyle.value);
    if (isNaN(radiusValue)) {
        return matches;
    }
    for (const library of libraries) {
        for (const variableId in library.variables) {
            const variable = library.variables[variableId];
            // Skip non-corner radius variables
            if (variable.category !== StyleCategory.CORNER_RADIUS) {
                continue;
            }
            // Check if corner radius values match
            let variableValue;
            if (typeof variable.value === 'number') {
                variableValue = variable.value;
            }
            else if (typeof variable.value === 'string') {
                variableValue = parseFloat(variable.value);
            }
            else {
                continue;
            }
            if (!isNaN(variableValue) && variableValue === radiusValue) {
                matches.push({
                    variableId: variable.id,
                    variableName: variable.name,
                    libraryName: library.name,
                    libraryId: library.id,
                    value: String(variable.value),
                    exactMatch: true
                });
            }
        }
    }
    return matches;
};
