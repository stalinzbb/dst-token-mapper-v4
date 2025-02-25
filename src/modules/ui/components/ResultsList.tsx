import React from 'react';
import ResultItem from './ResultItem';
import { DetachedStyle, MatchResult, StyleCategory } from '../../../types';
import '../styles/ResultsList.css';

interface ResultsListProps {
  detachedStyles: DetachedStyle[];
  matchResults: MatchResult[];
  onSelectFix: (detachedStyleId: string, variableId: string) => void;
  selectedFixes: { [detachedStyleId: string]: string };
}

const ResultsList: React.FC<ResultsListProps> = ({
  detachedStyles,
  matchResults,
  onSelectFix,
  selectedFixes
}) => {
  // Group styles by category
  const stylesByCategory: { [key in StyleCategory]?: DetachedStyle[] } = {};
  
  detachedStyles.forEach(style => {
    if (!stylesByCategory[style.category]) {
      stylesByCategory[style.category] = [];
    }
    stylesByCategory[style.category]?.push(style);
  });
  
  // Count total styles and selected fixes
  const totalStyles = detachedStyles.length;
  const selectedFixesCount = Object.keys(selectedFixes).length;
  
  // Get match result for a style
  const getMatchForStyle = (styleId: string) => {
    return matchResults.find(match => match.detachedStyleId === styleId);
  };
  
  return (
    <div className="results-list">
      <div className="results-summary">
        <div className="results-count">
          <span className="count-label">Total Detached Styles:</span>
          <span className="count-value">{totalStyles}</span>
        </div>
        <div className="results-count">
          <span className="count-label">Selected Fixes:</span>
          <span className="count-value">{selectedFixesCount}</span>
        </div>
      </div>
      
      {Object.entries(stylesByCategory).map(([category, styles]) => (
        <div key={category} className="category-group">
          <h3 className="category-title">{StyleCategory[category as keyof typeof StyleCategory]}</h3>
          <div className="category-items">
            {styles?.map(style => (
              <ResultItem
                key={style.id}
                style={style}
                match={getMatchForStyle(style.id)}
                selectedVariableId={selectedFixes[style.id]}
                onSelectFix={onSelectFix}
              />
            ))}
          </div>
        </div>
      ))}
      
      {totalStyles === 0 && (
        <div className="no-results">
          No detached styles found.
        </div>
      )}
    </div>
  );
};

export default ResultsList; 