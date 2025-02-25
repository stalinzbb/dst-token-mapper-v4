import React, { useState, useEffect } from 'react';
import { ScanControls } from './ScanControls';
import { ResultsList } from './ResultsList';
import { StatusMessage } from './StatusMessage';
import '../styles/App.css';
export const App = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedFixes, setSelectedFixes] = useState(new Map());
    const [statusMessage, setStatusMessage] = useState(null);
    const [isError, setIsError] = useState(false);
    useEffect(() => {
        // Listen for messages from the plugin
        window.onmessage = (event) => {
            const message = event.data.pluginMessage;
            if (!message)
                return;
            switch (message.type) {
                case 'scan-start':
                    setIsLoading(true);
                    setResults([]);
                    setSelectedFixes(new Map());
                    setStatusMessage('Scanning for detached styles...');
                    setIsError(false);
                    break;
                case 'scan-results':
                    setIsLoading(false);
                    setResults(message.results);
                    setStatusMessage(message.results.length > 0
                        ? `Found ${message.results.length} detached styles.`
                        : 'No detached styles found.');
                    break;
                case 'error':
                    setIsLoading(false);
                    setStatusMessage(message.message);
                    setIsError(true);
                    break;
                case 'success':
                    setIsLoading(false);
                    setStatusMessage(message.message);
                    setIsError(false);
                    break;
                default:
                    break;
            }
        };
    }, []);
    const handleScan = (useSelection) => {
        setIsLoading(true);
        setResults([]);
        setSelectedFixes(new Map());
        const message = {
            type: 'scan',
            selection: useSelection
        };
        parent.postMessage({ pluginMessage: message }, '*');
    };
    const handleFixSelection = (detachedStyleId, variableId) => {
        const newSelectedFixes = new Map(selectedFixes);
        if (variableId) {
            newSelectedFixes.set(detachedStyleId, variableId);
        }
        else {
            newSelectedFixes.delete(detachedStyleId);
        }
        setSelectedFixes(newSelectedFixes);
    };
    const handleApplyFixes = () => {
        if (selectedFixes.size === 0) {
            setStatusMessage('No fixes selected.');
            setIsError(true);
            return;
        }
        setIsLoading(true);
        const fixes = Array.from(selectedFixes.entries()).map(([detachedStyleId, variableId]) => ({
            detachedStyleId,
            variableId
        }));
        const message = {
            type: 'apply-fixes',
            fixes
        };
        parent.postMessage({ pluginMessage: message }, '*');
    };
    const handleCancel = () => {
        const message = {
            type: 'cancel'
        };
        parent.postMessage({ pluginMessage: message }, '*');
    };
    return (React.createElement("div", { className: "app" },
        React.createElement("header", { className: "app-header" },
            React.createElement("h1", null, "Detached Style Token Mapper"),
            React.createElement("p", { className: "app-description" }, "Find and fix detached styles by mapping them to variables from connected libraries.")),
        React.createElement("main", { className: "app-content" },
            React.createElement(ScanControls, { onScan: handleScan, onCancel: handleCancel, isLoading: isLoading, hasResults: results.length > 0, selectedFixesCount: selectedFixes.size, onApplyFixes: handleApplyFixes }),
            statusMessage && (React.createElement(StatusMessage, { message: statusMessage, isError: isError })),
            results.length > 0 && (React.createElement(ResultsList, { results: results, selectedFixes: selectedFixes, onFixSelection: handleFixSelection })))));
};
