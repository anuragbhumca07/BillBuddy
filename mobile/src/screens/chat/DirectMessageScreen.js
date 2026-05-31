import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { colors } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';

// In-memory DM store
let _dmStore = {};
let _dmIdCounter = 200;

const getDmKey = (id1, id2) => [id1, id2].sort().join('_');

const formatTime = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / 3600000;
  if (diffH < 1) return `${Math.round((now - d) / 60000)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DirectMessageScreen = ({ navigation, route }) => {
  const insets  = useSafeAreaInsets();
  const user    = useSelector(selectUser);
  const member  = route?.params?.member;
  const listRef = useRef(null);

  const key = getDmKey(user?.id || 'user-1', member?.id || 'user-2');
  if (!_dmStore[key]) {
    _dmStore[key] = [
      { id: `dm-1-${key}`, text: `Hey ${user?.name?.split(' ')[0] || 'there'}! 👋`, sender: member, createdAt: new Date(Date.now() - 3600000).toISOString() },
    ];
  }

  const [messages, setMessages] = useState([..._dmStore[key]]);
  const [text, setText] = useState('');

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const msg = { id: `dm-${++_dmIdCounter}`, text: text.trim(), sender: { id: user?.id, name: user?.name }, createdAt: new Date().toISOString() };
    _dmStore[key] = [..._dmStore[key], msg];
    setMessages([..._dmStore[key]]);
    setText('');
  };

  const renderMsg = ({ item }) => {
    const isMe = item.sender?.id === user?.id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && <MemberAvatar user={member} size={30} />}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          <Text style={[styles.time, isMe && styles.timeMe]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <MemberAvatar user={member} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{member?.name || 'Member'}</Text>
          <Text style={styles.headerSub}>Direct message</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMsg}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={`Message ${member?.name?.split(' ')[0] || 'member'}…`}
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={send} disabled={!text.trim()}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary },
  msgList: { padding: 16, gap: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  time: { fontSize: 10, color: colors.textSecondary },
  timeMe: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 120, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
});

export default DirectMessageScreen;
