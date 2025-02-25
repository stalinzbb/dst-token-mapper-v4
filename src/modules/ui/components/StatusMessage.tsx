import React from 'react';
import '../styles/StatusMessage.css';

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  if (!message) return null;
  
  return (
    <div className={`status-message ${type}`}>
      <div className="status-icon">
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'info' && 'ℹ️'}
      </div>
      <div className="status-text">{message}</div>
    </div>
  );
};

export default StatusMessage; 