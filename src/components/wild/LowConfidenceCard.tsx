import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface LowConfidenceCardProps {
  onRetake: () => void;
}

export const LowConfidenceCard: React.FC<LowConfidenceCardProps> = ({ onRetake }) => {
  const { colors, radii } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface_dark || '#1A2B1A',
          borderRadius: radii.card_primary || 32,
          borderColor: colors.amber || '#E8A920',
        },
      ]}
    >
      <View style={[styles.iconBg, { backgroundColor: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)' }]}>
        <Ionicons name="alert-circle-outline" size={38} color={colors.amber || '#E8A920'} />
      </View>

      <Text style={[styles.title, { color: colors.text_on_dark_primary || '#E8F0E8' }]}>We're Not Sure</Text>

      <Text style={[styles.body, { color: colors.text_on_dark_secondary || '#9AB09A' }]}>
        The AI vision model couldn't identify this species with sufficient confidence. Try snapping a clearer photo with better lighting or closer framing.
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.amber || '#E8A920', borderRadius: radii.pill }]}
        onPress={onRetake}
        activeOpacity={0.8}
      >
        <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>Retake Photo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A2B1A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8A920',
    gap: 12,
    marginVertical: 16,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(232, 169, 32, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E8F0E8',
  },
  body: {
    fontSize: 14,
    color: '#9AB09A',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF72',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
