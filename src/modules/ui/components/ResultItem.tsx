import React from 'react';
import { DetachedStyle, MatchResult, StyleCategory } from '../../../types';
import '../styles/ResultItem.css';

interface ResultItemProps {
  style: DetachedStyle;
  match: MatchResult | undefined;
  selectedVariableId: string | undefined;
  onSelectFix: (detachedStyleId: string, variableId: string) => void;
}

const ResultItem: React.FC<ResultItemProps> = ({
  style,
  match,
  selectedVariableId,
  onSelectFix
}) => {
  // Get icon based on style category
  const getCategoryIcon = (category: StyleCategory): string => {
    switch (category) {
      case StyleCategory.COLOR:
        return '🎨';
      case StyleCategory.TYPOGRAPHY:
        return '🔤';
      case StyleCategory.SPACING:
        return '↔️';
      case StyleCategory.CORNER_RADIUS:
        return '⚙️';
      default:
        return '📐';
    }
  };
  
  // Format style value for display
  const formatStyleValue = (style: DetachedStyle): string => {
    switch (style.category) {
      case StyleCategory.COLOR:
        return style.value;
      case StyleCategory.TYPOGRAPHY:
        return style.value;
      case StyleCategory.SPACING:
        return `${style.value}px`;
      case StyleCategory.CORNER_RADIUS:
        return `${style.value}px`;
      default:
        return style.value;
    }
  };
  
  // Handle variable selection
  const handleVariableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const variableId = e.target.value;
    if (variableId) {
      onSelectFix(style.id, variableId);
    }
  };
  
  // Check if there are conflicts
  const hasConflict = match?.hasConflict || false;
  
  // Check if there are matches
  const hasMatches = match?.matches && match.matches.length > 0;
  
  return (
    <div className="result-item">
      <div className="style-info">
        <div className="style-preview">
          {style.category === StyleCategory.COLOR ? (
            <div 
              className="color-preview" 
              style={{ backgroundColor: style.value }}
            />
          ) : (
            <div className="property-icon">
              {getCategoryIcon(style.category)}
            </div>
          )}
        </div>
        
        <div className="style-details">
          <div className="style-name">{style.nodeName}</div>
          <div className="node-name">{style.propertyName}</div>
          <div className="property-name">{formatStyleValue(style)}</div>
        </div>
      </div>
      
      <div className="variable-selection">
        {hasMatches ? (
          <>
            <div className="variable-dropdown">
              <select
                value={selectedVariableId || ''}
                onChange={handleVariableChange}
                className={hasConflict ? 'has-conflict' : ''}
              >
                <option value="">Select variable...</option>
                {match?.matches.map(variable => (
                  <option key={variable.id} value={variable.id}>
                    {variable.name} ({variable.libraryName})
                  </option>
                ))}
              </select>
            </div>
            
            {hasConflict && (
              <div className="conflict-warning">
                ⚠️ Multiple libraries have matching variables
              </div>
            )}
          </>
        ) : (
          <div className="no-matches">
            No matching variables found
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultItem; 