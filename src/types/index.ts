// Style categories
export enum StyleCategory {
  COLOR = 'COLOR',
  TYPOGRAPHY = 'TYPOGRAPHY',
  SPACING = 'SPACING',
  CORNER_RADIUS = 'CORNER_RADIUS',
  OTHER = 'OTHER'
}

// Detached style representation
export interface DetachedStyle {
  id: string;
  nodeId: string;
  nodeName: string;
  category: StyleCategory;
  value: string;
  originalValue: any; // Raw value from Figma
  propertyName: string; // e.g., 'fill', 'cornerRadius', etc.
}

// Variable match representation
export interface VariableMatch {
  id: string;
  name: string;
  libraryId: string;
  libraryName: string;
  value: string;
  variableId?: string;
  variableName?: string;
  exactMatch?: boolean;
}

// Result of matching process
export interface MatchResult {
  detachedStyleId: string;
  matches: VariableMatch[];
  hasConflict: boolean;
}

// Message types
export interface UIMessage {
  type: 'scan' | 'apply-fixes' | 'cancel';
  useSelection?: boolean;
  fixes?: { detachedStyleId: string; variableId: string }[];
}

export interface PluginMessage {
  type: 'scan-complete' | 'apply-complete';
  detachedStyles?: DetachedStyle[];
  matchResults?: MatchResult[];
  errorMessage?: string;
}

// Library information
export interface LibraryInfo {
  id: string;
  name: string;
  variables: {
    [key: string]: {
      id: string;
      name: string;
      value: any;
      category: StyleCategory;
    }
  };
}

// Node count limits
export const NODE_COUNT_LIMIT = 1000;

// Scanner types
export interface ScanOptions {
  nodeLimit: number;
  includeHidden: boolean;
  includeStyles: {
    fills: boolean;
    strokes: boolean;
    effects: boolean;
    cornerRadius: boolean;
    spacing: boolean;
    typography: boolean;
  };
}

export interface DetachedStylesMap {
  fills: DetachedStyle[];
  strokes: DetachedStyle[];
  effects: DetachedStyle[];
  cornerRadius: DetachedStyle[];
  spacing: DetachedStyle[];
  typography: DetachedStyle[];
}

export interface ScanResult {
  detachedStyles: DetachedStylesMap;
  nodeCount: number;
  hasExceededLimit: boolean;
}

// Library types
export interface Library {
  id: string;
  name: string;
}

export interface ValueLibraryMap {
  [value: string]: {
    libraryIds: string[];
    variables: Variable[];
  };
}

export interface ConflictMap {
  [value: string]: Library[];
} 