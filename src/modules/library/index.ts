import { LibraryInfo, StyleCategory, StyleInfo } from '../../types';
import { figmaRGBToHex } from '../../utils/colorUtils';
import { logger } from '../logger';

/**
 * Interface for library metadata
 */
interface LibraryMetadata {
  id: string;
  name: string;
}

/**
 * Get all connected libraries and their variables
 * @returns A map of library IDs to library information
 */
export async function getConnectedLibraries(): Promise<Record<string, LibraryInfo>> {
  try {
    // Get local variables first
    const localVariables = await extractLocalVariables();
    
    // Get connected libraries
    // Note: In a real implementation, we would use figma.teamLibrary API
    // But for now, we'll just use local variables and styles
    const teamLibraries: LibraryMetadata[] = [];
    
    // Create a map to store library information
    const libraryMap: Record<string, LibraryInfo> = {};
    
    // Add local variables as a "library"
    if (Object.keys(localVariables).length > 0 || true) { // Always include local library for styles
      libraryMap['local'] = {
        id: 'local',
        name: 'Current File',
        variables: localVariables,
        styles: await extractLocalStyles()
      };
    }
    
    // Process each connected library
    for (const library of teamLibraries) {
      try {
        logger.log(`Processing library: ${library.name}`);
        
        // Extract variables from the library
        const variables = await extractVariablesFromLibrary(library);
        
        // Extract styles from the library
        const styles = await extractStylesFromLibrary(library);
        
        // Add the library to the map if it has variables or styles
        if (Object.keys(variables).length > 0 || Object.keys(styles).length > 0) {
          libraryMap[library.id] = {
            id: library.id,
            name: library.name,
            variables,
            styles
          };
        }
      } catch (error) {
        logger.error(`Error processing library ${library.name}:`, error);
      }
    }
    
    return libraryMap;
  } catch (error) {
    logger.error('Error getting connected libraries:', error);
    return {};
  }
}

/**
 * Extract variables from a library
 * @param library The library to extract variables from
 * @returns A map of variable IDs to variable information
 */
async function extractVariablesFromLibrary(library: LibraryMetadata): Promise<Record<string, any>> {
  try {
    // Get variable collections from the library
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    if (!collections || collections.length === 0) {
      logger.log(`No variable collections found in library: ${library.name}`);
      return {};
    }
    
    // Create a map to store variable information
    const variableMap: Record<string, any> = {};
    
    // Process each collection
    for (const collection of collections) {
      // Get variables in the collection
      const variables = await figma.variables.getLocalVariablesAsync(collection.id);
      
      // Process each variable
      for (const variable of variables) {
        // Get the variable's value in the default mode
        const defaultMode = collection.modes[0]?.modeId;
        
        if (!defaultMode) {
          continue;
        }
        
        const value = variable.valuesByMode[defaultMode];
        
        // Determine the variable's category
        const category = determineVariableCategory(variable);
        
        // Add the variable to the map
        variableMap[variable.id] = {
          id: variable.id,
          name: variable.name,
          value,
          category
        };
      }
    }
    
    return variableMap;
  } catch (error) {
    logger.error(`Error extracting variables from library ${library.name}:`, error);
    return {};
  }
}

/**
 * Extract variables from the current file
 * @returns A map of variable IDs to variable information
 */
async function extractLocalVariables(): Promise<Record<string, any>> {
  try {
    // Get variable collections from the current file
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    if (!collections || collections.length === 0) {
      logger.log('No variable collections found in current file');
      return {};
    }
    
    // Create a map to store variable information
    const variableMap: Record<string, any> = {};
    
    // Process each collection
    for (const collection of collections) {
      // Get variables in the collection
      const variables = await figma.variables.getLocalVariablesAsync(collection.id);
      
      // Process each variable
      for (const variable of variables) {
        // Get the variable's value in the default mode
        const defaultMode = collection.modes[0]?.modeId;
        
        if (!defaultMode) {
          continue;
        }
        
        const value = variable.valuesByMode[defaultMode];
        
        // Determine the variable's category
        const category = determineVariableCategory(variable);
        
        // Add the variable to the map
        variableMap[variable.id] = {
          id: variable.id,
          name: variable.name,
          value,
          category
        };
      }
    }
    
    return variableMap;
  } catch (error) {
    logger.error('Error extracting local variables:', error);
    return {};
  }
}

/**
 * Extract styles from a library
 * @param library The library to extract styles from
 * @returns A map of style IDs to style information
 */
async function extractStylesFromLibrary(library: LibraryMetadata): Promise<Record<string, StyleInfo>> {
  try {
    // Get styles from the library
    const paintStyles = await figma.getLocalPaintStylesAsync();
    const textStyles = await figma.getLocalTextStylesAsync();
    const effectStyles = await figma.getLocalEffectStylesAsync();
    const gridStyles = await figma.getLocalGridStylesAsync();
    
    // Create a map to store style information
    const styleMap: Record<string, StyleInfo> = {};
    
    // Process paint styles (colors, gradients, etc.)
    for (const style of paintStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: style.paints,
        category: StyleCategory.COLOR,
        styleType: 'FILL'
      };
    }
    
    // Process text styles
    for (const style of textStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: {
          fontFamily: style.fontName.family,
          fontStyle: style.fontName.style,
          fontSize: style.fontSize,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
          paragraphSpacing: style.paragraphSpacing,
          textCase: style.textCase,
          textDecoration: style.textDecoration
        },
        category: StyleCategory.TYPOGRAPHY,
        styleType: 'TEXT'
      };
    }
    
    // Process effect styles
    for (const style of effectStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: style.effects,
        category: StyleCategory.OTHER,
        styleType: 'EFFECT'
      };
    }
    
    // Process grid styles
    for (const style of gridStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: style.layoutGrids,
        category: StyleCategory.OTHER,
        styleType: 'GRID'
      };
    }
    
    return styleMap;
  } catch (error) {
    logger.error(`Error extracting styles from library ${library.name}:`, error);
    return {};
  }
}

