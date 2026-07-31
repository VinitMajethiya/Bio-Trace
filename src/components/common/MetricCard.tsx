import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { BioCard } from './BioCard';

interface MetricCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, valueColor }) => {
  const { colors } = useTheme();

  return (
    <BioCard variant="subtle" padding={14} style={styles.card}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor || colors.textPrimary }]}>{value}</Text>
    </BioCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
});
