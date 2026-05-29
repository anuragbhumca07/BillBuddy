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
import { TextInput, Button, Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { addExpense } from '../../store/slices/expenseSlice';
import { fetchMembers, selectMembers } from '../../store/slices/houseSlice';
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
  const members = useSelector(selectMembers);
  const user = useSelector(selectUser);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState('equal');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [receiptUri, setReceiptUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch]);

  useEffect(() => {
    // Pre-select all members for equal split
    if (members.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(members.map((m) => m.user?.id || m.id));
    }
  }, [members]);

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (selectedMembers.length === 0) newErrors.members = 'Select at least one member';
    if (splitType === 'custom') {
      const total = Object.values(customAmounts).reduce(
        (sum, v) => sum + (parseFloat(v) || 0),
        0
      );
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        newErrors.custom = `Custom amounts must sum to ${amount}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const splits =
        splitType === 'equal'
          ? selectedMembers.map((memberId) => ({
              user: memberId,
              amount: parseFloat(amount) / selectedMembers.length,
              settled: false,
            }))
          : selectedMembers.map((memberId) => ({
              user: memberId,
              amount: parseFloat(customAmounts[memberId] || 0),
              settled: false,
            }));

      const expenseData = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date,
        splitType,
        splits,
        paidBy: user?.id,
      };

      if (receiptUri) {
        expenseData.receipt = receiptUri;
      }

      await dispatch(addExpense(expenseData)).unwrap();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const equalSplitAmount =
    selectedMembers.length > 0 && amount
      ? (parseFloat(amount) / selectedMembers.length).toFixed(2)
      : '0.00';

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
        {/* Title & Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Details</Text>

          <TextInput
            label="Title"
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: null })); }}
            mode="outlined"
            error={!!errors.title}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="e.g., Weekly groceries"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <TextInput
            label="Amount ($)"
            value={amount}
            onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: null })); }}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.amount}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            left={<TextInput.Affix text="$" />}
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

          <TextInput
            label="Date"
            value={date}
            onChangeText={setDate}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Split Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Type</Text>
          <View style={styles.splitTypeRow}>
            {SPLIT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.splitTypeButton,
                  splitType === type.key && styles.splitTypeButtonSelected,
                ]}
                onPress={() => setSplitType(type.key)}
              >
                <Ionicons
                  name={type.key === 'equal' ? 'people-outline' : 'calculator-outline'}
                  size={18}
                  color={splitType === type.key ? '#fff' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.splitTypeText,
                    splitType === type.key && styles.splitTypeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Between</Text>
          {errors.members && <Text style={styles.errorText}>{errors.members}</Text>}
          {members.map((member) => {
            const memberId = member.user?.id || member.id;
            const memberUser = member.user || member;
            const isSelected = selectedMembers.includes(memberId);

            return (
              <TouchableOpacity
                key={memberId}
                style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                onPress={() => toggleMember(memberId)}
              >
                <View style={styles.memberLeft}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <MemberAvatar user={memberUser} size={36} showName name={memberUser?.name} />
                </View>

                {splitType === 'equal' && isSelected && (
                  <Text style={styles.splitAmount}>${equalSplitAmount}</Text>
                )}

                {splitType === 'custom' && isSelected && (
                  <TextInput
                    value={customAmounts[memberId] || ''}
                    onChangeText={(v) =>
                      setCustomAmounts((prev) => ({ ...prev, [memberId]: v }))
                    }
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.customInput}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    left={<TextInput.Affix text="$" />}
                    dense
                  />
                )}
              </TouchableOpacity>
            );
          })}
          {errors.custom && <Text style={styles.errorText}>{errors.custom}</Text>}
        </View>

        {/* Receipt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt (Optional)</Text>
          <ReceiptPicker
            onImageSelected={setReceiptUri}
            imageUri={receiptUri}
            onRemove={() => setReceiptUri(null)}
          />
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
          {loading ? 'Adding...' : 'Add Expense'}
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
    gap: 20,
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
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: -4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  splitTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  splitTypeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  splitTypeText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  splitTypeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  splitAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
  },
  customInput: {
    width: 90,
    height: 40,
    backgroundColor: colors.surface,
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

export default AddExpenseScreen;
