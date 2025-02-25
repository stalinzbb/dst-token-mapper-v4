import { LibraryInfo, StyleCategory } from '../../types';
import { figmaRGBToHex } from '../../utils/colorUtils';

/**
 * Gets all connected libraries with variables
 * @returns Promise with array of library info
 */
export const getConnectedLibraries = async (): Promise<{
  libraries: LibraryInfo[];
  errorMessage?: string;
}> => {
  try {
    // Get all available libraries
    const availableLibraries = await figma.clientStorage.getAsync('libraries') as any[];
    
    if (!availableLibraries || availableLibraries.length === 0) {
      return {
        libraries: [],
        errorMessage: 'No connected libraries found. Please connect a library with variables.'
      };
    }
    
    // Get variables from each library
    const libraries: LibraryInfo[] = [];
    
    for (const lib of availableLibraries) {
      const variables = await extractVariablesFromLibrary(lib.id);
      
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
  } catch (error) {
    console.error('Error getting connected libraries:', error);
    return {
      libraries: [],
      errorMessage: 'Error accessing connected libraries. Please try again.'
    };
  }
};

/**
 * Extracts variables from a library
 * @param libraryId The ID of the library
 * @returns Object with variables by ID
 */
const extractVariablesFromLibrary = async (libraryId: string): Promise<{
  [key: string]: {
    id: string;
    name: string;
    value: any;
    category: StyleCategory;
  }
}> => {
  try {
    // Get all variables from the library
    const libraryVariables = await figma.variables.getLocalVariablesAsync();
    
    // Filter variables by library ID
    const filteredVariables = libraryVariables.filter(variable => 
      variable.libraryId === libraryId
    );
    
    // Process variables
    const variables: {
      [key: string]: {
        id: string;
        name: string;
        value: any;
        category: StyleCategory;
      }
    } = {};
    
    for (const variable of filteredVariables) {
      const variableValue = await getVariableValue(variable);
      
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
  } catch (error) {
    console.error('Error extracting variables from library:', error);
    return {};
  }
};

/**
 * Gets the value of a variable
 * @param variable The variable to get the value of
 * @returns The variable value
 */
const getVariableValue = async (variable: Variable): Promise<any> => {
  try {
    // @ts-ignore - modes is available but not in typings
    const defaultMode = variable.modes[0];
    const modeId = defaultMode.modeId;
    const value = variable.valuesByMode[modeId];
    
    // Handle different variable types
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (value && 'r' in value) {
      // Color value
      const color = value as RGBA;
      return figmaRGBToHex(color);
    }
    
    return '';
  } catch (error) {
    console.error('Error getting variable value:', error);
    return '';
  }
};

/**
 * Determines the category of a variable
 * @param variable The variable
 * @param value The variable value
 * @returns The variable category
 */
const determineVariableCategory = (variable: Variable, value: any): StyleCategory => {
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
export const detectConflicts = (libraries: LibraryInfo[]): {
  [value: string]: {
    libraryIds: string[];
    libraryNames: string[];
    variableIds: string[];
    variableNames: string[];
  }
} => {
  const valueMap: {
    [value: string]: {
      libraryIds: string[];
      libraryNames: string[];
      variableIds: string[];
      variableNames: string[];
    }
  } = {};
  
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
      } else {
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
  const conflicts: {
    [value: string]: {
      libraryIds: string[];
      libraryNames: string[];
      variableIds: string[];
      variableNames: string[];
    }
  } = {};
  
  for (const value in valueMap) {
    if (valueMap[value].libraryIds.length > 1) {
      conflicts[value] = valueMap[value];
    }
  }
  
  return conflicts;
};

export function getVariablesFromLibrary(libraryId: string): Variable[] {
  return figma.variables.getLocalVariables().filter(variable => 
    // @ts-ignore - libraryId is available but not in typings
    variable.libraryId === libraryId
  );
}

export function findConflictingLibraries(valueMap: ValueLibraryMap): ConflictMap {
  const conflicts: ConflictMap = {};
  
  Object.keys(valueMap).forEach(value => {
    if (valueMap[value].libraryIds.length > 1) {
      const libraries = figma.variables.getLocalVariables()
        .filter(variable => {
          // @ts-ignore - libraryId is available but not in typings
          return Array.from(valueMap[value].libraryIds).includes(variable.libraryId);
        })
        .map(variable => {
          // @ts-ignore - libraryId is available but not in typings
          return getLibraryById(variable.libraryId);
        })
        .filter((library): library is Library => library !== null);
      
      conflicts[value] = libraries;
    }
  });
  
  return conflicts;
} 