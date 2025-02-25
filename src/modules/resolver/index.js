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
/**
 * Applies variable fixes to detached styles
 * @param fixes Array of fixes to apply
 * @param detachedStyles Map of detached styles by ID
 * @returns Object with success status and message
 */
export const applyFixes = (fixes, detachedStyles) => __awaiter(void 0, void 0, void 0, function* () {
    let appliedCount = 0;
    let errorCount = 0;
    for (const fix of fixes) {
        const detachedStyle = detachedStyles.get(fix.detachedStyleId);
        if (!detachedStyle) {
            console.error(`Detached style not found: ${fix.detachedStyleId}`);
            errorCount++;
            continue;
        }
        try {
            const success = yield applyVariableToNode(detachedStyle, fix.variableId);
            if (success) {
                appliedCount++;
            }
            else {
                errorCount++;
            }
        }
        catch (error) {
            console.error(`Error applying fix: ${error}`);
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
    }
    else {
        return {
            success: appliedCount > 0,
            message: `Applied ${appliedCount} fixes with ${errorCount} errors.`,
            appliedCount,
            errorCount
        };
    }
});
/**
 * Applies a variable to a node
 * @param detachedStyle The detached style to fix
 * @param variableId The ID of the variable to apply
 * @returns Promise resolving to success status
 */
const applyVariableToNode = (detachedStyle, variableId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the node
        const node = figma.getNodeById(detachedStyle.nodeId);
        if (!node) {
            console.error(`Node not found: ${detachedStyle.nodeId}`);
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
                console.error(`Unsupported style category: ${detachedStyle.category}`);
                return false;
        }
    }
    catch (error) {
        console.error(`Error applying variable: ${error}`);
        return false;
    }
});
/**
 * Applies a color variable to a node
 * @param node The node to apply to
 * @param detachedStyle The detached style
 * @param variableId The variable ID
 * @returns Success status
 */
const applyColorVariable = (node, detachedStyle, variableId) => {
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
        };
        // Apply the variable to the fill
        const fills = [...node.fills];
        fills[fillIndex] = Object.assign(Object.assign({}, fills[fillIndex]), { boundVariables: {
                color: binding
            } });
        node.fills = fills;
        return true;
    }
    catch (error) {
        console.error(`Error applying color variable: ${error}`);
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
const applyTypographyVariable = (node, detachedStyle, variableId) => {
    try {
        if (node.type !== 'TEXT') {
            return false;
        }
        // Create a variable binding
        const binding = {
            type: 'VARIABLE',
            id: variableId
        };
        // Apply the variable to the text style
        node.textStyleId = variableId;
        return true;
    }
    catch (error) {
        console.error(`Error applying typography variable: ${error}`);
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
const applySpacingVariable = (node, detachedStyle, variableId) => {
    try {
        if (!(detachedStyle.propertyName in node)) {
            return false;
        }
        // Create a variable binding
        const binding = {
            type: 'VARIABLE',
            id: variableId
        };
        // Apply the variable to the spacing property
        const propertyName = detachedStyle.propertyName;
        if (propertyName === 'itemSpacing' && 'itemSpacing' in node) {
            node.boundVariables = Object.assign(Object.assign({}, node.boundVariables), { itemSpacing: binding });
        }
        else if (propertyName === 'paddingLeft' && 'paddingLeft' in node) {
            node.boundVariables = Object.assign(Object.assign({}, node.boundVariables), { paddingLeft: binding });
        }
        else if (propertyName === 'paddingRight' && 'paddingRight' in node) {
            node.boundVariables = Object.assign(Object.assign({}, node.boundVariables), { paddingRight: binding });
        }
        else if (propertyName === 'paddingTop' && 'paddingTop' in node) {
            node.boundVariables = Object.assign(Object.assign({}, node.boundVariables), { paddingTop: binding });
        }
        else if (propertyName === 'paddingBottom' && 'paddingBottom' in node) {
            node.boundVariables = Object.assign(Object.assign({}, node.boundVariables), { paddingBottom: binding });
        }
        else {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error(`Error applying spacing variable: ${error}`);
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
const applyCornerRadiusVariable = (node, detachedStyle, variableId) => {
    try {
        if (!('cornerRadius' in node)) {
            return false;
        }
        // Create a variable binding
        const binding = {
            type: 'VARIABLE',
            id: variableId
        };
        // Apply the variable to the corner radius
        node.boundVariables = Object.assign(Object.assign({}, node.boundVariables), { cornerRadius: binding });
        return true;
    }
    catch (error) {
        console.error(`Error applying corner radius variable: ${error}`);
        return false;
    }
};
