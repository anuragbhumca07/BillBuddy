import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { setCredentials } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { colors } from '../../utils/theme';

// Mock Google names for demo
const GOOGLE_DEMO_ACCOUNTS = [
  { name: 'Alex Johnson', email: 'alex.johnson@gmail.com' },
  { name: 'Jordan Smith', email: 'jordan.smith@gmail.com' },
  { name: 'Taylor Brown', email: 'taylor.brown@gmail.com' },
];

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [googleLoading, setGoogleLoading]     = useState(false);
  const [errors, setErrors]                   = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.register(name.trim(), email.trim().toLowerCase(), password);
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      // Simulate Google OAuth — pick a demo account
      const account = GOOGLE_DEMO_ACCOUNTS[Math.floor(Math.random() * GOOGLE_DEMO_ACCOUNTS.length)];
      await new Promise(r => setTimeout(r, 1200)); // Simulate OAuth delay
      const { user, accessToken, refreshToken } = await authService.register(account.name, account.email, 'google-oauth-token');
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    } catch (error) {
      Alert.alert('Google Sign-Up Failed', 'Could not sign up with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={32} color="#fff" />
          </View>
          <Text style={styles.appName}>BillBuddy</Text>
          <Text style={styles.tagline}>Join your household today</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Fill in the details below to get started</Text>

          {/* Google Sign Up */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignUp} disabled={googleLoading || loading}>
            {googleLoading ? (
              <Text style={styles.googleBtnText}>Connecting to Google…</Text>
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>or sign up with email</Text>
            <View style={styles.divLine} />
          </View>

          <TextInput label="Full Name" value={name} onChangeText={t => { setName(t); setErrors(e => ({...e, name: null})); }}
            mode="outlined" autoCapitalize="words" autoCorrect={false} error={!!errors.name}
            left={<TextInput.Icon icon="account-outline" />} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} />
          {errors.name && <Text style={styles.err}>{errors.name}</Text>}

          <TextInput label="Email" value={email} onChangeText={t => { setEmail(t); setErrors(e => ({...e, email: null})); }}
            mode="outlined" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            error={!!errors.email} left={<TextInput.Icon icon="email-outline" />} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} />
          {errors.email && <Text style={styles.err}>{errors.email}</Text>}

          <TextInput label="Password" value={password} onChangeText={t => { setPassword(t); setErrors(e => ({...e, password: null})); }}
            mode="outlined" secureTextEntry={!showPassword} error={!!errors.password}
            left={<TextInput.Icon icon="lock-outline" />}
            right={<TextInput.Icon icon={showPassword ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowPassword(v => !v)} />}
            style={styles.input} outlineColor={colors.border} activeOutlineColor={colors.primary} />
          {errors.password && <Text style={styles.err}>{errors.password}</Text>}

          <TextInput label="Confirm Password" value={confirmPassword} onChangeText={t => { setConfirmPassword(t); setErrors(e => ({...e, confirmPassword: null})); }}
            mode="outlined" secureTextEntry={!showConfirm} error={!!errors.confirmPassword}
            left={<TextInput.Icon icon="lock-check-outline" />}
            right={<TextInput.Icon icon={showConfirm ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowConfirm(v => !v)} />}
            style={styles.input} outlineColor={colors.border} activeOutlineColor={colors.primary} />
          {errors.confirmPassword && <Text style={styles.err}>{errors.confirmPassword}</Text>}

          <Button mode="contained" onPress={handleRegister} loading={loading} disabled={loading || googleLoading}
            style={styles.registerBtn} contentStyle={styles.btnContent}
            buttonColor={colors.primary} labelStyle={styles.btnLabel}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { backgroundColor: colors.primary, paddingTop: 56, paddingBottom: 40, alignItems: 'center', gap: 8, position: 'relative' },
  backButton: { position: 'absolute', top: 56, left: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  form: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, flex: 1, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 13, backgroundColor: colors.surface },
  googleIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleIconText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  googleBtnText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { fontSize: 12, color: colors.textSecondary },
  input: { backgroundColor: colors.surface },
  err: { fontSize: 12, color: colors.danger, marginTop: -8, marginLeft: 4 },
  registerBtn: { borderRadius: 12, marginTop: 8 },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  loginText: { fontSize: 14, color: colors.textSecondary },
  loginLink: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});

export default RegisterScreen;
