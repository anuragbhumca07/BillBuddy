import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, TextInput as RNTextInput,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  updateExpense, fetchExpenseDetail,
  selectSelectedExpense, selectExpenseLoading,
} from '../../store/slices/expenseSlice';
import { fetchMembers, selectMembers, selectHouse } from '../../store/slices/houseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { colors } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES = ['Rent', 'Groceries', 'Utilities', 'Internet', 'Cleaning', 'Other'];
const SPLIT_TYPES = [
  { key: 'equal', label: 'Split Equally' },
  { key: 'custom', label: 'Custom Split' },
];

const EditExpenseScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { expenseId } = route.params || {};
  const expense = useSelector(selectSelectedExpense);
  const expenseLoading = useSelector(selectExpenseLoading);
  const reduxMembers = useSelector(selectMembers);
  const house = useSelector(selectHouse);
  const user = useSelector(selectUser);

  const [title, setTitle]         = useState('');
  const [amount, setAmount]       = useState('');
  const [category, setCategory]   = useState('Other');
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState('equal');
  const [notes, setNotes]         = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [customAmounts, setCustomAmounts]     = useState({});
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [initialized, setInitialized] = useState(false);

  const baseMembers = reduxMembers.length > 0 ? reduxMembers : (house?.members || []);
  const allParticipants = baseMembers.map(m => ({ ...m, _type: 'member' }));

  useEffect(() => {
    dispatch(fetchMembers());
    if (expenseId) dispatch(fetchExpenseDetail(expenseId));
  }, [expenseId, dispatch]);

  // Pre-populate form once expense loads
  useEffect(() => {
    if (expense && expense.id === expenseId && !initialized) {
      setTitle(expense.title || '');
      setAmount(String(expense.amount || ''));
      setCategory(expense.category || 'Other');
      setDate((expense.date || expense.createdAt || '').split('T')[0]);
      setSplitType(expense.splitType || 'equal');
      setNotes(expense.note || '');
      if (expense.splits?.length > 0) {
        setSelectedMembers(expense.splits.map(s => s.user?.id || s.user_id || s.user));
        const cm = {};
        expense.splits.forEach(s => { cm[s.user?.id || s.user_id || s.user] = String(s.amount); });
        setCustomAmounts(cm);
      }
      setInitialized(true);
    }
  }, [expense, expenseId, initialized]);

  const toggleMember = (id) =>
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      errs.amount = 'Enter a valid amount';
    if (selectedMembers.length === 0) errs.members = 'Select at least one person';
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

      await dispatch(updateExpense({
        expenseId,
        data: { title: title.trim(), amount: total, category, date, splitType, splits, notes: notes.trim() || undefined },
      })).unwrap();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', typeof err === 'string' ? err : 'Failed to update expense.');
    } finally {
      setLoading(false);
    }
  };

  if (expenseLoading && !initialized) return <LoadingSpinner fullScreen message="Loading expense..." />;

  const equalAmt = selectedMembers.length > 0 && amount
    ? (parseFloat(amount) / selectedMembers.length).toFixed(2) : '0.00';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Details</Text>
          <TextInput label="Title" value={title} onChangeText={t => { setTitle(t); setErrors(e => ({...e, title: null})); }}
            mode="outlined" error={!!errors.title} style={styles.input}
            outlineColor={colors.border} activeOutlineColor={colors.primary} />
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
            outlineColor={colors.border} activeOutlineColor={colors.primary} />
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Type</Text>
          <View style={styles.splitRow}>
            {SPLIT_TYPES.map(t => (
              <TouchableOpacity key={t.key} style={[styles.splitBtn, splitType === t.key && styles.splitBtnSelected]} onPress={() => setSplitType(t.key)}>
                <Ionicons name={t.key === 'equal' ? 'people-outline' : 'calculator-outline'} size={18}
                  color={splitType === t.key ? '#fff' : colors.textSecondary} />
                <Text style={[styles.splitBtnText, splitType === t.key && styles.splitBtnTextSelected]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Between</Text>
          {errors.members && <Text style={styles.err}>{errors.members}</Text>}
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
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  memberRowSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  splitAmt: { fontSize: 15, fontWeight: '600', color: colors.success },
  customInput: { width: 90, height: 40, backgroundColor: colors.surface },
  submitBtn: { borderRadius: 14, marginTop: 4 },
  submitContent: { paddingVertical: 6 },
  submitLabel: { fontSize: 16, fontWeight: '600' },
});

export default EditExpenseScreen;
