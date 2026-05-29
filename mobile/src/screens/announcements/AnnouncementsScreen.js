import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchAnnouncements,
  deleteAnnouncement,
  selectAnnouncements,
  selectAnnouncementLoading,
} from '../../store/slices/announcementSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';
import AnnouncementCard from '../../components/AnnouncementCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';

const AnnouncementsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const announcements = useSelector(selectAnnouncements);
  const loading = useSelector(selectAnnouncementLoading);
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = house?.members?.find(
    (m) => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
  );

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAnnouncements());
    setRefreshing(false);
  };

  const handleDelete = (announcementId) => {
    Alert.alert('Delete Announcement', 'Are you sure you want to delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteAnnouncement(announcementId)),
      },
    ]);
  };

  if (loading && announcements.length === 0) {
    return <LoadingSpinner fullScreen message="Loading announcements..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Announcements</Text>
        <Text style={styles.count}>{announcements.length} total</Text>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnnouncementCard
            announcement={item}
            isAdmin={!!isAdmin}
            onDelete={handleDelete}
          />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="megaphone-outline"
            title="No announcements yet"
            message="Announcements from your household will appear here."
            actionLabel={isAdmin ? 'Add Announcement' : undefined}
            onAction={isAdmin ? () => navigation.navigate('AddAnnouncement') : undefined}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('AddAnnouncement')}
        color="#fff"
        customSize={56}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  count: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.secondary,
    borderRadius: 28,
  },
});

export default AnnouncementsScreen;
