import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { joinHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';

const JoinHouseScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async () => {
    if (!code.trim() || code.trim().length < 4) {
      setError('Please enter a valid invite code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await dispatch(joinHouse(code.trim().toUpperCase())).unwrap();
      navigation.goBack();
    } catch (err) {
      setError(err || 'Invalid invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={48} color={colors.secondary} />
          </View>
          <Text style={styles.iconTitle}>Join a Household</Text>
          <Text style={styles.iconSubtitle}>
            Enter the invite code shared by your roommate to join their household
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Invite Code</Text>
          <TextInput
            value={code}
            onChangeText={(t) => { setCode(t.toUpperCase()); setError(null); }}
            mode="outlined"
            error={!!error}
            style={styles.codeInput}
            outlineColor={colors.border}
            activeOutlineColor={colors.secondary}
            placeholder="Enter invite code"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            mode="contained"
            onPress={handleJoin}
            loading={loading}
            disabled={loading || !code.trim()}
            style={styles.joinButton}
            contentStyle={styles.buttonContent}
            buttonColor={colors.secondary}
            labelStyle={styles.buttonLabel}
            icon="login"
          >
            {loading ? 'Joining...' : 'Join Household'}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('CreateHouse')}
            style={styles.createButton}
            textColor={colors.secondary}
            icon="home-plus-outline"
          >
            Create a New Household
          </Button>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to get an invite code:</Text>
          {[
            'Ask the household admin to share the invite code',
            'The admin can find it in the Members screen',
            'The code is case-insensitive',
          ].map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
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
  content: {
    padding: 24,
    gap: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  iconSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  codeInput: {
    backgroundColor: colors.surface,
    fontSize: 20,
    letterSpacing: 3,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: -8,
  },
  joinButton: {
    borderRadius: 12,
    marginTop: 4,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    borderRadius: 12,
    borderColor: colors.border,
  },
  instructions: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default JoinHouseScreen;
