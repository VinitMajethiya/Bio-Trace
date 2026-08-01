import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { BioCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { OnboardingScreen } from '../onboarding/OnboardingScreen';

export const AuthScreen: React.FC = () => {
  const { colors, radii } = useTheme();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert('Required Field', 'Please enter your email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(cleanEmail, password, displayName.trim());
        if (error) {
          Alert.alert('Sign Up Failed', `${error.message}`);
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
          Alert.alert('Sign In Failed', `${error.message}`);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An unexpected error occurred.');
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primarySubtle, borderColor: colors.primary }]}>
            <Ionicons name="leaf-sharp" size={42} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primaryDark }]}>BioVerse</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Wild Biodiversity Game ✕ Circular Recycling Marketplace
          </Text>
        </View>

        <BioCard variant="elevated" padding={24} style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {isSignUp ? 'Create your BioVerse Account' : 'Welcome Back'}
          </Text>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Display Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="e.g. EcoExplorer"
                  placeholderTextColor={colors.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <PrimaryButton
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />

          <SecondaryButton
            title="Fill Demo Credentials"
            icon="flash-outline"
            onPress={handleDemoLogin}
            style={styles.demoBtn}
          />

          <TouchableOpacity style={styles.switchMode} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={[styles.switchModeText, { color: colors.primary }]}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </BioCard>

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
          <Text style={[styles.footerNoteText, { color: colors.textSecondary }]}>
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
    marginBottom: 28,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
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
    gap: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
  },
  submitBtn: {
    marginTop: 8,
  },
  demoBtn: {
    marginTop: 4,
  },
  switchMode: {
    marginTop: 12,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 13,
    fontWeight: '700',
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
