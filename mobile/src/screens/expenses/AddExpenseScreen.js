import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, TextInput as RNTextInput,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { addExpense } from '../../store/slices/expenseSlice';
import { fetchMembers, selectMembers } from '../../store/slices/houseSlice';
import { selectHouse } from '../../store/slices/houseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { colors } from '../../utils/theme';
import ReceiptPicker from '../../components/ReceiptPicker';
import MemberAvatar from '../../components/MemberAvatar';

const CATEGORIES = ['Rent', 'Groceries', 'Utilities', 'Internet', 'Cleaning', 'Other'];
const SPLIT_TYPES = [
  { key: 'equal', label: 'Split Equally' },
  { key: 'custom', label: 'Custom Split' },
];

const AddExpenseScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const reduxMembers = useSelector(selectMembers);
  const house = useSelector(selectHouse);
  const user = useSelector(selectUser);

  // ── State ──────────────────────────────────────────────────────────────────
  const [title, setTitle]           = useState('');
  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState('Other');
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType]   = useState('equal');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [customAmounts, setCustomAmounts]     = useState({});
  const [receiptUri, setReceiptUri] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [notes, setNotes]           = useState('');
  const [showAddPerson, setShowAddPerson]     = useState(false);
  const [newPersonName, setNewPersonName]     = useState('');
  const [newPersonEmail, setNewPersonEmail]   = useState('');
  const [extraPeople, setExtraPeople]         = useState([]);

  // ── Members: fall back to house.members if Redux not yet populated ─────────
  const baseMembers = reduxMembers.length > 0
    ? reduxMembers
    : (house?.members || []);

  // Combine house members + custom-added people
  const allParticipants = [
    ...baseMembers.map(m => ({ ...m, _type: 'member' })),
    ...extraPeople.map(p => ({ id: p.id, user: p, _type: 'extra' })),
  ];

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch]);

  // Auto-select all when members load
  useEffect(() => {
    if (allParticipants.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(allParticipants.map(m => m.user?.id || m.id));
    }
  }, [baseMembers.length, extraPeople.length]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleMember = (id) =>
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this person.');
      return;
    }
    const id = `extra-${Date.now()}`;
    const person = { id, name: newPersonName.trim(), email: newPersonEmail.trim() || null, avatar: null };
    setExtraPeople(prev => [...prev, person]);
    setSelectedMembers(prev => [...prev, id]);
    setNewPersonName('');
    setNewPersonEmail('');
    setShowAddPerson(false);
  };

  const validate = () => {
    const errs = {};
    if (!title.trim())      errs.title = 'Title is required';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      errs.amount = 'Enter a valid amount';
    if (selectedMembers.length === 0)
      errs.members = 'Select at least one person';
    if (splitType === 'custom') {
      const total = Object.values(customAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      if (Math.abs(total - parseFloat(amount)) > 0.01)
        errs.custom = `Amounts must sum to $${parseFloat(amount).toFixed(2)}`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const total = parseFloat(amount);
      const count = selectedMembers.length;
      const splits = splitType === 'equal'
        ? selectedMembers.map(id => ({ user_id: id, amount: total / count, settled: id === user?.id }))
        : selectedMembers.map(id => ({ user_id: id, amount: parseFloat(customAmounts[id] || 0), settled: id === user?.id }));

      await dispatch(addExpense({
        title: title.trim(), amount: total, category, date,
        splitType, splits, paidBy: user?.id, notes: notes.trim() || undefined,
        receipt: receiptUri || undefined,
      })).unwrap();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', typeof err === 'string' ? err : 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  const equalAmt = selectedMembers.length > 0 && amount
    ? (parseFloat(amount) / selectedMembers.length).toFixed(2) : '0.00';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Details ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Details</Text>
          <TextInput label="Title" value={title} onChangeText={t => { setTitle(t); setErrors(e => ({...e, title: null})); }}
            mode="outlined" error={!!errors.title} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} placeholder="e.g., Weekly groceries" />
          {errors.title && <Text style={styles.err}>{errors.title}</Text>}

          <TextInput label="Amount ($)" value={amount} onChangeText={t => { setAmount(t); setErrors(e => ({...e, amount: null})); }}
            mode="outlined" keyboardType="decimal-pad" error={!!errors.amount} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} left={<TextInput.Affix text="$" />} />
          {errors.amount && <Text style={styles.err}>{errors.amount}</Text>}

          <TextInput label="Date" value={date} onChangeText={setDate}
            mode="outlined" style={styles.input} outlineColor={colors.border}
            activeOutlineColor={colors.primary} placeholder="YYYY-MM-DD" />

          <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes}
            mode="outlined" multiline numberOfLines={2} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} placeholder="Any notes for this expense..." />
        </View>

        {/* ── Category ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipSelected]} onPress={() => setCategory(cat)}>
                <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Split Type ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Type</Text>
          <View style={styles.splitRow}>
            {SPLIT_TYPES.map(t => (
              <TouchableOpacity key={t.key} style={[styles.splitBtn, splitType === t.key && styles.splitBtnSelected]} onPress={() => setSplitType(t.key)}>
                <Ionicons name={t.key === 'equal' ? 'people-outline' : 'calculator-outline'} size={18} color={splitType === t.key ? '#fff' : colors.textSecondary} />
                <Text style={[styles.splitBtnText, splitType === t.key && styles.splitBtnTextSelected]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Members ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Split Between</Text>
            <TouchableOpacity style={styles.addPersonBtn} onPress={() => setShowAddPerson(true)}>
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <Text style={styles.addPersonBtnText}>Add Person</Text>
            </TouchableOpacity>
          </View>
          {errors.members && <Text style={styles.err}>{errors.members}</Text>}

          {allParticipants.length === 0 && (
            <Text style={styles.noMembersText}>No friends found. Add a person to split with.</Text>
          )}

          {allParticipants.map(member => {
            const memberId = member.user?.id || member.id;
            const memberUser = member.user || member;
            const isSelected = selectedMembers.includes(memberId);
            return (
              <TouchableOpacity key={memberId} style={[styles.memberRow, isSelected && styles.memberRowSelected]} onPress={() => toggleMember(memberId)}>
                <View style={styles.memberLeft}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <MemberAvatar user={memberUser} size={36} showName />
                  {member._type === 'extra' && (
                    <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>Guest</Text></View>
                  )}
                </View>
                {splitType === 'equal' && isSelected && (
                  <Text style={styles.splitAmt}>${equalAmt}</Text>
                )}
                {splitType === 'custom' && isSelected && (
                  <TextInput value={customAmounts[memberId] || ''} onChangeText={v => setCustomAmounts(p => ({...p, [memberId]: v}))}
                    mode="outlined" keyboardType="decimal-pad" style={styles.customInput}
                    outlineColor={colors.border} activeOutlineColor={colors.primary}
                    left={<TextInput.Affix text="$" />} dense />
                )}
              </TouchableOpacity>
            );
          })}
          {errors.custom && <Text style={styles.err}>{errors.custom}</Text>}
        </View>

        {/* ── Receipt ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt (Optional)</Text>
          <ReceiptPicker onImageSelected={setReceiptUri} imageUri={receiptUri} onRemove={() => setReceiptUri(null)} />
        </View>

        <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading}
          style={styles.submitBtn} contentStyle={styles.submitContent}
          buttonColor={colors.primary} labelStyle={styles.submitLabel}>
          {loading ? 'Adding…' : 'Add Expense'}
        </Button>
      </ScrollView>

      {/* ── Add Person Modal ─────────────────────────────────────────── */}
      <Modal visible={showAddPerson} transparent animationType="slide" onRequestClose={() => setShowAddPerson(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Person to Split</Text>
              <TouchableOpacity onPress={() => setShowAddPerson(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Add someone to split with</Text>
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
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: colors.primary, fontWeight: '600' },
  splitRow: { flexDirection: 'row', gap: 8 },
  splitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  splitBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  splitBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  splitBtnTextSelected: { color: '#fff', fontWeight: '600' },
  addPersonBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  addPersonBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  noMembersText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingVertical: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  memberRowSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  guestBadge: { backgroundColor: colors.secondary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  guestBadgeText: { fontSize: 10, color: colors.secondary, fontWeight: '600' },
  splitAmt: { fontSize: 15, fontWeight: '600', color: colors.success },
  customInput: { width: 90, height: 40, backgroundColor: colors.surface },
  submitBtn: { borderRadius: 14, marginTop: 4 },
  submitContent: { paddingVertical: 6 },
  submitLabel: { fontSize: 16, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: -6 },
  modalInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, backgroundColor: colors.background },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderColor: colors.border, borderRadius: 10 },
  modalConfirmBtn: { flex: 1, borderRadius: 10 },
});

export default AddExpenseScreen;
