import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import connectionService from '../services/connection';
import storageService from '../services/storage';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

export default function ChatScreen({ navigation, route }) {
  const { roomCode, isHost } = route.params;
  const [messages, setMessages] = useState([]);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [settings, setSettings] = useState({});
  const flatListRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const typingTimeout = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSettings();
    setupConnectionHandlers();
    startPulseAnimation();

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSub.remove();
      connectionService.onMessage = null;
      connectionService.onPeerJoined = null;
      connectionService.onPeerLeft = null;
    };
  }, []);

  const loadSettings = async () => {
    const s = await storageService.getSettings();
    setSettings(s);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleAppStateChange = (nextState) => {
    // Could add screen security here in the future
    appState.current = nextState;
  };

  const setupConnectionHandlers = () => {
    connectionService.onMessage = (msg) => {
      if (msg.type === 'typing') {
        setPeerTyping(msg.isTyping);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        if (msg.isTyping) {
          typingTimeout.current = setTimeout(() => setPeerTyping(false), 5000);
        }
        return;
      }

      const newMsg = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        text: msg.text,
        timestamp: msg.timestamp || Date.now(),
        isMine: false,
        delivered: true,
      };
      setMessages((prev) => [...prev, newMsg]);
    };

    connectionService.onPeerJoined = () => {
      setPeerConnected(true);
    };

    connectionService.onPeerLeft = () => {
      setPeerConnected(false);
      setPeerTyping(false);
    };

    // Check if peer is already connected
    if (connectionService.peerConnected) {
      setPeerConnected(true);
    }
  };

  const handleSend = useCallback(
    (text) => {
      try {
        const msgObj = {
          text,
          timestamp: Date.now(),
        };
        connectionService.sendMessage(msgObj);

        const newMsg = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          text,
          timestamp: Date.now(),
          isMine: true,
          delivered: true,
        };
        setMessages((prev) => [...prev, newMsg]);
      } catch (e) {
        Alert.alert('Error', 'Failed to send message');
      }
    },
    []
  );

  const handleTyping = useCallback((isTyping) => {
    connectionService.sendTypingIndicator(isTyping);
  }, []);

  const handleDisconnect = () => {
    Alert.alert(
      'Leave Chat',
      'Are you sure? All messages will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            connectionService.disconnect();
            setMessages([]);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleClearMessages = () => {
    Alert.alert(
      'Clear Messages',
      'Delete all messages from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ]
    );
  };

  const handleDisappearingMessages = (messages) => {
    if (!settings.disappearingMessages) return messages;
    const now = Date.now();
    return messages.filter(
      (msg) => now - msg.timestamp < settings.disappearTimer * 1000
    );
  };

  const displayMessages = settings.disappearingMessages
    ? handleDisappearingMessages(messages)
    : messages;

  // Auto-cleanup disappearing messages
  useEffect(() => {
    if (!settings.disappearingMessages) return;
    const interval = setInterval(() => {
      setMessages((prev) => {
        const now = Date.now();
        return prev.filter(
          (msg) => now - msg.timestamp < settings.disappearTimer * 1000
        );
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.disappearingMessages, settings.disappearTimer]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDisconnect} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="lock-closed" size={14} color={COLORS.accent} />
            <Text style={styles.headerTitle}>Encrypted Chat</Text>
          </View>
          <View style={styles.statusRow}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  backgroundColor: peerConnected ? COLORS.online : COLORS.offline,
                  opacity: peerConnected ? 1 : pulseAnim,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {peerConnected
                ? peerTyping
                  ? 'typing...'
                  : 'connected'
                : 'waiting for peer...'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleClearMessages} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Room Info Banner */}
      <View style={styles.roomBanner}>
        <Ionicons name="key-outline" size={12} color={COLORS.primaryLight} />
        <Text style={styles.roomText}>Room: {roomCode}</Text>
        {settings.disappearingMessages && (
          <>
            <Ionicons name="timer-outline" size={12} color={COLORS.warning} />
            <Text style={styles.roomText}>{settings.disappearTimer}s</Text>
          </>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={displayMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMine={item.isMine}
            disappearTimer={
              settings.disappearingMessages ? settings.disappearTimer : 0
            }
          />
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color={COLORS.bgCard} />
            <Text style={styles.emptyText}>
              {peerConnected
                ? 'Say something secret...'
                : 'Waiting for your friend to join...'}
            </Text>
            {!peerConnected && (
              <Text style={styles.emptyHint}>
                Share the room code: {roomCode}
              </Text>
            )}
          </View>
        }
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={!peerConnected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    padding: 8,
  },
  roomBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roomText: {
    fontSize: 11,
    color: COLORS.textDim,
    fontWeight: '500',
  },
  messagesList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.primaryLight,
    fontWeight: '500',
  },
});
