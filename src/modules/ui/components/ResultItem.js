import React from 'react';
import { StyleCategory } from '../../../types';
import '../styles/ResultItem.css';
export const ResultItem = ({ result, selectedVariableId, onFixSelection }) => {
    const { detachedStyle, matches, hasConflict, conflictingLibraries } = result;
    const handleVariableSelection = (event) => {
        const variableId = event.target.value || null;
        onFixSelection(detachedStyle.id, variableId);
    };
    return (React.createElement("div", { className: "result-item" },
        React.createElement("div", { className: "style-info" },
            React.createElement("div", { className: "style-preview" },
                detachedStyle.category === StyleCategory.COLOR && (React.createElement("div", { className: "color-preview", style: { backgroundColor: detachedStyle.value } })),
                detachedStyle.category !== StyleCategory.COLOR && (React.createElement("div", { className: "property-icon" }, getCategoryIcon(detachedStyle.category)))),
            React.createElement("div", { className: "style-details" },
                React.createElement("div", { className: "style-name" },
                    React.createElement("span", { className: "node-name" }, detachedStyle.nodeName),
                    React.createElement("span", { className: "property-name" }, detachedStyle.propertyName)),
                React.createElement("div", { className: "style-value" }, detachedStyle.value))),
        React.createElement("div", { className: "variable-selection" }, matches.length > 0 ? (React.createElement("div", { className: "variable-dropdown" },
            React.createElement("select", { value: selectedVariableId || '', onChange: handleVariableSelection, className: hasConflict ? 'has-conflict' : '' },
                React.createElement("option", { value: "" }, "Select variable..."),
                matches.map(match => (React.createElement("option", { key: match.variableId, value: match.variableId },
                    match.variableName,
                    " (",
                    match.libraryName,
                    ")")))),
            hasConflict && conflictingLibraries && (React.createElement("div", { className: "conflict-warning" },
                "\u26A0\uFE0F Same value in multiple libraries: ",
                conflictingLibraries.join(', '))))) : (React.createElement("div", { className: "no-matches" }, "No matching variables found")))));
};
// Helper function to get category icons
const getCategoryIcon = (category) => {
    switch (category) {
        case StyleCategory.TYPOGRAPHY:
            return 'T';
        case StyleCategory.SPACING:
            return '↔️';
        case StyleCategory.CORNER_RADIUS:
            return '⟳';
        default:
            return '?';
    }
};
