import React from 'react';
import { StyleSheet, View, Image, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export interface BioCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'subtle' | 'hero' | 'compact' | 'inset' | 'dark' | 'warm';
  padding?: number;
  imageSrc?: string;
  imageHeight?: number;
}

export const BioCard: React.FC<BioCardProps> = ({
  children,
  style,
  variant = 'dark',
  padding = 20,
  imageSrc,
  imageHeight = 160,
}) => {
  const { colors, radii, shadows } = useTheme();

  const getRadius = (): number => {
    switch (variant) {
      case 'hero':
        return radii.card_hero || 36;
      case 'warm':
      case 'compact':
        return radii.card_secondary || 20; // 20px
      case 'inset':
        return radii.sm; // 12px
      case 'dark':
      default:
        return radii.card_primary || 32; // 32px
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: colors.outline_variant || '#BCCABD',
        };
      case 'subtle':
        return {
          backgroundColor: colors.mint_background || '#D9F3E9',
          borderWidth: 0,
        };
      case 'inset':
        return {
          backgroundColor: colors.mint_background || '#D9F3E9',
          borderWidth: 0,
        };
      case 'warm':
      case 'dark':
      case 'hero':
      case 'compact':
      case 'elevated':
      default:
        return {
          backgroundColor: '#FFFFFF',
          ...shadows.airy_float,
        };
    }
  };

  const radiusVal = getRadius();

  return (
    <View
      style={[
        styles.card,
        { borderRadius: radiusVal },
        getVariantStyle(),
        style,
      ]}
    >
      {imageSrc && (
        <Image
          source={{ uri: imageSrc }}
          style={[
            styles.cardImage,
            { height: imageHeight, borderTopLeftRadius: radiusVal, borderTopRightRadius: radiusVal },
          ]}
        />
      )}
      <View style={{ padding }}>{children}</View>
    </View>
  );
};

export const DarkCard: React.FC<BioCardProps> = (props) => <BioCard {...props} variant="dark" />;
export const WarmCard: React.FC<BioCardProps> = (props) => <BioCard {...props} variant="warm" />;
export const AiryCard: React.FC<BioCardProps> = (props) => <BioCard {...props} variant="hero" />;

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    resizeMode: 'cover',
  },
});
