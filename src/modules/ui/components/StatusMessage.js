import React from 'react';
import '../styles/StatusMessage.css';
export const StatusMessage = ({ message, isError }) => {
    return (React.createElement("div", { className: `status-message ${isError ? 'error' : 'success'}` },
        React.createElement("span", { className: "status-icon" }, isError ? '⚠️' : '✅'),
        React.createElement("span", { className: "status-text" }, message)));
};
