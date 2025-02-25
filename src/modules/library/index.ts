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
    console.log('Getting connected libraries...');
    
    // Get all variable collections
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    console.log('Found variable collections:', collections.length);
    
    if (collections.length === 0) {
      return {
        libraries: [],
        errorMessage: 'No variable collections found. Please create or connect a library with variables.'
      };
    }
    
    // Get all local variables
    const allVariables = await figma.variables.getLocalVariablesAsync();
    console.log('Found local variables:', allVariables.length);
    
    // Create a library for each collection
    const libraries: LibraryInfo[] = [];
    
    for (const collection of collections) {
      // Filter variables for this collection
      const variables = allVariables.filter(v => v.variableCollectionId === collection.id);
      
      if (variables.length > 0) {
        const processedVariables: {
          [key: string]: {
            id: string;
            name: string;
            value: any;
            category: StyleCategory;
          }
        } = {};
        
        for (const variable of variables) {
          const variableValue = await getVariableValue(variable);
          
          if (variableValue) {
            const category = determineVariableCategory(variable, variableValue);
            
            processedVariables[variable.id] = {
              id: variable.id,
              name: variable.name,
              value: variableValue,
              category
            };
          }
        }
        
        libraries.push({
          id: collection.id,
          name: collection.name,
          variables: processedVariables
        });
      }
    }
    
    if (libraries.length === 0) {
      console.log('No libraries with variables found');
      return {
        libraries: [],
        errorMessage: 'No variables found in connected libraries.'
      };
    }
    
    console.log('Processed libraries:', libraries.length);
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
      variable.variableCollectionId === libraryId
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
    // Get the default mode
    const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    if (!collection || collection.modes.length === 0) {
      return '';
    }
    
    const defaultMode = collection.modes[0];
    const modeId = defaultMode.modeId;
    
    // Get the value for the default mode
    const value = variable.valuesByMode[modeId];
    
    // Handle different variable types
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (value && typeof value === 'object' && 'r' in value) {
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
    variable.variableCollectionId === libraryId
  );
} 