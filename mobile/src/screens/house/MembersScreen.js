import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Alert, TouchableOpacity, Share, Modal, TextInput as RNTextInput,
  Clipboard,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchMembers, removeMember, fetchHouse,
  selectMembers, selectHouseLoading, selectHouse,
} from '../../store/slices/houseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { colors, shadows } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';

// ── Local Group State ─────────────────────────────────────────────────────────
// Groups are like Splitwise groups — named subsets of members for tracking expenses
let _groups = [
  { id: 'grp-1', name: 'Weekend Trip', members: ['user-1', 'user-2'], emoji: '✈️', description: 'Prague trip expenses' },
  { id: 'grp-2', name: 'Movie Nights', members: ['user-1', 'user-3'], emoji: '🎬', description: 'Shared movie subscriptions' },
];
let _groupIdCounter = 100;

const MembersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets   = useSafeAreaInsets();
  const reduxMembers = useSelector(selectMembers);
  const loading  = useSelector(selectHouseLoading);
  const user     = useSelector(selectUser);
  const house    = useSelector(selectHouse);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups]         = useState([..._groups]);
  const [activeTab, setActiveTab]   = useState('Members');

  // ── Add Member modal ──────────────────────────────────────────────────────
  const [showInvite, setShowInvite]   = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent]   = useState(false);

  // ── Create Group modal ────────────────────────────────────────────────────
  const [showCreateGroup, setShowCreateGroup]     = useState(false);
  const [groupName, setGroupName]                 = useState('');
  const [groupEmoji, setGroupEmoji]               = useState('🏠');
  const [groupDescription, setGroupDescription]   = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  // ── Members: fall back to house.members ───────────────────────────────────
  const members = reduxMembers.length > 0 ? reduxMembers : (house?.members || []);

  const isAdmin = members.find(
    m => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
  );

  useEffect(() => {
    dispatch(fetchMembers());
    dispatch(fetchHouse());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([dispatch(fetchMembers()), dispatch(fetchHouse())]);
    setRefreshing(false);
  };

  // ── Invite ────────────────────────────────────────────────────────────────
  const handleShareInvite = async () => {
    const code = house?.invite_code || house?.inviteCode || 'DREAM42';
    try {
      await Share.share({ message: `Join my BillBuddy household "${house?.name || 'The Dream Team'}"! Invite code: ${code}` });
    } catch {}
  };

  const handleCopyCode = () => {
    const code = house?.invite_code || house?.inviteCode || 'DREAM42';
    Clipboard.setString(code);
    Alert.alert('Copied!', `Invite code ${code} copied to clipboard.`);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !/\S+@\S+\.\S+/.test(inviteEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setInviteEmail(''); setShowInvite(false); }, 1500);
  };

  // ── Remove ────────────────────────────────────────────────────────────────
  const handleRemove = (member) => {
    const mu = member.user || member;
    Alert.alert('Remove Member', `Remove ${mu?.name} from the household?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch(removeMember(mu?.id || member.id)) },
    ]);
  };

  // ── Groups ────────────────────────────────────────────────────────────────
  const handleCreateGroup = () => {
    if (!groupName.trim()) { Alert.alert('Name required', 'Enter a group name.'); return; }
    const newGroup = {
      id: `grp-${++_groupIdCounter}`,
      name: groupName.trim(),
      emoji: groupEmoji,
      description: groupDescription.trim(),
      members: selectedGroupMembers,
    };
    _groups = [..._groups, newGroup];
    setGroups([..._groups]);
    setGroupName(''); setGroupEmoji('🏠'); setGroupDescription(''); setSelectedGroupMembers([]);
    setShowCreateGroup(false);
  };

  const handleDeleteGroup = (groupId) => {
    Alert.alert('Delete Group', 'Delete this group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        _groups = _groups.filter(g => g.id !== groupId);
        setGroups([..._groups]);
      }},
    ]);
  };

  const toggleGroupMember = (memberId) =>
    setSelectedGroupMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );

  const getMemberById = (id) => {
    const m = members.find(m => m.user?.id === id || m.user === id);
    return m?.user || null;
  };

  // ── Render Member Card ────────────────────────────────────────────────────
  const renderMember = ({ item }) => {
    const mu = item.user || item;
    const isMe = mu?.id === user?.id;
    const role = item.role || 'member';
    return (
      <View style={styles.memberCard}>
        <MemberAvatar user={mu} size={52} />
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{mu?.name || 'Unknown'}{isMe && <Text style={styles.you}> (You)</Text>}</Text>
            <View style={[styles.badge, role === 'admin' ? styles.adminBadge : styles.memBadge]}>
              <Text style={[styles.badgeText, role === 'admin' ? styles.adminBadgeText : styles.memBadgeText]}>
                {role === 'admin' ? 'Admin' : 'Member'}
              </Text>
            </View>
          </View>
          <Text style={styles.memberEmail}>{mu?.email || ''}</Text>
        </View>
        <View style={styles.memberActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('DirectMessage', { member: mu })}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          {isAdmin && !isMe && (
            <TouchableOpacity style={[styles.actionBtn, styles.removeBtn]} onPress={() => handleRemove(item)}>
              <Ionicons name="person-remove-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ── Render Group Card ─────────────────────────────────────────────────────
  const renderGroup = ({ item }) => {
    const groupMemberUsers = item.members.map(getMemberById).filter(Boolean);
    return (
      <View style={styles.groupCard}>
        <View style={styles.groupLeft}>
          <View style={styles.groupEmoji}><Text style={styles.groupEmojiText}>{item.emoji}</Text></View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupDesc} numberOfLines={1}>{item.description || `${item.members.length} members`}</Text>
            <View style={styles.groupAvatarRow}>
              {groupMemberUsers.slice(0, 4).map((u, i) => (
                <View key={u.id} style={[styles.groupAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                  <MemberAvatar user={u} size={24} />
                </View>
              ))}
              {item.members.length > 4 && <Text style={styles.groupMoreText}>+{item.members.length - 4}</Text>}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.groupDeleteBtn} onPress={() => handleDeleteGroup(item.id)}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && members.length === 0) return <LoadingSpinner fullScreen message="Loading members…" />;

  const inviteCode = house?.invite_code || house?.inviteCode || 'DREAM42';

  return (
    <View style={styles.container}>
      {/* ── House Card ─────────────────────────────────────────────────── */}
      {house && (
        <View style={styles.houseCard}>
          <View style={styles.houseRow}>
            <View style={styles.houseIcon}><Ionicons name="home" size={22} color="#fff" /></View>
            <View style={styles.houseInfo}>
              <Text style={styles.houseName}>{house.name}</Text>
              <Text style={styles.houseCount}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          {/* Invite Code Row */}
          <View style={styles.codeRow}>
            <View style={styles.codeLeft}>
              <Text style={styles.codeLabel}>Invite Code</Text>
              <Text style={styles.codeValue}>{inviteCode}</Text>
            </View>
            <View style={styles.codeBtns}>
              <TouchableOpacity style={styles.codeBtn} onPress={handleCopyCode}>
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.codeBtn} onPress={handleShareInvite}>
                <Ionicons name="share-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={styles.inviteBtnText}>Invite by Email</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {['Members', 'Groups'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Ionicons name={tab === 'Members' ? 'people-outline' : 'layers-outline'} size={16}
              color={activeTab === tab ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {activeTab === 'Members' ? (
        <FlatList
          data={members}
          keyExtractor={(item, i) => item.id || item.user?.id || String(i)}
          renderItem={renderMember}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={<Text style={styles.listHeader}>{members.length} Members</Text>}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={renderGroup}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.groupsHeader}>
              <Text style={styles.listHeader}>{groups.length} Group{groups.length !== 1 ? 's' : ''}</Text>
              <TouchableOpacity style={styles.createGroupBtn} onPress={() => setShowCreateGroup(true)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createGroupBtnText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyGroups}>
              <Ionicons name="layers-outline" size={40} color={colors.border} />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Create a group to track expenses for trips, events, or projects.</Text>
              <TouchableOpacity style={styles.createGroupBtn2} onPress={() => setShowCreateGroup(true)}>
                <Text style={styles.createGroupBtn2Text}>Create First Group</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ── Invite by Email Modal ──────────────────────────────────────── */}
      <Modal visible={showInvite} transparent animationType="slide" onRequestClose={() => setShowInvite(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Member</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Send an invite link to their email</Text>
            <RNTextInput style={styles.modalInput} placeholder="Email address" value={inviteEmail}
              onChangeText={setInviteEmail} keyboardType="email-address" autoCapitalize="none"
              placeholderTextColor={colors.textSecondary} autoFocus />
            <TouchableOpacity style={[styles.sendBtn, inviteSent && styles.sendBtnSuccess]} onPress={handleSendInvite}>
              <Ionicons name={inviteSent ? 'checkmark-circle' : 'send'} size={18} color="#fff" />
              <Text style={styles.sendBtnText}>{inviteSent ? 'Invite Sent!' : 'Send Invite'}</Text>
            </TouchableOpacity>
            <View style={styles.codeShareRow}>
              <Text style={styles.orText}>Or share invite code:</Text>
              <TouchableOpacity onPress={handleCopyCode}>
                <Text style={styles.codeShareCode}>{inviteCode}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Create Group Modal ─────────────────────────────────────────── */}
      <Modal visible={showCreateGroup} transparent animationType="slide" onRequestClose={() => setShowCreateGroup(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <TouchableOpacity onPress={() => setShowCreateGroup(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Like a Splitwise group — track expenses for a specific purpose</Text>

            <View style={styles.emojiRow}>
              {['🏠','✈️','🎬','🍕','🏖️','🎉','💪','📦'].map(e => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, groupEmoji === e && styles.emojiBtnSelected]} onPress={() => setGroupEmoji(e)}>
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <RNTextInput style={styles.modalInput} placeholder="Group name *" value={groupName}
              onChangeText={setGroupName} placeholderTextColor={colors.textSecondary} autoFocus />
            <RNTextInput style={styles.modalInput} placeholder="Description (optional)" value={groupDescription}
              onChangeText={setGroupDescription} placeholderTextColor={colors.textSecondary} />

            <Text style={styles.groupMembersLabel}>Add Members:</Text>
            <View style={styles.groupMembersTiles}>
              {members.map(m => {
                const mu = m.user || m;
                const id = mu?.id || m.id;
                const selected = selectedGroupMembers.includes(id);
                return (
                  <TouchableOpacity key={id} style={[styles.groupMemberTile, selected && styles.groupMemberTileSelected]} onPress={() => toggleGroupMember(id)}>
                    <MemberAvatar user={mu} size={36} />
                    <Text style={[styles.groupMemberName, selected && styles.groupMemberNameSelected]}>{mu?.name?.split(' ')[0]}</Text>
                    {selected && <View style={styles.groupMemberCheck}><Ionicons name="checkmark" size={10} color="#fff" /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtns}>
              <Button mode="outlined" onPress={() => setShowCreateGroup(false)} style={styles.modalCancelBtn} textColor={colors.textSecondary}>Cancel</Button>
              <Button mode="contained" onPress={handleCreateGroup} style={styles.modalConfirmBtn} buttonColor={colors.primary}>Create Group</Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  houseCard: { backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, gap: 12, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  houseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  houseIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  houseInfo: { flex: 1 },
  houseName: { fontSize: 17, fontWeight: '700', color: colors.text },
  houseCount: { fontSize: 13, color: colors.textSecondary },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  codeLeft: { gap: 2 },
  codeLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' },
  codeValue: { fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: 3 },
  codeBtns: { flexDirection: 'row', gap: 8 },
  codeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12 },
  inviteBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: colors.border + '60', borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  listHeader: { fontSize: 15, fontWeight: '700', color: colors.text, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  listContent: { paddingBottom: 40 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginHorizontal: 16, marginVertical: 4, gap: 12, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  memberInfo: { flex: 1, gap: 3 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  memberName: { fontSize: 15, fontWeight: '600', color: colors.text },
  you: { fontWeight: '400', color: colors.textSecondary, fontSize: 13 },
  memberEmail: { fontSize: 12, color: colors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  adminBadge: { backgroundColor: colors.primary + '20' },
  memBadge: { backgroundColor: colors.border },
  badgeText: { fontSize: 11, fontWeight: '600' },
  adminBadgeText: { color: colors.primary },
  memBadgeText: { color: colors.textSecondary },
  memberActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center' },
  removeBtn: { backgroundColor: colors.danger + '12' },
  // Groups
  groupsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  createGroupBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  createGroupBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  groupCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginHorizontal: 16, marginVertical: 4, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  groupLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  groupEmoji: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  groupEmojiText: { fontSize: 24 },
  groupInfo: { flex: 1, gap: 4 },
  groupName: { fontSize: 15, fontWeight: '700', color: colors.text },
  groupDesc: { fontSize: 12, color: colors.textSecondary },
  groupAvatarRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  groupAvatar: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.surface },
  groupMoreText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  groupDeleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.danger + '12', alignItems: 'center', justifyContent: 'center' },
  emptyGroups: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  createGroupBtn2: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  createGroupBtn2Text: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: -6 },
  modalInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, backgroundColor: colors.background },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderColor: colors.border, borderRadius: 10 },
  modalConfirmBtn: { flex: 1, borderRadius: 10 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14 },
  sendBtnSuccess: { backgroundColor: colors.success },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  orText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  codeShareRow: { alignItems: 'center', gap: 4 },
  codeShareCode: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: 3 },
  // Create Group
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  emojiBtnSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  emojiText: { fontSize: 22 },
  groupMembersLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  groupMembersTiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  groupMemberTile: { alignItems: 'center', gap: 4, padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background, position: 'relative' },
  groupMemberTileSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  groupMemberName: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  groupMemberNameSelected: { color: colors.primary, fontWeight: '700' },
  groupMemberCheck: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});

export default MembersScreen;
