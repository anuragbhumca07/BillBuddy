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
import { addAnnouncement } from '../../store/slices/announcementSlice';
import { colors } from '../../utils/theme';

const AddAnnouncementScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!message.trim()) newErrors.message = 'Message is required';
    else if (message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(
        addAnnouncement({ title: title.trim(), message: message.trim() })
      ).unwrap();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to post announcement. Please try again.');
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Announcements are visible to all household members. Use them for important updates,
            reminders, or shared information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcement Details</Text>

          <TextInput
            label="Title"
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: null })); }}
            mode="outlined"
            error={!!errors.title}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.secondary}
            placeholder="e.g., Rent due on Friday"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <TextInput
            label="Message"
            value={message}
            onChangeText={(t) => { setMessage(t); setErrors((e) => ({ ...e, message: null })); }}
            mode="outlined"
            multiline
            numberOfLines={6}
            error={!!errors.message}
            style={[styles.input, styles.messageInput]}
            outlineColor={colors.border}
            activeOutlineColor={colors.secondary}
            placeholder="Write your announcement here..."
          />
          {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}

          <Text style={styles.charCount}>
            {message.length} characters
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          buttonColor={colors.secondary}
          labelStyle={styles.submitButtonLabel}
        >
          {loading ? 'Posting...' : 'Post Announcement'}
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          textColor={colors.textSecondary}
        >
          Cancel
        </Button>
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
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: colors.secondary + '12',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
  },
  messageInput: {
    minHeight: 120,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: -4,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: -4,
  },
  submitButton: {
    borderRadius: 14,
    marginTop: 4,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: colors.border,
  },
});

export default AddAnnouncementScreen;
