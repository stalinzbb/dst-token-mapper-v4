// This plugin will scan for detached styles and map them to variables from connected libraries

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

import { 
  DetachedStyle, 
  PluginMessage, 
  UIMessage, 
  MatchResult
} from './src/types';

import { scanForDetachedStyles } from './src/modules/scanner';
import { getConnectedLibraries } from './src/modules/library';
import { findMatches } from './src/modules/matcher';
import { applyFixes } from './src/modules/resolver';

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 450, height: 550 });

// Store detached styles for later use
let detachedStylesMap: { [id: string]: DetachedStyle } = {};

// Handle messages from the UI
figma.ui.onmessage = async (message: UIMessage) => {
  try {
    switch (message.type) {
      case 'scan':
        await handleScan(message.useSelection || false);
        break;
      case 'apply-fixes':
        if (message.fixes) {
          await handleApplyFixes(message.fixes);
        }
        break;
      case 'cancel':
        figma.closePlugin();
        break;
      default:
        console.error('Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    figma.ui.postMessage({
      type: 'scan-complete',
      errorMessage: 'An error occurred: ' + (error instanceof Error ? error.message : String(error))
    } as PluginMessage);
  }
};

/**
 * Handles the scan request
 * @param useSelection Whether to use the current selection or the current page
 */
async function handleScan(useSelection: boolean) {
  try {
    // Get scope based on selection
    const scope = useSelection ? figma.currentPage.selection : figma.currentPage;
    
    if (useSelection && figma.currentPage.selection.length === 0) {
      figma.ui.postMessage({
        type: 'scan-complete',
        errorMessage: 'No nodes selected. Please select at least one node.'
      } as PluginMessage);
      return;
    }
    
    // Scan for detached styles
    const scanResult = scanForDetachedStyles(scope);
    
    if (scanResult.hasExceededLimit) {
      figma.ui.postMessage({
        type: 'scan-complete',
        errorMessage: `Too many nodes (${scanResult.nodeCount} found). Please select a smaller section.`
      } as PluginMessage);
      return;
    }
    
    // Extract all detached styles into a flat array
    const allDetachedStyles: DetachedStyle[] = [
      ...scanResult.detachedStyles.fills,
      ...scanResult.detachedStyles.strokes,
      ...scanResult.detachedStyles.effects,
      ...scanResult.detachedStyles.cornerRadius,
      ...scanResult.detachedStyles.spacing,
      ...scanResult.detachedStyles.typography
    ];
    
    // Store detached styles for later use
    detachedStylesMap = {};
    allDetachedStyles.forEach(style => {
      detachedStylesMap[style.id] = style;
    });
    
    if (allDetachedStyles.length === 0) {
      figma.ui.postMessage({
        type: 'scan-complete',
        detachedStyles: [],
        matchResults: []
      } as PluginMessage);
      return;
    }
    
    // Get connected libraries
    const librariesResult = await getConnectedLibraries();
    
    if (librariesResult.errorMessage) {
      figma.ui.postMessage({
        type: 'scan-complete',
        errorMessage: librariesResult.errorMessage
      } as PluginMessage);
      return;
    }
    
    if (librariesResult.libraries.length === 0) {
      figma.ui.postMessage({
        type: 'scan-complete',
        errorMessage: 'No connected libraries found. Please connect at least one library with variables.'
      } as PluginMessage);
      return;
    }
    
    // Find matches for detached styles
    const matchResults = findMatches(allDetachedStyles, librariesResult.libraries);
    
    // Send results to UI
    figma.ui.postMessage({
      type: 'scan-complete',
      detachedStyles: allDetachedStyles,
      matchResults
    } as PluginMessage);
  } catch (error) {
    console.error('Error scanning for detached styles:', error);
    figma.ui.postMessage({
      type: 'scan-complete',
      errorMessage: 'Error scanning for detached styles: ' + (error instanceof Error ? error.message : String(error))
    } as PluginMessage);
  }
}

/**
 * Handles applying fixes
 * @param fixes Array of fixes to apply
 */
async function handleApplyFixes(fixes: Array<{ detachedStyleId: string; variableId: string }>) {
  try {
    if (fixes.length === 0) {
      figma.ui.postMessage({
        type: 'apply-complete',
        errorMessage: 'No fixes to apply.'
      } as PluginMessage);
      return;
    }
    
    // Convert detachedStylesMap to Map for applyFixes function
    const detachedStylesMapForResolver = new Map<string, DetachedStyle>();
    Object.entries(detachedStylesMap).forEach(([id, style]) => {
      detachedStylesMapForResolver.set(id, style);
    });
    
    // Apply fixes using the resolver module
    const result = await applyFixes(fixes, detachedStylesMapForResolver);
    
    // Send results to UI
    if (!result.success) {
      figma.ui.postMessage({
        type: 'apply-complete',
        errorMessage: result.message
      } as PluginMessage);
    } else {
      figma.ui.postMessage({
        type: 'apply-complete'
      } as PluginMessage);
    }
  } catch (error) {
    console.error('Error applying fixes:', error);
    figma.ui.postMessage({
      type: 'apply-complete',
      errorMessage: 'Error applying fixes: ' + (error instanceof Error ? error.message : String(error))
    } as PluginMessage);
  }
}
