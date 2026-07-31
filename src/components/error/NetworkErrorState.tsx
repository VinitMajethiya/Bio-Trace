import React from 'react';
import { BioErrorState } from './BioErrorState';

interface NetworkErrorStateProps {
  onRetry?: () => void;
}

export const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({ onRetry }) => {
  return (
    <BioErrorState
      icon="wifi-outline"
      title="No Connection"
      message="You are currently offline. Please check your network connection and try again."
      onRetry={onRetry}
    />
  );
};
