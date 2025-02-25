var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v4 as uuidv4 } from 'uuid';
import { StyleCategory, NODE_COUNT_LIMIT } from '../../types';
import { extractColorFromPaint } from '../../utils/colorUtils';
/**
 * Counts the number of nodes in the current scope
 * @param scope The scope to count nodes in (selection or current page)
 * @returns The number of nodes
 */
export const countNodes = (scope) => {
    if (Array.isArray(scope)) {
        let count = scope.length;
        for (const node of scope) {
            if ('children' in node) {
                count += countChildNodes(node);
            }
        }
        return count;
    }
    else {
        // It's a page
        return 1 + scope.children.reduce((acc, node) => {
            return acc + (('children' in node) ? countChildNodes(node) : 0);
        }, scope.children.length);
    }
};
/**
 * Recursively counts child nodes
 * @param node The parent node with children
 * @returns The number of child nodes
 */
const countChildNodes = (node) => {
    let count = node.children.length;
    for (const child of node.children) {
        if ('children' in child) {
            count += countChildNodes(child);
        }
    }
    return count;
};
/**
 * Scans nodes for detached styles
 * @param useSelection Whether to use the current selection or the current page
 * @returns Object containing detached styles and any error message
 */
export const scanForDetachedStyles = (useSelection) => __awaiter(void 0, void 0, void 0, function* () {
    const scope = useSelection ? figma.currentPage.selection : figma.currentPage;
    // Check node count
    const nodeCount = countNodes(scope);
    if (nodeCount > NODE_COUNT_LIMIT) {
        return {
            detachedStyles: [],
            errorMessage: `Too many nodes (${nodeCount} found, ${NODE_COUNT_LIMIT} max). Please select a smaller section.`
        };
    }
    // Scan for detached styles
    const detachedStyles = [];
    if (Array.isArray(scope)) {
        // It's a selection
        for (const node of scope) {
            yield traverseNode(node, detachedStyles);
        }
    }
    else {
        // It's a page
        for (const node of scope.children) {
            yield traverseNode(node, detachedStyles);
        }
    }
    return { detachedStyles };
});
/**
 * Recursively traverses a node and its children to find detached styles
 * @param node The node to traverse
 * @param detachedStyles Array to collect detached styles
 */
const traverseNode = (node, detachedStyles) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for detached fill styles
    if ('fills' in node && node.fills !== figma.mixed) {
        extractDetachedFillStyles(node, detachedStyles);
    }
    // Check for detached text styles
    if (node.type === 'TEXT') {
        extractDetachedTextStyles(node, detachedStyles);
    }
    // Check for detached corner radius styles
    if ('cornerRadius' in node &&
        typeof node.cornerRadius !== 'undefined' &&
        node.cornerRadius !== figma.mixed &&
        (typeof node.cornerRadius === 'number' ? node.cornerRadius !== 0 : true)) {
        extractDetachedCornerRadiusStyles(node, detachedStyles);
    }
    // Check for detached spacing styles (for frames, auto layout)
    if ('itemSpacing' in node &&
        typeof node.itemSpacing !== 'undefined' &&
        node.itemSpacing !== figma.mixed &&
        node.itemSpacing > 0) {
        extractDetachedSpacingStyles(node, detachedStyles, 'itemSpacing');
    }
    if ('paddingLeft' in node &&
        typeof node.paddingLeft !== 'undefined' &&
        node.paddingLeft !== figma.mixed &&
        node.paddingLeft > 0) {
        extractDetachedSpacingStyles(node, detachedStyles, 'paddingLeft');
    }
    if ('paddingRight' in node &&
        typeof node.paddingRight !== 'undefined' &&
        node.paddingRight !== figma.mixed &&
        node.paddingRight > 0) {
        extractDetachedSpacingStyles(node, detachedStyles, 'paddingRight');
    }
    if ('paddingTop' in node &&
        typeof node.paddingTop !== 'undefined' &&
        node.paddingTop !== figma.mixed &&
        node.paddingTop > 0) {
        extractDetachedSpacingStyles(node, detachedStyles, 'paddingTop');
    }
    if ('paddingBottom' in node &&
        typeof node.paddingBottom !== 'undefined' &&
        node.paddingBottom !== figma.mixed &&
        node.paddingBottom > 0) {
        extractDetachedSpacingStyles(node, detachedStyles, 'paddingBottom');
    }
    // Recursively check children
    if ('children' in node) {
        for (const child of node.children) {
            yield traverseNode(child, detachedStyles);
        }
    }
});
/**
 * Extracts detached fill styles from a node
 * @param node The node to extract from
 * @param detachedStyles Array to collect detached styles
 */
const extractDetachedFillStyles = (node, detachedStyles) => {
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
const extractDetachedTextStyles = (node, detachedStyles) => {
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
            let lineHeightValue;
            if (typeof lineHeight === 'number') {
                lineHeightValue = `${lineHeight}`;
            }
            else if (lineHeight.unit === 'PIXELS') {
                lineHeightValue = `${lineHeight.value}`;
            }
            else if (lineHeight.unit === 'PERCENT') {
                lineHeightValue = `${lineHeight.value}%`;
            }
            else {
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
const extractDetachedCornerRadiusStyles = (node, detachedStyles) => {
    // Skip if the node has a corner radius style applied
    if ('cornerRadiusStyleId' in node && node.cornerRadiusStyleId !== '') {
        return;
    }
    let radiusValue;
    if (typeof node.cornerRadius === 'number') {
        radiusValue = `${node.cornerRadius}px`;
    }
    else if (node.cornerRadius !== figma.mixed) {
        // For mixed corner radius, we'll use the top-left value for now
        radiusValue = `${node.cornerRadius.topLeft}px`;
    }
    else {
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
const extractDetachedSpacingStyles = (node, detachedStyles, propertyName) => {
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
