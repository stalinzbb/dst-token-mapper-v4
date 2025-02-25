var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { StyleCategory } from '../../types';
import { figmaRGBToHex } from '../../utils/colorUtils';
/**
 * Gets all connected libraries with variables
 * @returns Promise with array of library info
 */
export const getConnectedLibraries = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get all available libraries
        const availableLibraries = yield figma.clientStorage.getAsync('libraries');
        if (!availableLibraries || availableLibraries.length === 0) {
            return {
                libraries: [],
                errorMessage: 'No connected libraries found. Please connect a library with variables.'
            };
        }
        // Get variables from each library
        const libraries = [];
        for (const lib of availableLibraries) {
            const variables = yield extractVariablesFromLibrary(lib.id);
            if (Object.keys(variables).length > 0) {
                libraries.push({
                    id: lib.id,
                    name: lib.name,
                    variables
                });
            }
        }
        if (libraries.length === 0) {
            return {
                libraries: [],
                errorMessage: 'No variables found in connected libraries.'
            };
        }
        return { libraries };
    }
    catch (error) {
        console.error('Error getting connected libraries:', error);
        return {
            libraries: [],
            errorMessage: 'Error accessing connected libraries. Please try again.'
        };
    }
});
/**
 * Extracts variables from a library
 * @param libraryId The ID of the library
 * @returns Object with variables by ID
 */
const extractVariablesFromLibrary = (libraryId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get all variables from the library
        const libraryVariables = yield figma.variables.getLocalVariablesAsync();
        // Filter variables by library ID
        const filteredVariables = libraryVariables.filter(variable => variable.libraryId === libraryId);
        // Process variables
        const variables = {};
        for (const variable of filteredVariables) {
            const variableValue = yield getVariableValue(variable);
            if (variableValue) {
                const category = determineVariableCategory(variable, variableValue);
                variables[variable.id] = {
                    id: variable.id,
                    name: variable.name,
                    value: variableValue,
                    category
                };
            }
        }
        return variables;
    }
    catch (error) {
        console.error('Error extracting variables from library:', error);
        return {};
    }
});
/**
 * Gets the value of a variable
 * @param variable The variable to get the value of
 * @returns The variable value
 */
const getVariableValue = (variable) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the default mode
        const defaultMode = variable.modes[0];
        if (!defaultMode) {
            return null;
        }
        // Get the value for the default mode
        const value = variable.valuesByMode[defaultMode];
        if (typeof value === 'object' && value !== null) {
            // Handle color values
            if ('r' in value && 'g' in value && 'b' in value) {
                return figmaRGBToHex(value);
            }
            // Handle other object values
            return value;
        }
        // Handle primitive values
        return value;
    }
    catch (error) {
        console.error('Error getting variable value:', error);
        return null;
    }
});
/**
 * Determines the category of a variable
 * @param variable The variable
 * @param value The variable value
 * @returns The variable category
 */
const determineVariableCategory = (variable, value) => {
    // Check variable type
    if (variable.resolvedType === 'COLOR') {
        return StyleCategory.COLOR;
    }
    if (variable.resolvedType === 'FLOAT') {
        // Check if it's a spacing or corner radius variable
        if (variable.name.toLowerCase().includes('radius') ||
            variable.name.toLowerCase().includes('corner')) {
            return StyleCategory.CORNER_RADIUS;
        }
        if (variable.name.toLowerCase().includes('spacing') ||
            variable.name.toLowerCase().includes('gap') ||
            variable.name.toLowerCase().includes('padding') ||
            variable.name.toLowerCase().includes('margin')) {
            return StyleCategory.SPACING;
        }
    }
    if (variable.resolvedType === 'STRING' &&
        typeof value === 'string' &&
        (value.includes('px') || value.includes('em') || value.includes('rem'))) {
        // Check if it's a typography variable
        if (variable.name.toLowerCase().includes('font') ||
            variable.name.toLowerCase().includes('text') ||
            variable.name.toLowerCase().includes('typography')) {
            return StyleCategory.TYPOGRAPHY;
        }
    }
    return StyleCategory.OTHER;
};
/**
 * Detects conflicts between libraries
 * @param libraries Array of libraries
 * @returns Object with conflicts by value
 */
export const detectConflicts = (libraries) => {
    const valueMap = {};
    // Build map of values to libraries
    for (const library of libraries) {
        for (const variableId in library.variables) {
            const variable = library.variables[variableId];
            // Skip non-color variables for now
            if (variable.category !== StyleCategory.COLOR) {
                continue;
            }
            const value = typeof variable.value === 'string'
                ? variable.value.toLowerCase()
                : JSON.stringify(variable.value);
            if (!valueMap[value]) {
                valueMap[value] = {
                    libraryIds: [library.id],
                    libraryNames: [library.name],
                    variableIds: [variable.id],
                    variableNames: [variable.name]
                };
            }
            else {
                // Check if this library is already in the list
                if (!valueMap[value].libraryIds.includes(library.id)) {
                    valueMap[value].libraryIds.push(library.id);
                    valueMap[value].libraryNames.push(library.name);
                }
                valueMap[value].variableIds.push(variable.id);
                valueMap[value].variableNames.push(variable.name);
            }
        }
    }
    // Filter to only include conflicts (values in multiple libraries)
    const conflicts = {};
    for (const value in valueMap) {
        if (valueMap[value].libraryIds.length > 1) {
            conflicts[value] = valueMap[value];
        }
    }
    return conflicts;
};
