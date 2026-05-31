import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TextInput as RNTextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchRules,
  addRule,
  updateRule,
  deleteRule,
  selectRules,
  selectHouseLoading,
  selectHouse,
} from '../../store/slices/houseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { colors, shadows } from '../../utils/theme';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';

const HouseRulesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const rules = useSelector(selectRules);
  const loading = useSelector(selectHouseLoading);
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const [addingRule, setAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editRuleText, setEditRuleText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const isAdmin = house?.members?.find(
    (m) => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
  );

  useEffect(() => {
    dispatch(fetchRules());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchRules());
    setRefreshing(false);
  };

  const handleAddRule = async () => {
    if (!newRuleText.trim()) return;
    setAddingRule(true);
    try {
      await dispatch(addRule({ text: newRuleText.trim() })).unwrap();
      setNewRuleText('');
      setAddModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error || 'Failed to add rule.');
    } finally {
      setAddingRule(false);
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setEditRuleText(rule.text || rule);
  };

  const handleSaveEdit = async () => {
    if (!editRuleText.trim()) return;
    setSavingEdit(true);
    try {
      await dispatch(updateRule({ ruleId: editingRule.id, data: { text: editRuleText.trim() } })).unwrap();
      setEditingRule(null);
      setEditRuleText('');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update rule.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRule = (ruleId) => {
    Alert.alert('Delete Rule', 'Remove this house rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteRule(ruleId)),
      },
    ]);
  };

  const renderRule = ({ item, index }) => (
    <View style={styles.ruleCard}>
      <View style={styles.ruleNumber}>
        <Text style={styles.ruleNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.ruleText} numberOfLines={4}>{item.text || item}</Text>
      {isAdmin && (
        <View style={styles.ruleActions}>
          <TouchableOpacity
            style={styles.ruleActionBtn}
            onPress={() => handleEditRule(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ruleActionBtn}
            onPress={() => handleDeleteRule(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && rules.length === 0) {
    return <LoadingSpinner fullScreen message="Loading rules..." />;
  }

  return (
    <View style={styles.container}>
      {/* Info Banner */}
      {rules.length > 0 && (
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            {rules.length} house rule{rules.length !== 1 ? 's' : ''} to keep things running smoothly
          </Text>
        </View>
      )}

      <FlatList
        data={rules}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderRule}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No house rules yet"
            message={
              isAdmin
                ? 'Add rules to help everyone know what is expected.'
                : 'No house rules have been set yet.'
            }
            actionLabel={isAdmin ? 'Add Rule' : undefined}
            onAction={isAdmin ? () => setAddModalVisible(true) : undefined}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {isAdmin && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + 16 }]}
          onPress={() => setAddModalVisible(true)}
          color="#fff"
          customSize={56}
        />
      )}

      {/* Edit Rule Modal */}
      <Modal
        visible={!!editingRule}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingRule(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Rule</Text>
              <TouchableOpacity onPress={() => setEditingRule(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <RNTextInput
              style={styles.ruleInput}
              value={editRuleText}
              onChangeText={setEditRuleText}
              multiline
              numberOfLines={4}
              autoFocus
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setEditingRule(null)}
                style={styles.modalCancelButton}
                textColor={colors.textSecondary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveEdit}
                loading={savingEdit}
                disabled={savingEdit || !editRuleText.trim()}
                style={styles.modalAddButton}
                buttonColor={colors.primary}
              >
                Save
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Rule Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add House Rule</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <RNTextInput
              style={styles.ruleInput}
              placeholder="e.g., No dishes left in the sink overnight"
              value={newRuleText}
              onChangeText={setNewRuleText}
              multiline
              numberOfLines={4}
              autoFocus
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setAddModalVisible(false);
                  setNewRuleText('');
                }}
                style={styles.modalCancelButton}
                textColor={colors.textSecondary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddRule}
                loading={addingRule}
                disabled={addingRule || !newRuleText.trim()}
                style={styles.modalAddButton}
                buttonColor={colors.primary}
              >
                Add Rule
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '12',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  ruleNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
  },
  ruleActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginLeft: 4,
  },
  ruleActionBtn: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  ruleInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  modalAddButton: {
    flex: 1,
    borderRadius: 10,
  },
});

export default HouseRulesScreen;