/**
 * Extract styles from the current file
 * @returns A map of style IDs to style information
 */
async function extractLocalStyles(): Promise<Record<string, StyleInfo>> {
  try {
    // Get styles from the current file
    const paintStyles = await figma.getLocalPaintStylesAsync();
    const textStyles = await figma.getLocalTextStylesAsync();
    const effectStyles = await figma.getLocalEffectStylesAsync();
    const gridStyles = await figma.getLocalGridStylesAsync();
    
    // Create a map to store style information
    const styleMap: Record<string, StyleInfo> = {};
    
    // Process paint styles (colors, gradients, etc.)
    for (const style of paintStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: style.paints,
        category: StyleCategory.COLOR,
        styleType: 'FILL'
      };
    }
    
    // Process text styles
    for (const style of textStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: {
          fontFamily: style.fontName.family,
          fontStyle: style.fontName.style,
          fontSize: style.fontSize,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
          paragraphSpacing: style.paragraphSpacing,
          textCase: style.textCase,
          textDecoration: style.textDecoration
        },
        category: StyleCategory.TYPOGRAPHY,
        styleType: 'TEXT'
      };
    }
    
    // Process effect styles
    for (const style of effectStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: style.effects,
        category: StyleCategory.OTHER,
        styleType: 'EFFECT'
      };
    }
    
    // Process grid styles
    for (const style of gridStyles) {
      styleMap[style.id] = {
        id: style.id,
        name: style.name,
        value: style.layoutGrids,
        category: StyleCategory.OTHER,
        styleType: 'GRID'
      };
    }
    
    return styleMap;
  } catch (error) {
    logger.error('Error extracting local styles:', error);
    return {};
  }
}

/**
 * Determine the category of a variable based on its type
 * @param variable The variable to categorize
 * @returns The variable's category
 */
function determineVariableCategory(variable: Variable): StyleCategory {
  // Check the variable type
  const resolvedType = variable.resolvedType;
  
  if (resolvedType === 'COLOR') {
    return StyleCategory.COLOR;
  } else if (resolvedType === 'FLOAT') {
    // Determine if it's spacing or corner radius based on the variable name
    const lowerName = variable.name.toLowerCase();
    if (lowerName.includes('radius') || lowerName.includes('corner')) {
      return StyleCategory.CORNER_RADIUS;
    } else if (
      lowerName.includes('spacing') || 
      lowerName.includes('margin') || 
      lowerName.includes('padding') || 
      lowerName.includes('gap')
    ) {
      return StyleCategory.SPACING;
    }
    return StyleCategory.OTHER;
  } else {
    return StyleCategory.OTHER;
  }
}

/**
 * Check for conflicts across libraries
 * @param libraries Map of library IDs to library information
 * @returns Map of values to conflicting libraries
 */
export function checkForConflicts(libraries: Record<string, LibraryInfo>): Record<string, string[]> {
  // Create a map to track which libraries contain each value
  const valueMap: Record<string, { libraryId: string; variableId: string }[]> = {};
  
  // Process each library
  for (const libraryId in libraries) {
    const library = libraries[libraryId];
    
    // Process variables in the library
    for (const variableId in library.variables) {
      const variable = library.variables[variableId];
      
      // Skip variables with non-primitive values
      if (typeof variable.value !== 'string' && typeof variable.value !== 'number') {
        continue;
      }
      
      // Convert the value to a string for comparison
      const valueStr = String(variable.value);
      
      // Initialize the array if it doesn't exist
      if (!valueMap[valueStr]) {
        valueMap[valueStr] = [];
      }
      
      // Add the library and variable to the map
      valueMap[valueStr].push({ libraryId, variableId });
    }
    
    // Process styles in the library
    for (const styleId in library.styles) {
      const style = library.styles[styleId];
      
      // For simplicity, we'll use the style name as the value for conflict detection
      // In a real implementation, you might want to compare the actual style values
      const valueStr = style.name;
      
      // Initialize the array if it doesn't exist
      if (!valueMap[valueStr]) {
        valueMap[valueStr] = [];
      }
      
      // Add the library and style to the map
      valueMap[valueStr].push({ libraryId, variableId: styleId });
    }
  }
  
  // Filter out values that are only in one library
  const conflicts: Record<string, string[]> = {};
  
  for (const value in valueMap) {
    if (valueMap[value].length > 1) {
      // Get the library IDs for this value
      conflicts[value] = valueMap[value].map(item => item.libraryId);
    }
  }
  
  return conflicts;
}

export function getVariablesFromLibrary(libraryId: string): Variable[] {
  return figma.variables.getLocalVariables().filter(variable => 
    variable.variableCollectionId === libraryId
  );
} 