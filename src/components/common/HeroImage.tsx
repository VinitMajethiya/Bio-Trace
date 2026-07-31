import React, { useState } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { StatusBadge } from './StatusBadge';

interface HeroImageProps {
  uri: string;
  badgeLabel?: string;
  moduleLabel?: string;
  titleOverlay?: string;
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  uri,
  badgeLabel = 'VERIFIED',
  moduleLabel = 'WILD MODULE',
  titleOverlay,
  height = 200,
  style,
}) => {
  const { colors, radii } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fallbackUri = 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=800';

  return (
    <View style={[styles.container, { height, borderRadius: radii['2xl'], backgroundColor: colors.surfaceSecondary }]}>
      <Image
        source={{ uri: error ? fallbackUri : uri }}
        style={[styles.image, { borderRadius: radii['2xl'] }, style]}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      )}

      {badgeLabel && (
        <View style={styles.topBadge}>
          <StatusBadge label={badgeLabel} variant="success" icon="checkmark-circle" />
        </View>
      )}

      {(moduleLabel || titleOverlay) && (
        <View style={styles.bottomOverlay}>
          {moduleLabel && <StatusBadge label={moduleLabel} variant="module" style={styles.moduleTag} />}
          {titleOverlay && <View>{/* Title overlay text handled by parent if needed */}</View>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 247, 245, 0.6)',
  },
  topBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  moduleTag: {
    marginBottom: 4,
  },
});
