import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { DarkCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { FilterPill } from '../../components/common/FilterChip';
import { InputContainer } from '../../components/common/InputContainer';

export const AuthScreen: React.FC = () => {
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const initialMode = route.params?.initialMode;
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialMode) {
      setIsSignUp(initialMode === 'signup');
    }
  }, [initialMode]);

  const handleSubmit = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(cleanEmail, password, displayName.trim());
        if (error) {
          setErrorMsg(error.message);
        } else if (!data?.session && !data?.user?.email_confirmed_at) {
          Alert.alert(
            'Confirmation Required',
            'Account created! Please check your email or disable confirmation in Supabase Auth.'
          );
        } else {
          Alert.alert('Success', 'Account created and logged in!');
        }
      } else {
        const { error } = await signInWithEmail(cleanEmail, password);
        if (error) {
          setErrorMsg(error.message);
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('explorer@ecoquest.demo');
    setPassword('DemoUser123!');
    setIsSignUp(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: colors.mint_background || '#D9F3E9', borderColor: colors.outline_variant || '#BCCABD', borderWidth: 1.5 }]}>
            <Ionicons name="leaf-sharp" size={42} color={colors.green_vivid || '#2BB673'} />
          </View>
          <Text style={[styles.title, { color: colors.text_airy_primary || '#161d18' }]}>EcoQuest</Text>
          <Text style={[styles.subtitle, { color: colors.text_airy_secondary || '#3d4a40' }]}>
            Wild Biodiversity Game ✕ Circular Recycling Marketplace
          </Text>
        </View>

        <DarkCard padding={24} style={styles.card}>
          {/* Mode Switcher Tabs */}
          <View style={styles.tabRow}>
            <FilterPill
              label="Sign In"
              active={!isSignUp}
              onPress={() => setIsSignUp(false)}
              canvas="warm"
              style={{ flex: 1, justifyContent: 'center' }}
            />
            <FilterPill
              label="Sign Up"
              active={isSignUp}
              onPress={() => setIsSignUp(true)}
              canvas="warm"
              style={{ flex: 1, justifyContent: 'center' }}
            />
          </View>

          {isSignUp && (
            <InputContainer
              label="Display Name"
              icon="person-outline"
              placeholder="e.g. EcoExplorer"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              editable={!loading}
              canvas="warm"
            />
          )}

          <InputContainer
            label="Email Address"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            canvas="warm"
          />

          <InputContainer
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            canvas="warm"
          />

          {!!errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: colors.danger_subtle || '#FFDAD6' }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger || '#BA1A1A'} />
              <Text style={[styles.inlineError, { color: colors.danger || '#BA1A1A' }]}>{errorMsg}</Text>
            </View>
          )}

          <PrimaryButton
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
          />

          <SecondaryButton
            title="Fill Demo Credentials"
            icon="flash-outline"
            onPress={handleDemoLogin}
            disabled={loading}
            style={styles.demoBtn}
          />
        </DarkCard>

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.green_vivid || '#2BB673'} />
          <Text style={[styles.footerNoteText, { color: colors.text_airy_secondary || '#3d4a40' }]}>
            Unified auth for Wild XP & Circular GreenPoints
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  card: {
    gap: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  inlineError: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
  },
  demoBtn: {
    marginTop: 4,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerNoteText: {
    fontSize: 12,
  },
});
