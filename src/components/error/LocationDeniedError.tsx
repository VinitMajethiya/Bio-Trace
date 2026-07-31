import React from 'react';
import { BioErrorState } from './BioErrorState';

interface LocationDeniedErrorProps {
  onGrantPermission?: () => void;
}

export const LocationDeniedError: React.FC<LocationDeniedErrorProps> = ({ onGrantPermission }) => {
  return (
    <BioErrorState
      icon="location-outline"
      title="Outside Pilot Zone"
      message="Species logging requires GPS check-in within the SGU Campus Pilot Zone. Enable testing mode in settings to proceed."
      onRetry={onGrantPermission}
    />
  );
};
