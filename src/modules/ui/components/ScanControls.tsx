import React, { useState } from 'react';
import '../styles/ScanControls.css';

interface ScanControlsProps {
  onScan: (useSelection: boolean) => void;
  isScanning: boolean;
}

const ScanControls: React.FC<ScanControlsProps> = ({
  onScan,
  isScanning
}) => {
  const [useSelection, setUseSelection] = useState<boolean>(false);
  
  const handleScanClick = () => {
    onScan(useSelection);
  };
  
  return (
    <div className="scan-controls">
      <div className="scan-options">
        <label className="scan-option">
          <input
            type="radio"
            name="scanScope"
            checked={!useSelection}
            onChange={() => setUseSelection(false)}
            disabled={isScanning}
          />
          <span>Current Page</span>
        </label>
        <label className="scan-option">
          <input
            type="radio"
            name="scanScope"
            checked={useSelection}
            onChange={() => setUseSelection(true)}
            disabled={isScanning}
          />
          <span>Selection Only</span>
        </label>
      </div>
      <button 
        className="scan-button" 
        onClick={handleScanClick}
        disabled={isScanning}
      >
        {isScanning ? 'Scanning...' : 'Scan for Detached Styles'}
      </button>
    </div>
  );
};

export default ScanControls; 