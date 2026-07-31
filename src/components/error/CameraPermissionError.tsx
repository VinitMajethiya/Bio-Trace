import React from 'react';
import { BioErrorState } from './BioErrorState';

interface CameraPermissionErrorProps {
  onGrantPermission?: () => void;
}

export const CameraPermissionError: React.FC<CameraPermissionErrorProps> = ({ onGrantPermission }) => {
  return (
    <BioErrorState
      icon="camera-outline"
      title="Camera Permission Required"
      message="BioVerse needs camera access to identify species and scan waste items."
      onRetry={onGrantPermission}
    />
  );
};
