import React, { useState, useEffect } from 'react';
import ScanControls from './ScanControls';
import ResultsList from './ResultsList';
import StatusMessage from './StatusMessage';
import { DetachedStyle, MatchResult, PluginMessage, UIMessage } from '../../../types';
import '../styles/App.css';

const App: React.FC = () => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detachedStyles, setDetachedStyles] = useState<DetachedStyle[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedFixes, setSelectedFixes] = useState<{ [id: string]: string }>({});
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isApplyingFixes, setIsApplyingFixes] = useState<boolean>(false);
  
  useEffect(() => {
    // Listen for messages from the plugin
    window.onmessage = (event) => {
      const message = event.data.pluginMessage as PluginMessage;
      
      if (!message) return;
      
      switch (message.type) {
        case 'scan-complete':
          setIsScanning(false);
          setDetachedStyles(message.detachedStyles || []);
          setMatchResults(message.matchResults || []);
          setStatusMessage(message.errorMessage || 'Scan complete');
          setStatusType(message.errorMessage ? 'error' : 'success');
          break;
          
        case 'apply-complete':
          setIsApplyingFixes(false);
          setStatusMessage(message.errorMessage || 'Fixes applied successfully');
          setStatusType(message.errorMessage ? 'error' : 'success');
          
          // Clear selections if successful
          if (!message.errorMessage) {
            setSelectedFixes({});
            setDetachedStyles([]);
            setMatchResults([]);
          }
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    };
  }, []);
  
  const handleScan = (useSelection: boolean) => {
    setIsScanning(true);
    setStatusMessage('Scanning for detached styles...');
    setStatusType('info');
    setDetachedStyles([]);
    setMatchResults([]);
    setSelectedFixes({});
    
    const message: UIMessage = {
      type: 'scan',
      useSelection
    };
    
    parent.postMessage({ pluginMessage: message }, '*');
  };
  
  const handleApplyFixes = () => {
    if (Object.keys(selectedFixes).length === 0) {
      setStatusMessage('No fixes selected');
      setStatusType('error');
      return;
    }
    
    setIsApplyingFixes(true);
    setStatusMessage('Applying fixes...');
    setStatusType('info');
    
    const fixesToApply = Object.entries(selectedFixes).map(([detachedStyleId, variableId]) => ({
      detachedStyleId,
      variableId
    }));
    
    const message: UIMessage = {
      type: 'apply-fixes',
      fixes: fixesToApply
    };
    
    parent.postMessage({ pluginMessage: message }, '*');
  };
  
  const handleCancel = () => {
    const message: UIMessage = {
      type: 'cancel'
    };
    
    parent.postMessage({ pluginMessage: message }, '*');
  };
  
  const handleSelectFix = (detachedStyleId: string, variableId: string) => {
    setSelectedFixes(prev => ({
      ...prev,
      [detachedStyleId]: variableId
    }));
  };
  
  const hasResults = detachedStyles.length > 0;
  const selectedFixesCount = Object.keys(selectedFixes).length;
  
  return (
    <div className="app">
      <h1 className="app-title">Detached Style Token Mapper</h1>
      
      <StatusMessage 
        message={statusMessage} 
        type={statusType} 
      />
      
      <ScanControls 
        onScan={handleScan}
        isScanning={isScanning}
      />
      
      {hasResults && (
        <>
          <ResultsList 
            detachedStyles={detachedStyles}
            matchResults={matchResults}
            selectedFixes={selectedFixes}
            onSelectFix={handleSelectFix}
          />
          
          <div className="action-buttons">
            <button 
              className="apply-button" 
              onClick={handleApplyFixes}
              disabled={isApplyingFixes || selectedFixesCount === 0}
            >
              Apply {selectedFixesCount} Fixes
            </button>
            
            <button 
              className="cancel-button" 
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App; 