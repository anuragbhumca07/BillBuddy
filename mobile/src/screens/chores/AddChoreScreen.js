import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { addChore } from '../../store/slices/choreSlice';
import { fetchMembers, selectMembers } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';

const FREQUENCIES = [
  { key: 'Once', label: 'Once', icon: '1x' },
  { key: 'Daily', label: 'Daily', icon: 'D' },
  { key: 'Weekly', label: 'Weekly', icon: 'W' },
  { key: 'Monthly', label: 'Monthly', icon: 'M' },
];

const AddChoreScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const members = useSelector(selectMembers);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('Weekly');
  const [assignedTo, setAssignedTo] = useState(null);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!assignedTo) newErrors.assignedTo = 'Please select a member to assign';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(
        addChore({
          title: title.trim(),
          description: description.trim(),
          frequency,
          assignedTo,
          dueDate,
        })
      ).unwrap();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to add chore. Please try again.');
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
        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chore Details</Text>

          <TextInput
            label="Title"
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: null })); }}
            mode="outlined"
            error={!!errors.title}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="e.g., Clean the kitchen"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="Any specific instructions..."
          />

          <TextInput
            label="Due Date"
            value={dueDate}
            onChangeText={setDueDate}
            mode="outlined"
            error={!!errors.dueDate}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="YYYY-MM-DD"
          />
          {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.frequencyGrid}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.key}
                style={[
                  styles.frequencyChip,
                  frequency === freq.key && styles.frequencyChipSelected,
                ]}
                onPress={() => setFrequency(freq.key)}
              >
                <Text
                  style={[
                    styles.frequencyLabel,
                    frequency === freq.key && styles.frequencyLabelSelected,
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Assign To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign To</Text>
          {errors.assignedTo && <Text style={styles.errorText}>{errors.assignedTo}</Text>}
          <View style={styles.membersGrid}>
            {members.map((member) => {
              const memberId = member.user?.id || member.id;
              const memberUser = member.user || member;
              const isSelected = assignedTo === memberId;

              return (
                <TouchableOpacity
                  key={memberId}
                  style={[styles.memberTile, isSelected && styles.memberTileSelected]}
                  onPress={() => {
                    setAssignedTo(memberId);
                    setErrors((e) => ({ ...e, assignedTo: null }));
                  }}
                >
                  <MemberAvatar user={memberUser} size={44} />
                  <Text
                    style={[styles.memberName, isSelected && styles.memberNameSelected]}
                    numberOfLines={1}
                  >
                    {memberUser?.name?.split(' ')[0] || 'Unknown'}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          buttonColor={colors.primary}
          labelStyle={styles.submitButtonLabel}
        >
          {loading ? 'Adding...' : 'Add Chore'}
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
  textArea: {
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: -4,
  },
  frequencyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  frequencyChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  frequencyLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  frequencyLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  memberTile: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    position: 'relative',
    gap: 6,
  },
  memberTileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  memberName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  memberNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
});

export default AddChoreScreen;
