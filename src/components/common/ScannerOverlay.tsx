import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface ScannerOverlayProps {
  detectedLabel?: string;
  confidence?: number;
  onFlashToggle?: () => void;
  onMacroToggle?: () => void;
  onManualToggle?: () => void;
  flashOn?: boolean;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  detectedLabel = 'Monarch Butterfly',
  confidence = 98,
  onFlashToggle,
  onMacroToggle,
  onManualToggle,
  flashOn = false,
}) => {
  const { colors, radii } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Central Viewfinder Bounding Box */}
      <View style={styles.centerContainer} pointerEvents="none">
        <View style={[styles.targetBox, { borderColor: colors.primaryLight }]}>
          <View style={[styles.cornerTL, { borderColor: colors.primaryLight }]} />
          <View style={[styles.cornerTR, { borderColor: colors.primaryLight }]} />
          <View style={[styles.cornerBL, { borderColor: colors.primaryLight }]} />
          <View style={[styles.cornerBR, { borderColor: colors.primaryLight }]} />

          {/* Tag Pill */}
          <View style={[styles.tagPill, { backgroundColor: colors.primary, borderRadius: radii.pill }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.textInverse} />
            <Text style={[styles.tagText, { color: colors.textInverse }]}>
              {detectedLabel} ({confidence}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Right Toolbar Controls */}
      <View style={styles.rightToolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={onFlashToggle} activeOpacity={0.7}>
          <Ionicons name={flashOn ? 'flash' : 'flash-outline'} size={20} color="#FFFFFF" />
          <Text style={styles.toolLabel}>FLASH</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={onMacroToggle} activeOpacity={0.7}>
          <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
          <Text style={styles.toolLabel}>MACRO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={onManualToggle} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          <Text style={styles.toolLabel}>MANUAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBox: {
    width: 220,
    height: 220,
    borderWidth: 1.5,
    borderRadius: 16,
    borderStyle: 'dashed',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rightToolbar: {
    position: 'absolute',
    right: 16,
    top: '30%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 16,
    alignItems: 'center',
  },
  toolBtn: {
    alignItems: 'center',
    gap: 2,
  },
  toolLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
