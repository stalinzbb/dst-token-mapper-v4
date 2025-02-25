// import { v4 as uuidv4 } from 'uuid';
import { DetachedStyle, StyleCategory, NODE_COUNT_LIMIT, ScanOptions, ScanResult, DetachedStylesMap } from '../../types';
import { extractColorFromPaint } from '../../utils/colorUtils';
import { logger } from '../logger';

// Simple ID generator to replace UUID
function generateSimpleId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

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
    logger.error('Error scanning for detached styles:', error);
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
    logger.error('Error processing node:', error);
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
 * Check if a node has a style applied for a property
 */
function hasStyleApplied(node: SceneNode, styleProperty: string): boolean {
  try {
    // @ts-ignore - styleId properties are available but might not be in typings
    return node[styleProperty] && node[styleProperty] !== '' && node[styleProperty] !== figma.mixed;
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
  detachedStyles: DetachedStylesMap
): void => {
  // Skip if the node has a fill style applied or variable binding
  if (hasStyleApplied(node, 'fillStyleId') || hasVariableBinding(node, 'fills')) {
    return;
  }
  
  // Process each fill
  for (let i = 0; i < node.fills.length; i++) {
    const fill = node.fills[i];
    
    if (fill.type === 'SOLID') {
      const colorHex = extractColorFromPaint(fill);
      
      if (colorHex) {
        detachedStyles.fills.push({
          id: generateSimpleId(),
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
  detachedStyles: DetachedStylesMap
): void => {
  // Skip if the node has a text style applied or variable binding
  if (hasStyleApplied(node, 'textStyleId') || hasVariableBinding(node, 'fontName') || hasVariableBinding(node, 'fontSize')) {
    return;
  }
  
  // Get font details
  const fontName = node.fontName;
  const fontSize = node.fontSize;
  const lineHeight = node.lineHeight;
  
  if (fontName !== figma.mixed && fontSize !== figma.mixed) {
    let fontValue = `${fontName.family} ${fontSize}`;
    
    detachedStyles.typography.push({
      id: generateSimpleId(),
      nodeId: node.id,
      nodeName: node.name,
      category: StyleCategory.TYPOGRAPHY,
      value: fontValue,
      originalValue: {
        fontFamily: fontName.family,
        fontSize: fontSize,
        fontWeight: fontName.style,
        lineHeight: lineHeight
      },
      propertyName: 'typography'
    });
  }
};

/**
 * Extracts detached stroke styles from a node
 * @param node The node to extract from
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedStrokeStyles = (
  node: SceneNode & { strokes: readonly Paint[] },
  detachedStyles: DetachedStylesMap
): void => {
  // Skip if the node has a stroke style applied or variable binding
  if (hasStyleApplied(node, 'strokeStyleId') || hasVariableBinding(node, 'strokes')) {
    return;
  }
  
  // Process each stroke
  for (let i = 0; i < node.strokes.length; i++) {
    const stroke = node.strokes[i];
    
    if (stroke.type === 'SOLID') {
      const colorHex = extractColorFromPaint(stroke);
      
      if (colorHex) {
        detachedStyles.strokes.push({
          id: generateSimpleId(),
          nodeId: node.id,
          nodeName: node.name,
          category: StyleCategory.COLOR,
          value: colorHex,
          originalValue: stroke.color,
          propertyName: `stroke[${i}]`
        });
      }
    }
  }
};

/**
 * Extracts detached effect styles from a node
 * @param node The node to extract from
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedEffectStyles = (
  node: SceneNode & { effects: readonly Effect[] },
  detachedStyles: DetachedStylesMap
): void => {
  // Skip if the node has an effect style applied or variable binding
  if (hasStyleApplied(node, 'effectStyleId') || hasVariableBinding(node, 'effects')) {
    return;
  }
  
  // Process each effect
  for (let i = 0; i < node.effects.length; i++) {
    const effect = node.effects[i];
    
    detachedStyles.effects.push({
      id: generateSimpleId(),
      nodeId: node.id,
      nodeName: node.name,
      category: StyleCategory.OTHER, // Using OTHER for effects
      value: `Effect: ${effect.type}`,
      originalValue: effect,
      propertyName: `effect[${i}]`
    });
  }
};

/**
 * Extracts detached corner radius styles from a node
 * @param node The node to extract from
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedCornerRadiusStyles = (
  node: SceneNode & { cornerRadius: number | typeof figma.mixed },
  detachedStyles: DetachedStylesMap
): void => {
  // Skip if the node has a corner radius variable binding
  if (hasVariableBinding(node, 'cornerRadius')) {
    return;
  }
  
  if (node.cornerRadius !== figma.mixed && node.cornerRadius !== 0) {
    detachedStyles.cornerRadius.push({
      id: generateSimpleId(),
      nodeId: node.id,
      nodeName: node.name,
      category: StyleCategory.CORNER_RADIUS,
      value: `${node.cornerRadius}px`,
      originalValue: node.cornerRadius,
      propertyName: 'cornerRadius'
    });
  }
};

/**
 * Extracts detached spacing styles from a node
 * @param node The node to extract from
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedSpacingStyles = (
  node: FrameNode & { itemSpacing: number },
  detachedStyles: DetachedStylesMap
): void => {
  // Skip if the node has an item spacing variable binding
  if (hasVariableBinding(node, 'itemSpacing')) {
    return;
  }
  
  if (node.itemSpacing !== 0) {
    detachedStyles.spacing.push({
      id: generateSimpleId(),
      nodeId: node.id,
      nodeName: node.name,
      category: StyleCategory.SPACING,
      value: `${node.itemSpacing}px`,
      originalValue: node.itemSpacing,
      propertyName: 'itemSpacing'
    });
  }
}; 