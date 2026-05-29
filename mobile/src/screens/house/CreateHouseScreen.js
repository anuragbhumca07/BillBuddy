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
import { createHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';

const CreateHouseScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'House name is required';
    else if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(createHouse({ name: name.trim(), address: address.trim() })).unwrap();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create household. Please try again.');
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
            <Ionicons name="home" size={48} color={colors.primary} />
          </View>
          <Text style={styles.iconTitle}>Create Your Household</Text>
          <Text style={styles.iconSubtitle}>
            Set up your home and invite roommates to join
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Household Name *"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: null })); }}
            mode="outlined"
            error={!!errors.name}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="e.g., 123 Main St Apt 4B"
            left={<TextInput.Icon icon="home-outline" />}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            label="Address (optional)"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="Full address of your home"
            left={<TextInput.Icon icon="map-marker-outline" />}
          />

          <Button
            mode="contained"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
            style={styles.createButton}
            contentStyle={styles.buttonContent}
            buttonColor={colors.primary}
            labelStyle={styles.buttonLabel}
            icon="home-plus-outline"
          >
            {loading ? 'Creating...' : 'Create Household'}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('JoinHouse')}
            style={styles.joinButton}
            textColor={colors.primary}
            icon="login"
          >
            Join an Existing Household
          </Button>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>What you get:</Text>
          {[
            { icon: 'receipt-outline', text: 'Track shared expenses and split bills' },
            { icon: 'checkmark-circle-outline', text: 'Manage and assign household chores' },
            { icon: 'megaphone-outline', text: 'Post announcements for everyone to see' },
            { icon: 'document-text-outline', text: 'Set house rules everyone can follow' },
          ].map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name={benefit.icon} size={18} color={colors.primary} />
              <Text style={styles.benefitText}>{benefit.text}</Text>
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
    backgroundColor: colors.primary + '15',
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
  input: {
    backgroundColor: colors.surface,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: -8,
  },
  createButton: {
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
  joinButton: {
    borderRadius: 12,
    borderColor: colors.border,
  },
  benefits: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default CreateHouseScreen;
