import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { BioCard } from '../common/BioCard';
import { PrimaryButton } from '../common/PrimaryButton';

interface BioErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const BioErrorState: React.FC<BioErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  icon = 'alert-circle-outline',
}) => {
  const { colors } = useTheme();

  return (
    <BioCard variant="outlined" padding={20} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
        <Ionicons name={icon} size={32} color={colors.textDanger} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && <PrimaryButton title="Try Again" onPress={onRetry} style={styles.retryBtn} />}
    </BioCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    margin: 16,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    width: '100%',
  },
});
