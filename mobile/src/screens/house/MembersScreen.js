import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchMembers,
  removeMember,
  fetchHouse,
  selectMembers,
  selectHouseLoading,
  selectHouse,
} from '../../store/slices/houseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { colors, shadows } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const MembersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const members = useSelector(selectMembers);
  const loading = useSelector(selectHouseLoading);
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = members.find(
    (m) => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
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

  const handleRemoveMember = (member) => {
    const memberUser = member.user || member;
    Alert.alert(
      'Remove Member',
      `Remove ${memberUser?.name || 'this member'} from the household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(removeMember(memberUser?.id || member.id)),
        },
      ]
    );
  };

  const handleShareInvite = async () => {
    if (!house?.inviteCode) return;
    try {
      await Share.share({
        message: `Join my household on BillBuddy! Use invite code: ${house.inviteCode}`,
        title: 'Join BillBuddy Household',
      });
    } catch {}
  };

  const renderMember = ({ item }) => {
    const memberUser = item.user || item;
    const isMe = memberUser?.id === user?.id;
    const memberRole = item.role || 'member';

    return (
      <View style={styles.memberCard}>
        <MemberAvatar user={memberUser} size={52} />

        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>
              {memberUser?.name || 'Unknown'}
              {isMe && <Text style={styles.youLabel}> (You)</Text>}
            </Text>
            <View
              style={[
                styles.roleBadge,
                memberRole === 'admin' ? styles.adminBadge : styles.memberBadge,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  memberRole === 'admin' ? styles.adminRoleText : styles.memberRoleText,
                ]}
              >
                {memberRole === 'admin' ? 'Admin' : 'Member'}
              </Text>
            </View>
          </View>
          <Text style={styles.memberEmail}>{memberUser?.email || ''}</Text>
        </View>

        {isAdmin && !isMe && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="person-remove-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && members.length === 0) {
    return <LoadingSpinner fullScreen message="Loading members..." />;
  }

  return (
    <View style={styles.container}>
      {/* House Info */}
      {house && (
        <View style={styles.houseCard}>
          <View style={styles.houseHeader}>
            <View style={styles.houseIcon}>
              <Ionicons name="home" size={24} color="#fff" />
            </View>
            <View style={styles.houseInfo}>
              <Text style={styles.houseName}>{house.name}</Text>
              <Text style={styles.houseCount}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {house.inviteCode && isAdmin && (
            <TouchableOpacity style={styles.inviteCodeContainer} onPress={handleShareInvite}>
              <View style={styles.inviteCodeLeft}>
                <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                <Text style={styles.inviteCode}>{house.inviteCode}</Text>
              </View>
              <View style={styles.shareButton}>
                <Ionicons name="share-outline" size={18} color={colors.primary} />
                <Text style={styles.shareButtonText}>Share</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={members}
        keyExtractor={(item, index) => item.id || item.user?.id || String(index)}
        renderItem={renderMember}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>{members.length} Members</Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No members yet"
            message="Invite people to join your household."
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  houseCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  houseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  houseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseInfo: {
    flex: 1,
    gap: 2,
  },
  houseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  houseCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  inviteCodeLeft: {
    gap: 2,
  },
  inviteCodeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 3,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  shareButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    gap: 12,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  youLabel: {
    fontWeight: '400',
    color: colors.textSecondary,
    fontSize: 14,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: colors.primary + '20',
  },
  memberBadge: {
    backgroundColor: colors.border,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adminRoleText: {
    color: colors.primary,
  },
  memberRoleText: {
    color: colors.textSecondary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MembersScreen;
