import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, TextInput as RNTextInput,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { addChore } from '../../store/slices/choreSlice';
import { fetchMembers, selectMembers, selectHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';

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

const AddChoreScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const reduxMembers = useSelector(selectMembers);
  const house = useSelector(selectHouse);

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes]             = useState('');
  const [frequency, setFrequency]     = useState('weekly');
  const [priority, setPriority]       = useState('medium');
  const [assignedTo, setAssignedTo]   = useState(null);
  const [dueDate, setDueDate]         = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});
  const [showAddPerson, setShowAddPerson]   = useState(false);
  const [newPersonName, setNewPersonName]   = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [extraPeople, setExtraPeople]       = useState([]);

  // ── Members with house fallback ─────────────────────────────────────────
  const baseMembers = reduxMembers.length > 0
    ? reduxMembers
    : (house?.members || []);

  const allParticipants = [
    ...baseMembers.map(m => ({ ...m, _type: 'member' })),
    ...extraPeople.map(p => ({ id: p.id, user: p, _type: 'extra' })),
  ];

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch]);

  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    const id = `extra-${Date.now()}`;
    setExtraPeople(prev => [...prev, { id, name: newPersonName.trim(), email: newPersonEmail.trim() || null, avatar: null }]);
    setNewPersonName('');
    setNewPersonEmail('');
    setShowAddPerson(false);
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!assignedTo)   errs.assignedTo = 'Please select a person to assign';
    if (!dueDate)      errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(addChore({
        title: title.trim(),
        description: description.trim(),
        notes: notes.trim() || undefined,
        frequency,
        priority,
        assigned_to: assignedTo,
        due_date: dueDate,
      })).unwrap();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', typeof err === 'string' ? err : 'Failed to add chore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Details ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chore Details</Text>
          <TextInput label="Title" value={title} onChangeText={t => { setTitle(t); setErrors(e => ({...e, title: null})); }}
            mode="outlined" error={!!errors.title} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} placeholder="e.g., Clean the kitchen" />
          {errors.title && <Text style={styles.err}>{errors.title}</Text>}

          <TextInput label="Description (optional)" value={description} onChangeText={setDescription}
            mode="outlined" multiline numberOfLines={2} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} placeholder="Specific instructions..." />

          <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes}
            mode="outlined" multiline numberOfLines={2} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} placeholder="Reminders or extra info..." />

          <TextInput label="Due Date" value={dueDate} onChangeText={setDueDate}
            mode="outlined" error={!!errors.dueDate} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} placeholder="YYYY-MM-DD" />
          {errors.dueDate && <Text style={styles.err}>{errors.dueDate}</Text>}
        </View>

        {/* ── Frequency ────────────────────────────────────────────────── */}
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

        {/* ── Priority ─────────────────────────────────────────────────── */}
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

        {/* ── Assign To ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assign To</Text>
            <TouchableOpacity style={styles.addPersonBtn} onPress={() => setShowAddPerson(true)}>
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <Text style={styles.addPersonBtnText}>Add Person</Text>
            </TouchableOpacity>
          </View>
          {errors.assignedTo && <Text style={styles.err}>{errors.assignedTo}</Text>}

          {allParticipants.length === 0 && (
            <Text style={styles.noMembersText}>No household members found. Add a person above.</Text>
          )}

          <View style={styles.membersGrid}>
            {allParticipants.map(member => {
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
                  {member._type === 'extra' && <Text style={styles.guestLabel}>Guest</Text>}
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
          {loading ? 'Adding…' : 'Add Chore'}
        </Button>
      </ScrollView>

      {/* ── Add Person Modal ─────────────────────────────────────────── */}
      <Modal visible={showAddPerson} transparent animationType="slide" onRequestClose={() => setShowAddPerson(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Person</Text>
              <TouchableOpacity onPress={() => setShowAddPerson(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <RNTextInput style={styles.modalInput} placeholder="Full name *" value={newPersonName}
              onChangeText={setNewPersonName} placeholderTextColor={colors.textSecondary} autoFocus />
            <RNTextInput style={styles.modalInput} placeholder="Email (optional)" value={newPersonEmail}
              onChangeText={setNewPersonEmail} placeholderTextColor={colors.textSecondary}
              keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.modalBtns}>
              <Button mode="outlined" onPress={() => setShowAddPerson(false)} style={styles.modalCancelBtn} textColor={colors.textSecondary}>Cancel</Button>
              <Button mode="contained" onPress={handleAddPerson} style={styles.modalConfirmBtn} buttonColor={colors.primary}>Add</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  addPersonBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  addPersonBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  noMembersText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingVertical: 8 },
  membersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  memberTile: { width: 80, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background, position: 'relative', gap: 6 },
  memberTileSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  memberName: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  memberNameSelected: { color: colors.primary, fontWeight: '600' },
  guestLabel: { fontSize: 9, color: colors.secondary, fontWeight: '600', textTransform: 'uppercase' },
  selectedIndicator: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  selectedIndicatorText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  submitBtn: { borderRadius: 14, marginTop: 4 },
  submitContent: { paddingVertical: 6 },
  submitLabel: { fontSize: 16, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, backgroundColor: colors.background },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderColor: colors.border, borderRadius: 10 },
  modalConfirmBtn: { flex: 1, borderRadius: 10 },
});

export default AddChoreScreen;
