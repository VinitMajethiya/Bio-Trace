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
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const AuthScreen: React.FC = () => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

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
        console.log(`[AuthScreen] Submitting Sign Up for: ${cleanEmail}`);
        const { data, error } = await signUpWithEmail(cleanEmail, password, displayName.trim());
        if (error) {
          console.error('[AuthScreen] Sign Up Error:', error);
          Alert.alert('Sign Up Failed', `${error.message} (Code: ${error.status || 'N/A'})`);
        } else if (!data?.session && !data?.user?.email_confirmed_at) {
          Alert.alert(
            'Confirmation Required',
            'Account created! However, email confirmation is enabled in your Supabase Auth settings. Please check your inbox or disable "Confirm email" in Supabase Auth -> Providers -> Email.'
          );
        } else {
          Alert.alert('Success', 'Account created and logged in!');
        }
      } else {
        console.log(`[AuthScreen] Submitting Sign In for: ${cleanEmail}`);
        const { error } = await signInWithEmail(cleanEmail, password);
        if (error) {
          console.error('[AuthScreen] Sign In Error:', error);
          Alert.alert('Sign In Failed', `${error.message} (Code: ${error.status || 'N/A'})`);
        }
      }
    } catch (e: any) {
      console.error('[AuthScreen] Exception in handleSubmit:', e);
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf-sharp" size={42} color="#10B981" />
          </View>
          <Text style={styles.title}>EcoQuest</Text>
          <Text style={styles.subtitle}>
            Wild Biodiversity Game ✕ Circular Recycling Marketplace
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isSignUp ? 'Create your Eco Account' : 'Welcome Back'}
          </Text>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6EE7B7" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. EcoExplorer"
                  placeholderTextColor="#4B5563"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#6EE7B7" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#4B5563"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#6EE7B7" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#4B5563"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0B1912" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin}>
            <Ionicons name="flash-outline" size={18} color="#F59E0B" />
            <Text style={styles.demoButtonText}>Fill Demo Credentials</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchModeText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#6EE7B7" />
          <Text style={styles.footerNoteText}>
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
    backgroundColor: '#07120E',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ECFDF5',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#0F241C',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F0FDF4',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7F3D0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071610',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F3A2E',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#ECFDF5',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#042F2E',
    fontSize: 16,
    fontWeight: '700',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    height: 44,
    marginTop: 12,
    gap: 6,
  },
  demoButtonText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '600',
  },
  switchMode: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '500',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerNoteText: {
    color: '#6B7280',
    fontSize: 12,
  },
});
