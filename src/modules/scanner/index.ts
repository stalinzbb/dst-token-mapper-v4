import { v4 as uuidv4 } from 'uuid';
import { DetachedStyle, StyleCategory, NODE_COUNT_LIMIT, ScanOptions, ScanResult, DetachedStylesMap } from '../../types';
import { extractColorFromPaint } from '../../utils/colorUtils';

// Default scan options
export const defaultScanOptions: ScanOptions = {
  nodeLimit: 5000,
  includeHidden: false,
  includeStyles: {
    fills: true,
    strokes: true,
    effects: true,
    cornerRadius: true,
    spacing: true,
    typography: true
  }
};

/**
 * Counts the number of nodes in the current scope
 */
export function countNodes(scope: readonly SceneNode[] | PageNode): number {
  if (Array.isArray(scope)) {
    let count = scope.length;
    
    for (const node of scope) {
      if ('children' in node) {
        // @ts-ignore - Type compatibility issues
        count += countChildNodes(node);
      }
    }
    
    return count;
  } else {
    // It's a page
    // @ts-ignore - children is available on PageNode
    return 1 + scope.children.reduce((acc: number, node: SceneNode) => {
      // @ts-ignore - children is available on some SceneNode types
      return acc + (('children' in node) ? countChildNodes(node) : 0);
    // @ts-ignore - children is available on PageNode
    }, scope.children.length);
  }
}

/**
 * Recursively counts child nodes
 */
export function countChildNodes(node: SceneNode & { children?: readonly SceneNode[] }): number {
  // @ts-ignore - children is available on some SceneNode types
  if (!node.children) return 1;
  
  // @ts-ignore - children is available on some SceneNode types
  let count = node.children.length;
  
  // @ts-ignore - children is available on some SceneNode types
  for (const child of node.children) {
    if ('children' in child) {
      // @ts-ignore - Type compatibility issues
      count += countChildNodes(child);
    }
  }
  
  return count;
}

/**
 * Scans for detached styles in the given scope
 */
