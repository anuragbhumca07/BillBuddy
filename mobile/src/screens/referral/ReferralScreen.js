import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Alert, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { colors, shadows } from '../../utils/theme';

const ReferralScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user   = useSelector(selectUser);
  const [referralCount] = useState(3); // demo: 3 people referred

  // Generate a deterministic referral code from user name
  const code = 'BB' + (user?.name?.replace(/\s+/g, '').toUpperCase().slice(0, 4) || 'DEMO') + '24';

  const referralLink = `https://billbuddy.app/join?ref=${code}`;

  const handleCopy = () => {
    Clipboard.setString(referralLink);
    Alert.alert('Copied!', 'Referral link copied to clipboard.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join BillBuddy — the best app for splitting household bills! Use my link: ${referralLink}`,
        title: 'Join BillBuddy',
      });
    } catch {}
  };

  const REWARDS = [
    { icon: '🎁', milestone: 1, reward: '$5 credit', achieved: referralCount >= 1 },
    { icon: '⭐', milestone: 3, reward: '1 month Premium', achieved: referralCount >= 3 },
    { icon: '👑', milestone: 10, reward: '3 months Premium', achieved: referralCount >= 10 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎉</Text>
        <Text style={styles.heroTitle}>Invite Friends, Earn Rewards</Text>
        <Text style={styles.heroSubtitle}>Share BillBuddy with your friends and earn credits when they sign up and create a household.</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{referralCount}</Text>
          <Text style={styles.statLabel}>Referred</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{referralCount >= 3 ? '1 month' : '—'}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.max(0, 10 - referralCount)}</Text>
          <Text style={styles.statLabel}>Until Crown</Text>
        </View>
      </View>

      {/* Referral Code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.codeValue}>{code}</Text>
        <Text style={styles.codeLink} numberOfLines={1}>{referralLink}</Text>
        <View style={styles.codeBtns}>
          <TouchableOpacity style={styles.codeBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={styles.codeBtnText}>Copy Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.codeBtn, styles.codeBtnShare]} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={[styles.codeBtnText, { color: '#fff' }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Milestones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reward Milestones</Text>
        {REWARDS.map(r => (
          <View key={r.milestone} style={[styles.milestoneRow, r.achieved && styles.milestoneAchieved]}>
            <Text style={styles.milestoneEmoji}>{r.icon}</Text>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneName}>{r.milestone} referral{r.milestone !== 1 ? 's' : ''}</Text>
              <Text style={styles.milestoneReward}>{r.reward}</Text>
            </View>
            {r.achieved ? (
              <View style={styles.achievedBadge}><Text style={styles.achievedText}>Earned!</Text></View>
            ) : (
              <Text style={styles.milestoneProgress}>{referralCount}/{r.milestone}</Text>
            )}
          </View>
        ))}
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it Works</Text>
        {[
          ['share-social-outline', 'Share your link', 'Send your unique referral link to friends and family'],
          ['person-add-outline', 'They sign up', 'Your friend creates an account using your link'],
          ['home-outline', 'They create a household', 'Once they set up a household, you both get rewarded'],
          ['gift-outline', 'You earn rewards', 'Collect credits and premium subscription time'],
        ].map(([icon, title, desc]) => (
          <View key={title} style={styles.stepRow}>
            <View style={styles.stepIcon}><Ionicons name={icon} size={20} color={colors.primary} /></View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 20 },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  codeCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 12, ...shadows.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  codeLabel: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' },
  codeValue: { fontSize: 28, fontWeight: '900', color: colors.primary, letterSpacing: 4 },
  codeLink: { fontSize: 12, color: colors.textSecondary, maxWidth: '90%', textAlign: 'center' },
  codeBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  codeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary },
  codeBtnShare: { backgroundColor: colors.primary, borderColor: colors.primary },
  codeBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  section: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 14, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  milestoneAchieved: { borderColor: colors.success + '50', backgroundColor: colors.success + '08' },
  milestoneEmoji: { fontSize: 28 },
  milestoneInfo: { flex: 1 },
  milestoneName: { fontSize: 14, fontWeight: '600', color: colors.text },
  milestoneReward: { fontSize: 13, color: colors.textSecondary },
  achievedBadge: { backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  achievedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  milestoneProgress: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  stepInfo: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  stepDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});

export default ReferralScreen;
