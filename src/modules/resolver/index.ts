import { DetachedStyle, StyleCategory } from '../../types';
import { logger } from '../logger';

/**
 * Applies variable or style fixes to detached styles
 * @param fixes Array of fixes to apply
 * @param detachedStyles Map of detached styles by ID
 * @returns Object with success status and message
 */
export const applyFixes = async (
  fixes: Array<{ detachedStyleId: string, variableId?: string, styleId?: string, isStyle?: boolean }>,
  detachedStyles: Map<string, DetachedStyle>
): Promise<{
  success: boolean;
  message: string;
  appliedCount: number;
  errorCount: number;
}> => {
  let appliedCount = 0;
  let errorCount = 0;
  
  for (const fix of fixes) {
    const detachedStyle = detachedStyles.get(fix.detachedStyleId);
    
    if (!detachedStyle) {
      logger.error(`Detached style not found: ${fix.detachedStyleId}`);
      errorCount++;
      continue;
    }
    
    try {
      let success = false;
      
      if (fix.isStyle && fix.styleId) {
        // Apply style
        success = await applyStyleToNode(detachedStyle, fix.styleId);
      } else if (fix.variableId) {
        // Apply variable
        success = await applyVariableToNode(detachedStyle, fix.variableId);
      } else {
        logger.error(`Invalid fix: missing both variableId and styleId`);
        errorCount++;
        continue;
      }
      
      if (success) {
        appliedCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      logger.error(`Error applying fix: ${error}`);
      errorCount++;
    }
  }
  
  if (errorCount === 0) {
    return {
      success: true,
      message: `Successfully applied ${appliedCount} fixes.`,
      appliedCount,
      errorCount
    };
  } else {
    return {
      success: appliedCount > 0,
      message: `Applied ${appliedCount} fixes with ${errorCount} errors.`,
      appliedCount,
      errorCount
    };
  }
};

/**
 * Applies a variable to a node
 * @param detachedStyle The detached style to fix
 * @param variableId The ID of the variable to apply
 * @returns Promise resolving to success status
 */
const applyVariableToNode = async (
  detachedStyle: DetachedStyle,
  variableId: string
): Promise<boolean> => {
  try {
    // Get the node
    const node = figma.getNodeById(detachedStyle.nodeId);
    
    if (!node) {
      logger.error(`Node not found: ${detachedStyle.nodeId}`);
      return false;
    }
    
    // Apply the variable based on the style category
    switch (detachedStyle.category) {
      case StyleCategory.COLOR:
        return applyColorVariable(node, detachedStyle, variableId);
      case StyleCategory.TYPOGRAPHY:
        return applyTypographyVariable(node, detachedStyle, variableId);
      case StyleCategory.SPACING:
        return applySpacingVariable(node, detachedStyle, variableId);
      case StyleCategory.CORNER_RADIUS:
        return applyCornerRadiusVariable(node, detachedStyle, variableId);
      default:
        logger.error(`Unsupported style category: ${detachedStyle.category}`);
        return false;
    }
  } catch (error) {
    logger.error(`Error applying variable: ${error}`);
    return false;
  }
};

/**
 * Applies a style to a node
 * @param detachedStyle The detached style to fix
 * @param styleId The ID of the style to apply
 * @returns Promise resolving to success status
 */
const applyStyleToNode = async (
  detachedStyle: DetachedStyle,
  styleId: string
): Promise<boolean> => {
  try {
    // Get the node
    const node = figma.getNodeById(detachedStyle.nodeId);
    
    if (!node) {
      logger.error(`Node not found: ${detachedStyle.nodeId}`);
      return false;
    }
    
    // Apply the style based on the style category
    switch (detachedStyle.category) {
      case StyleCategory.COLOR:
        return applyColorStyle(node, detachedStyle, styleId);
      case StyleCategory.TYPOGRAPHY:
        return applyTypographyStyle(node, detachedStyle, styleId);
      case StyleCategory.SPACING:
        // Styles don't apply to spacing directly, use variables instead
        logger.error(`Cannot apply style to spacing property`);
        return false;
      case StyleCategory.CORNER_RADIUS:
        // Styles don't apply to corner radius directly, use variables instead
        logger.error(`Cannot apply style to corner radius property`);
        return false;
      default:
        logger.error(`Unsupported style category: ${detachedStyle.category}`);
        return false;
    }
  } catch (error) {
    logger.error(`Error applying style: ${error}`);
    return false;
  }
};

/**
 * Applies a color variable to a node
 * @param node The node to apply to
 * @param detachedStyle The detached style
 * @param variableId The variable ID
 * @returns Success status
 */
const applyColorVariable = (
  node: BaseNode,
  detachedStyle: DetachedStyle,
  variableId: string
): boolean => {
  try {
    if (!('fills' in node)) {
      return false;
    }
    
    // Parse the property name to get the fill index
    const match = detachedStyle.propertyName.match(/fill\[(\d+)\]/);
    
    if (!match) {
      return false;
    }
    
    const fillIndex = parseInt(match[1], 10);
    
    if (isNaN(fillIndex) || fillIndex < 0 || fillIndex >= node.fills.length) {
      return false;
    }
    
    // Create a variable binding
    const binding = {
      type: 'VARIABLE',
      id: variableId
    } as VariableBinding;
    
    // Apply the variable to the fill
    const fills = [...node.fills];
    fills[fillIndex] = {
      ...fills[fillIndex],
      boundVariables: {
        color: binding
      }
    };
    
    node.fills = fills;
    
    return true;
  } catch (error) {
    logger.error(`Error applying color variable: ${error}`);
    return false;
  }
};

/**
 * Applies a color style to a node
 * @param node The node to apply to
 * @param detachedStyle The detached style
 * @param styleId The style ID
 * @returns Success status
 */
const applyColorStyle = (
  node: BaseNode,
  detachedStyle: DetachedStyle,
  styleId: string
): boolean => {
  try {
    // Check if the property name indicates a fill or stroke
    if (detachedStyle.propertyName.startsWith('fill')) {
      if (!('fillStyleId' in node)) {
        return false;
      }
      
      // Apply the fill style
      node.fillStyleId = styleId;
      return true;
    } else if (detachedStyle.propertyName.startsWith('stroke')) {
      if (!('strokeStyleId' in node)) {
        return false;
      }
      
      // Apply the stroke style
      node.strokeStyleId = styleId;
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Error applying color style: ${error}`);
    return false;
  }
};

/**
 * Applies a typography variable to a node
 * @param node The node to apply to
 * @param detachedStyle The detached style
 * @param variableId The variable ID
 * @returns Success status
 */
const applyTypographyVariable = (
  node: BaseNode,
  detachedStyle: DetachedStyle,
  variableId: string
): boolean => {
  try {
    if (node.type !== 'TEXT') {
      return false;
    }
    
    // Create a variable binding
    const binding = {
      type: 'VARIABLE',
      id: variableId
    } as VariableBinding;
    
    // Apply the variable to the text style
    node.textStyleId = variableId;
    
    return true;
  } catch (error) {
    logger.error(`Error applying typography variable: ${error}`);
    return false;
  }
};

/**
 * Applies a typography style to a node
 * @param node The node to apply to
 * @param detachedStyle The detached style
 * @param styleId The style ID
 * @returns Success status
 */
const applyTypographyStyle = (
  node: BaseNode,
  detachedStyle: DetachedStyle,
  styleId: string
): boolean => {
  try {
    if (node.type !== 'TEXT') {
      return false;
    }
    
    // Apply the text style
    node.textStyleId = styleId;
    
    return true;
  } catch (error) {
    logger.error(`Error applying typography style: ${error}`);
    return false;
  }
};

/**
 * Applies a spacing variable to a node
 * @param node The node to apply to
 * @param detachedStyle The detached style
 * @param variableId The variable ID
 * @returns Success status
 */
const applySpacingVariable = (
  node: BaseNode,
  detachedStyle: DetachedStyle,
  variableId: string
): boolean => {
  try {
    if (!(detachedStyle.propertyName in node)) {
      return false;
    }
    
    // Create a variable binding
    const binding = {
      type: 'VARIABLE',
      id: variableId
    } as VariableBinding;
    
    // Apply the variable to the spacing property
    const propertyName = detachedStyle.propertyName;
    
    if (propertyName === 'itemSpacing' && 'itemSpacing' in node) {
      node.boundVariables = {
        ...node.boundVariables,
        itemSpacing: binding
      };
    } else if (propertyName === 'paddingLeft' && 'paddingLeft' in node) {
      node.boundVariables = {
        ...node.boundVariables,
        paddingLeft: binding
      };
    } else if (propertyName === 'paddingRight' && 'paddingRight' in node) {
      node.boundVariables = {
        ...node.boundVariables,
        paddingRight: binding
      };
    } else if (propertyName === 'paddingTop' && 'paddingTop' in node) {
      node.boundVariables = {
        ...node.boundVariables,
        paddingTop: binding
      };
    } else if (propertyName === 'paddingBottom' && 'paddingBottom' in node) {
      node.boundVariables = {
        ...node.boundVariables,
        paddingBottom: binding
      };
    } else {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Error applying spacing variable: ${error}`);
    return false;
  }
};

/**
 * Applies a corner radius variable to a node
 * @param node The node to apply to
 * @param detachedStyle The detached style
 * @param variableId The variable ID
 * @returns Success status
 */
const applyCornerRadiusVariable = (
  node: BaseNode,
  detachedStyle: DetachedStyle,
  variableId: string
): boolean => {
  try {
    if (!('cornerRadius' in node)) {
      return false;
    }
    
    // Create a variable binding
    const binding = {
      type: 'VARIABLE',
      id: variableId
    } as VariableBinding;
    
    // Apply the variable to the corner radius
    node.boundVariables = {
      ...node.boundVariables,
      cornerRadius: binding
    };
    
    return true;
  } catch (error) {
    logger.error(`Error applying corner radius variable: ${error}`);
    return false;
  }
};

export function applyFillVariableFix(
  node: SceneNode & { fills: readonly Paint[] },
  fillIndex: number,
  variableId: string
): boolean {
  try {
    // Validate fill index
    if (isNaN(fillIndex) || fillIndex < 0 || fillIndex >= (node.fills as Paint[]).length) {
      logger.error(`Invalid fill index: ${fillIndex}`);
      return false;
    }
    
    // Create variable binding
    const binding = {
      id: variableId,
      type: 'VARIABLE_ALIAS'
    // @ts-ignore - VariableBinding is available but not in typings
    } as VariableBinding;
    
    // Create a mutable copy of fills
    const fills = [...(node.fills as Paint[])];
    
    // Apply the variable binding
    // @ts-ignore - boundVariables is available but not in typings
    node.boundVariables = {
      ...node.boundVariables,
      fills: {
        ...node.boundVariables?.fills,
        [fillIndex]: {
          type: binding
        }
      }
    };
    
    return true;
  } catch (error) {
    logger.error('Error applying fill variable fix:', error);
    return false;
  }
}

export function applyStrokeVariableFix(
  node: SceneNode & { strokes: readonly Paint[] },
  strokeIndex: number,
  variableId: string
): boolean {
  try {
    // Create variable binding
    const binding = {
      id: variableId,
      type: 'VARIABLE_ALIAS'
    // @ts-ignore - VariableBinding is available but not in typings
    } as VariableBinding;
    
    // Apply the variable binding
    // @ts-ignore - boundVariables is available but not in typings
    node.boundVariables = {
      ...node.boundVariables,
      strokes: {
        ...node.boundVariables?.strokes,
        [strokeIndex]: {
          type: binding
        }
      }
    };
    
    return true;
  } catch (error) {
    logger.error('Error applying stroke variable fix:', error);
    return false;
  }
}

export function applyEffectVariableFix(
  node: SceneNode & { effects: readonly Effect[] },
  effectIndex: number,
  variableId: string
): boolean {
  try {
    // Create variable binding
    const binding = {
      id: variableId,
      type: 'VARIABLE_ALIAS'
    // @ts-ignore - VariableBinding is available but not in typings
    } as VariableBinding;
    
    // Apply the variable binding
    // @ts-ignore - boundVariables is available but not in typings
    node.boundVariables = {
      ...node.boundVariables,
      effects: {
        ...node.boundVariables?.effects,
        [effectIndex]: {
          type: binding
        }
      }
    };
    
    return true;
  } catch (error) {
    logger.error('Error applying effect variable fix:', error);
    return false;
  }
}

export function applyCornerRadiusVariableFix(
  node: SceneNode & { cornerRadius: number | CornerMixin | typeof figma.mixed },
  variableId: string
): boolean {
  try {
    // Create variable binding
    const binding = {
      id: variableId,
      type: 'VARIABLE_ALIAS'
    // @ts-ignore - VariableBinding is available but not in typings
    } as VariableBinding;
    
    // Apply the variable binding
    // @ts-ignore - boundVariables is available but not in typings
    node.boundVariables = {
      ...node.boundVariables,
      cornerRadius: binding
    };
    
    return true;
  } catch (error) {
    logger.error('Error applying corner radius variable fix:', error);
    return false;
  }
} 