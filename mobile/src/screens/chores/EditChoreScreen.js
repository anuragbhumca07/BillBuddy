import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateChore, fetchChoreDetail,
  selectSelectedChore, selectChoreLoading,
} from '../../store/slices/choreSlice';
import { fetchMembers, selectMembers, selectHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';

const FREQUENCIES = [
  { key: 'once', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const PRIORITIES = [
  { key: 'low', label: 'Low', color: colors.success },
  { key: 'medium', label: 'Medium', color: colors.warning },
  { key: 'high', label: 'High', color: colors.danger },
];

const EditChoreScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { choreId } = route.params || {};
  const chore = useSelector(selectSelectedChore);
  const choreLoading = useSelector(selectChoreLoading);
  const reduxMembers = useSelector(selectMembers);
  const house = useSelector(selectHouse);

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency]     = useState('weekly');
  const [priority, setPriority]       = useState('medium');
  const [assignedTo, setAssignedTo]   = useState(null);
  const [dueDate, setDueDate]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});
  const [initialized, setInitialized] = useState(false);

  const baseMembers = reduxMembers.length > 0 ? reduxMembers : (house?.members || []);

  useEffect(() => {
    dispatch(fetchMembers());
    if (choreId) dispatch(fetchChoreDetail(choreId));
  }, [choreId, dispatch]);

  useEffect(() => {
    if (chore && chore.id === choreId && !initialized) {
      setTitle(chore.title || '');
      setDescription(chore.description || '');
      setFrequency((chore.frequency || chore.recurring || 'weekly').toLowerCase());
      setPriority(chore.priority || 'medium');
      setAssignedTo(chore.assignedTo?.id || chore.assigned_to || null);
      setDueDate((chore.dueDate || chore.due_date || '').split('T')[0]);
      setInitialized(true);
    }
  }, [chore, choreId, initialized]);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!assignedTo) errs.assignedTo = 'Please select a person to assign';
    if (!dueDate) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(updateChore({
        choreId,
        data: { title: title.trim(), description: description.trim(), frequency, priority, assigned_to: assignedTo, due_date: dueDate },
      })).unwrap();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', typeof err === 'string' ? err : 'Failed to update chore.');
    } finally {
      setLoading(false);
    }
  };

  if (choreLoading && !initialized) return <LoadingSpinner fullScreen message="Loading chore..." />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chore Details</Text>
          <TextInput label="Title" value={title} onChangeText={t => { setTitle(t); setErrors(e => ({...e, title: null})); }}
            mode="outlined" error={!!errors.title} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} />
          {errors.title && <Text style={styles.err}>{errors.title}</Text>}

          <TextInput label="Description (optional)" value={description} onChangeText={setDescription}
            mode="outlined" multiline numberOfLines={2} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} />

          <TextInput label="Due Date" value={dueDate} onChangeText={t => { setDueDate(t); setErrors(e => ({...e, dueDate: null})); }}
            mode="outlined" error={!!errors.dueDate} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} placeholder="YYYY-MM-DD" />
          {errors.dueDate && <Text style={styles.err}>{errors.dueDate}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.freqGrid}>
            {FREQUENCIES.map(f => (
              <TouchableOpacity key={f.key} style={[styles.freqChip, frequency === f.key && styles.freqChipSelected]} onPress={() => setFrequency(f.key)}>
                <Text style={[styles.freqText, frequency === f.key && styles.freqTextSelected]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p.key}
                style={[styles.priorityBtn, priority === p.key && { borderColor: p.color, backgroundColor: p.color + '18' }]}
                onPress={() => setPriority(p.key)}>
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text style={[styles.priorityText, priority === p.key && { color: p.color, fontWeight: '700' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign To</Text>
          {errors.assignedTo && <Text style={styles.err}>{errors.assignedTo}</Text>}
          <View style={styles.membersGrid}>
            {baseMembers.map(member => {
              const memberId = member.user?.id || member.id;
              const memberUser = member.user || member;
              const isSelected = assignedTo === memberId;
              return (
                <TouchableOpacity key={memberId}
                  style={[styles.memberTile, isSelected && styles.memberTileSelected]}
                  onPress={() => { setAssignedTo(memberId); setErrors(e => ({...e, assignedTo: null})); }}>
                  <MemberAvatar user={memberUser} size={44} />
                  <Text style={[styles.memberName, isSelected && styles.memberNameSelected]} numberOfLines={1}>
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

        <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading}
          style={styles.submitBtn} contentStyle={styles.submitContent}
          buttonColor={colors.primary} labelStyle={styles.submitLabel}>
          {loading ? 'Saving…' : 'Save Changes'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.surface },
  err: { fontSize: 12, color: colors.danger, marginTop: -4 },
  freqGrid: { flexDirection: 'row', gap: 8 },
  freqChip: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.background },
  freqChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  freqText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  freqTextSelected: { color: colors.primary, fontWeight: '700' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  priorityText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  membersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  memberTile: { width: 80, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background, position: 'relative', gap: 6 },
  memberTileSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  memberName: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  memberNameSelected: { color: colors.primary, fontWeight: '600' },
  selectedIndicator: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  selectedIndicatorText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  submitBtn: { borderRadius: 14, marginTop: 4 },
  submitContent: { paddingVertical: 6 },
  submitLabel: { fontSize: 16, fontWeight: '600' },
});

export default EditChoreScreen;
