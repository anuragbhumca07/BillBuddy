import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { setCredentials } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { colors } from '../../utils/theme';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        email.trim().toLowerCase(),
        password
      );
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const { user, accessToken, refreshToken } = await authService.login('demo@billbuddy.app', 'demo123');
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    } catch {
      Alert.alert('Google Sign-In Failed', 'Could not sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Demo mode: auto-login with pre-seeded demo account ────────────────────
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        'demo@billbuddy.app',
        'demo123'
      );
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    } catch (error) {
      Alert.alert('Error', 'Could not start demo. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>BillBuddy</Text>
          <Text style={styles.tagline}>Split bills, share chores</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrors((e) => ({ ...e, email: null }));
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={!!errors.email}
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((e) => ({ ...e, password: null }));
            }}
            mode="outlined"
            secureTextEntry={!showPassword}
            error={!!errors.password}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Google Sign In */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading || demoLoading || googleLoading}>
            {googleLoading ? (
              <Text style={styles.googleBtnText}>Connecting to Google…</Text>
            ) : (
              <>
                <View style={styles.googleIcon}><Text style={styles.googleIconText}>G</Text></View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow2}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || demoLoading || googleLoading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            buttonColor={colors.primary}
            labelStyle={styles.buttonLabel}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Demo Mode Button */}
          <Button
            mode="outlined"
            onPress={handleDemoLogin}
            loading={demoLoading}
            disabled={loading || demoLoading || googleLoading}
            style={styles.demoButton}
            contentStyle={styles.buttonContent}
            textColor={colors.secondary}
            labelStyle={[styles.buttonLabel, { color: colors.secondary }]}
            icon="play-circle-outline"
          >
            {demoLoading ? 'Loading demo…' : 'Try Demo Mode'}
          </Button>
          <Text style={styles.demoHint}>
            Explore with realistic sample data — no account needed
          </Text>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 80,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  form: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: -8,
    marginLeft: 4,
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  demoButton: {
    borderRadius: 12,
    borderColor: colors.secondary,
    borderWidth: 1.5,
  },
  demoHint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -4,
  },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 13, backgroundColor: colors.surface },
  googleIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleIconText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  googleBtnText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  dividerRow2: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
