import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { selectHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';
import MemberAvatar from '../../components/MemberAvatar';
import { DEMO_USER } from '../../services/mockData';

// In-memory chat store
let _chatMessages = [
  { id: 'msg-1', text: 'Hey everyone! Rent is due next Friday 🏠', sender: { id: 'user-2', name: 'Jamie Lee' }, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-2', text: 'Thanks for the reminder! I\'ll transfer on Thursday.', sender: { id: 'user-1', name: 'Alex Johnson' }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-3', text: 'Same here. Also, who\'s doing groceries this week?', sender: { id: 'user-3', name: 'Sam Rivera' }, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: 'msg-4', text: 'I can do it! Will go Saturday morning.', sender: { id: 'user-2', name: 'Jamie Lee' }, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
];
let _msgIdCounter = 100;

const formatTime = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / 3600000;
  if (diffH < 1) return `${Math.round((now - d) / 60000)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const GroupChatScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user   = useSelector(selectUser);
  const house  = useSelector(selectHouse);
  const [messages, setMessages] = useState([..._chatMessages]);
  const [text, setText]         = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const msg = {
      id: `msg-${++_msgIdCounter}`,
      text: text.trim(),
      sender: { id: user?.id || 'user-1', name: user?.name || 'You' },
      createdAt: new Date().toISOString(),
    };
    _chatMessages = [..._chatMessages, msg];
    setMessages([..._chatMessages]);
    setText('');
  };

  const renderMsg = ({ item, index }) => {
    const isMe = item.sender?.id === user?.id;
    const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender?.id !== item.sender?.id);
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.avatarSlot}>
            {showAvatar && <MemberAvatar user={item.sender} size={32} />}
          </View>
        )}
        <View style={styles.msgWrapper}>
          {!isMe && showAvatar && <Text style={styles.msgSender}>{item.sender?.name?.split(' ')[0]}</Text>}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          </View>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{formatTime(item.createdAt)}</Text>
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
        <View style={styles.headerInfo}>
          <View style={styles.groupAvatar}><Ionicons name="home" size={18} color="#fff" /></View>
          <View>
            <Text style={styles.headerName}>{house?.name || 'Group Chat'}</Text>
            <Text style={styles.headerSub}>Group · {messages.length} messages</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
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
          placeholder="Message the group…"
          placeholderTextColor={colors.textSecondary}
          multiline
          onSubmitEditing={send}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary },
  headerBtn: { padding: 4 },
  msgList: { padding: 16, gap: 4, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatarSlot: { width: 32 },
  msgWrapper: { maxWidth: '75%', gap: 3 },
  msgSender: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: '600' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: colors.textSecondary, marginLeft: 4 },
  msgTimeMe: { textAlign: 'right', marginRight: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 120, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
});

export default GroupChatScreen;
