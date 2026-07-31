import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface GlassBannerProps {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const GlassBanner: React.FC<GlassBannerProps> = ({
  title,
  subtitle,
  icon = 'leaf',
}) => {
  const { colors, radii } = useTheme();

  return (
    <View style={[styles.banner, { borderRadius: radii.xl }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
        <Ionicons name={icon} size={18} color={colors.textInverse} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.subText}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  titleText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
