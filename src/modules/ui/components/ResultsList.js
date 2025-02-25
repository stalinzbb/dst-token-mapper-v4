import React from 'react';
import { StyleCategory } from '../../../types';
import { ResultItem } from './ResultItem';
import '../styles/ResultsList.css';
export const ResultsList = ({ results, selectedFixes, onFixSelection }) => {
    // Group results by category
    const groupedResults = results.reduce((groups, result) => {
        const category = result.detachedStyle.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(result);
        return groups;
    }, {});
    // Get categories with results
    const categories = Object.keys(groupedResults);
    // Count matches and unmatched
    const matchedCount = results.filter(result => result.matches.length > 0).length;
    const unmatchedCount = results.length - matchedCount;
    return (React.createElement("div", { className: "results-list" },
        React.createElement("div", { className: "results-summary" },
            React.createElement("div", { className: "results-count" },
                React.createElement("span", { className: "count-label" }, "Total:"),
                React.createElement("span", { className: "count-value" }, results.length)),
            React.createElement("div", { className: "results-count" },
                React.createElement("span", { className: "count-label" }, "Matched:"),
                React.createElement("span", { className: "count-value" }, matchedCount)),
            React.createElement("div", { className: "results-count" },
                React.createElement("span", { className: "count-label" }, "Unmatched:"),
                React.createElement("span", { className: "count-value" }, unmatchedCount))),
        categories.map(category => (React.createElement("div", { key: category, className: "category-group" },
            React.createElement("h3", { className: "category-title" }, getCategoryLabel(category)),
            React.createElement("div", { className: "category-items" }, groupedResults[category].map(result => (React.createElement(ResultItem, { key: result.detachedStyle.id, result: result, selectedVariableId: selectedFixes.get(result.detachedStyle.id) || null, onFixSelection: onFixSelection })))))))));
};
// Helper function to get human-readable category labels
const getCategoryLabel = (category) => {
    switch (category) {
        case StyleCategory.COLOR:
            return 'Colors';
        case StyleCategory.TYPOGRAPHY:
            return 'Typography';
        case StyleCategory.SPACING:
            return 'Spacing';
        case StyleCategory.CORNER_RADIUS:
            return 'Corner Radius';
        default:
            return 'Other';
    }
};
