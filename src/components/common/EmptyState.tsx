import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  message?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  onRetry?: () => void;
  canvas?: 'dark' | 'warm';
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'leaf-outline',
  title,
  description,
  message,
  actionTitle,
  onActionPress,
  onRetry,
  canvas = 'dark',
  style,
}) => {
  const { colors } = useTheme();

  const isDark = canvas === 'dark';
  const bodyText = message || description || '';

  const textColor = isDark ? colors.text_on_dark_primary || '#F0F7F1' : colors.text_on_warm_primary || '#142217';
  const subColor = isDark ? colors.text_on_dark_secondary || '#8DB89A' : colors.text_on_warm_secondary || '#3E6B48';
  const iconColor = isDark ? colors.text_on_dark_secondary || '#8DB89A' : colors.green_vivid || '#4CAF72';

  const handlePress = onActionPress || onRetry;
  const buttonLabel = actionTitle || (onRetry ? 'Try Again' : undefined);

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={48} color={iconColor} style={styles.icon} />
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {!!bodyText && <Text style={[styles.description, { color: subColor }]}>{bodyText}</Text>}

      {buttonLabel && handlePress && (
        <PrimaryButton title={buttonLabel} onPress={handlePress} style={styles.actionBtn} size="sm" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 16,
    minWidth: 140,
  },
});