export function scanForDetachedStyles(
  scope: PageNode | readonly SceneNode[],
  options: ScanOptions = defaultScanOptions
): ScanResult {
  const detachedStyles: DetachedStylesMap = {
    fills: [],
    strokes: [],
    effects: [],
    cornerRadius: [],
    spacing: [],
    typography: []
  };
  
  const result: ScanResult = {
    detachedStyles,
    nodeCount: 0,
    hasExceededLimit: false
  };
  
  try {
    // Count nodes to check against limit
    const nodeCount = Array.isArray(scope) 
      ? scope.reduce((acc, node) => {
          // @ts-ignore - Type compatibility issues
          return acc + ('children' in node ? countChildNodes(node) : 1);
        }, 0)
      // @ts-ignore - Type compatibility issues
      : countChildNodes(scope);
    
    result.nodeCount = nodeCount;
    
    // Check if node count exceeds limit
    if (nodeCount > options.nodeLimit) {
      result.hasExceededLimit = true;
      return result;
    }
    
    // Process nodes
    if (Array.isArray(scope)) {
      for (const node of scope) {
        processNode(node, detachedStyles, options);
      }
    } else {
      // @ts-ignore - children is available on PageNode
      for (const node of scope.children) {
        processNode(node, detachedStyles, options);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error scanning for detached styles:', error);
    return result;
  }
}

/**
 * Process a node to extract detached styles
 */
function processNode(
  node: SceneNode,
  detachedStyles: DetachedStylesMap,
  options: ScanOptions
): void {
  try {
    // Skip hidden nodes if option is set
    if (!options.includeHidden && 'visible' in node && !node.visible) {
      return;
    }
    
    // Extract detached styles based on options
    if (options.includeStyles.fills && 'fills' in node) {
      // @ts-ignore - Type compatibility issues
      extractDetachedFillStyles(node, detachedStyles);
    }
    
    if (options.includeStyles.strokes && 'strokes' in node) {
      // @ts-ignore - Type compatibility issues
      extractDetachedStrokeStyles(node, detachedStyles);
    }
    
    if (options.includeStyles.effects && 'effects' in node) {
      // @ts-ignore - Type compatibility issues
      extractDetachedEffectStyles(node, detachedStyles);
    }
    
    if (options.includeStyles.cornerRadius && 'cornerRadius' in node) {
      // @ts-ignore - Type compatibility issues
      extractDetachedCornerRadiusStyles(node, detachedStyles);
    }
    
    if (options.includeStyles.spacing && node.type === 'FRAME' && 'layoutMode' in node && node.layoutMode !== 'NONE') {
      // @ts-ignore - Type compatibility issues
      extractDetachedSpacingStyles(node, detachedStyles);
    }
    
    if (options.includeStyles.typography && node.type === 'TEXT') {
      // @ts-ignore - Type compatibility issues
      extractDetachedTypographyStyles(node, detachedStyles);
    }
    
    // Process children recursively
    if ('children' in node) {
      // @ts-ignore - children is available on some SceneNode types
      for (const child of node.children) {
        processNode(child, detachedStyles, options);
      }
    }
  } catch (error) {
    console.error('Error processing node:', error);
  }
}

/**
 * Check if a node has a variable binding for a property
 */
function hasVariableBinding(node: SceneNode, property: string): boolean {
  try {
    // @ts-ignore - boundVariables is available but not in typings
    return node.boundVariables && node.boundVariables[property];
  } catch (error) {
    return false;
  }
}

/**
 * Extracts detached fill styles from a node
 * @param node The node to extract from
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedFillStyles = (
  node: SceneNode & { fills: readonly Paint[] },
  detachedStyles: DetachedStyle[]
): void => {
  // Skip if the node has a fill style applied
  if ('fillStyleId' in node && node.fillStyleId !== '') {
    return;
  }
  
  // Process each fill
  for (let i = 0; i < node.fills.length; i++) {
    const fill = node.fills[i];
    
    if (fill.type === 'SOLID') {
      const colorHex = extractColorFromPaint(fill);
      
      if (colorHex) {
        detachedStyles.push({
          id: uuidv4(),
          nodeId: node.id,
          nodeName: node.name,
          category: StyleCategory.COLOR,
          value: colorHex,
          originalValue: fill.color,
          propertyName: `fill[${i}]`
        });
      }
    }
  }
};

/**
 * Extracts detached text styles from a text node
 * @param node The text node
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedTextStyles = (
  node: TextNode,
  detachedStyles: DetachedStyle[]
): void => {
  // Skip if the node has a text style applied
  if (node.textStyleId !== '' && node.textStyleId !== figma.mixed) {
    return;
  }
  
  // Get font details
  const fontName = node.fontName;
  const fontSize = node.fontSize;
  const lineHeight = node.lineHeight;
  
  if (fontName !== figma.mixed && fontSize !== figma.mixed) {
    let fontValue = `${fontName.family} ${fontSize}`;
    
    if (lineHeight !== figma.mixed) {
      // Format line height based on its type
      let lineHeightValue: string;
      
      if (typeof lineHeight === 'number') {
        lineHeightValue = `${lineHeight}`;
      } else if (lineHeight.unit === 'PIXELS') {
        lineHeightValue = `${lineHeight.value}`;
      } else if (lineHeight.unit === 'PERCENT') {
        lineHeightValue = `${lineHeight.value}%`;
      } else {
        lineHeightValue = `${lineHeight.value}`;
      }
      
      fontValue += `/${lineHeightValue}`;
    }
    
    detachedStyles.push({
      id: uuidv4(),
      nodeId: node.id,
      nodeName: node.name,
      category: StyleCategory.TYPOGRAPHY,
      value: fontValue,
      originalValue: {
        fontName,
        fontSize,
        lineHeight
      },
      propertyName: 'typography'
    });
  }
};

/**
 * Extracts detached corner radius styles
 * @param node The node with corner radius
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedCornerRadiusStyles = (
  node: SceneNode & { cornerRadius: number | CornerRadius | typeof figma.mixed },
  detachedStyles: DetachedStyle[]
): void => {
  // Skip if the node has a corner radius style applied
  if ('cornerRadiusStyleId' in node && node.cornerRadiusStyleId !== '') {
    return;
  }
  
  let radiusValue: string;
  
  if (typeof node.cornerRadius === 'number') {
    radiusValue = `${node.cornerRadius}px`;
  } else if (node.cornerRadius !== figma.mixed) {
    // For mixed corner radius, we'll use the top-left value for now
    radiusValue = `${node.cornerRadius.topLeft}px`;
  } else {
    return; // Skip if it's figma.mixed
  }
  
  detachedStyles.push({
    id: uuidv4(),
    nodeId: node.id,
    nodeName: node.name,
    category: StyleCategory.CORNER_RADIUS,
    value: radiusValue,
    originalValue: node.cornerRadius,
    propertyName: 'cornerRadius'
  });
};

/**
 * Extracts detached spacing styles
 * @param node The node with spacing
 * @param detachedStyles Array to collect detached styles
 * @param propertyName The name of the spacing property
 */
const extractDetachedSpacingStyles = (
  node: SceneNode & { [key: string]: any },
  detachedStyles: DetachedStyle[],
  propertyName: string
): void => {
  // Skip if the node has a spacing style applied
  if (`${propertyName}StyleId` in node && node[`${propertyName}StyleId`] !== '') {
    return;
  }
  
  const spacingValue = `${node[propertyName]}px`;
  
  detachedStyles.push({
    id: uuidv4(),
    nodeId: node.id,
    nodeName: node.name,
    category: StyleCategory.SPACING,
    value: spacingValue,
    originalValue: node[propertyName],
    propertyName
  });
}; 