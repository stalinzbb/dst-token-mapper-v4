import React from 'react';
import '../styles/ScanControls.css';
export const ScanControls = ({ onScan, onCancel, onApplyFixes, isLoading, hasResults, selectedFixesCount }) => {
    return (React.createElement("div", { className: "scan-controls" },
        React.createElement("div", { className: "scan-buttons" },
            React.createElement("button", { className: "button primary", onClick: () => onScan(false), disabled: isLoading }, "Scan Current Page"),
            React.createElement("button", { className: "button secondary", onClick: () => onScan(true), disabled: isLoading }, "Scan Selection")),
        hasResults && (React.createElement("div", { className: "action-buttons" },
            React.createElement("button", { className: "button primary", onClick: onApplyFixes, disabled: isLoading || selectedFixesCount === 0 },
                "Apply ",
                selectedFixesCount,
                " Fixes"),
            React.createElement("button", { className: "button secondary", onClick: onCancel, disabled: isLoading }, "Cancel"))),
        isLoading && (React.createElement("div", { className: "loading-indicator" },
            React.createElement("div", { className: "spinner" }),
            React.createElement("span", null, "Processing...")))));
};
