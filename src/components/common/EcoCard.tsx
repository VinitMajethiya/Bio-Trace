import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { BioCard } from './BioCard';

interface EcoCardProps {
  title: string;
  type: 'health' | 'role';
  valueText: string;
  subText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const EcoCard: React.FC<EcoCardProps> = ({
  title,
  type,
  valueText,
  subText,
  icon,
}) => {
  const { colors } = useTheme();

  return (
    <BioCard variant="outlined" padding={14} style={styles.container}>
      <View style={styles.headerRow}>
        {icon && <Ionicons name={icon} size={14} color={colors.primary} />}
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      </View>

      {type === 'health' ? (
        <View style={styles.healthRow}>
          <View style={[styles.ring, { borderColor: colors.primary }]}>
            <Text style={[styles.ringText, { color: colors.primaryDark }]}>{valueText}</Text>
          </View>
          {subText && <Text style={[styles.subText, { color: colors.textSecondary }]}>{subText}</Text>}
        </View>
      ) : (
        <View style={styles.quoteBox}>
          <Text style={[styles.quoteText, { color: colors.textPrimary }]}>{`"${valueText}"`}</Text>
        </View>
      )}
    </BioCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  healthRow: {
    gap: 8,
    marginTop: 6,
  },
  ring: {
    borderWidth: 3,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  ringText: {
    fontSize: 16,
    fontWeight: '800',
  },
  subText: {
    fontSize: 11,
    lineHeight: 14,
  },
  quoteBox: {
    marginTop: 6,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    fontWeight: '500',
  },
});
