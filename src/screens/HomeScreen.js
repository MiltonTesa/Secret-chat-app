import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import cryptoService from '../services/crypto';
import connectionService from '../services/connection';
import storageService from '../services/storage';

export default function HomeScreen({ navigation }) {
  const [serverUrl, setServerUrl] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    loadServerUrl();
    cryptoService.init();
  }, []);

  const loadServerUrl = async () => {
    if (Platform.OS === 'web') {
      // Always auto-detect on web: use current page URL as WebSocket server
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const autoUrl = `${proto}//${window.location.host}`;
      setServerUrl(autoUrl);
      return;
    }
    const saved = await storageService.getServerUrl();
    if (saved) setServerUrl(saved);
  };

  const saveUrl = async (url) => {
    setServerUrl(url);
    await storageService.saveServerUrl(url);
  };

  const handleCreateRoom = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter the relay server URL');
      return;
    }

    setLoading(true);
    try {
      const code = cryptoService.constructor.generateRoomCode();
      setGeneratedCode(code);
      await connectionService.connect(serverUrl.trim(), code, true);
      await storageService.saveServerUrl(serverUrl.trim());

      navigation.navigate('Chat', {
        roomCode: code,
        isHost: true,
        serverUrl: serverUrl.trim(),
      });
    } catch (e) {
      Alert.alert('Connection Failed', e.message || 'Could not connect to relay server');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter the relay server URL');
      return;
    }
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter the room code');
      return;
    }

    setLoading(true);
    try {
      await connectionService.connect(serverUrl.trim(), joinCode.trim(), false);
      await storageService.saveServerUrl(serverUrl.trim());

      navigation.navigate('Chat', {
        roomCode: joinCode.trim(),
        isHost: false,
        serverUrl: serverUrl.trim(),
      });
    } catch (e) {
      Alert.alert('Connection Failed', e.message || 'Could not connect to relay server');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (generatedCode) {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(generatedCode);
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(generatedCode);
      }
      Alert.alert('Copied', 'Room code copied to clipboard');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubbles" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Phantom Chat</Text>
          <Text style={styles.subtitle}>End-to-end encrypted. No logs. No traces.</Text>
        </View>

        {/* Server URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="server-outline" size={16} color={COLORS.primaryLight} /> Relay Server
          </Text>
          <TextInput
            style={styles.input}
            placeholder="ws://your-server:3000"
            placeholderTextColor={COLORS.textDim}
            value={serverUrl}
            onChangeText={saveUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Run the relay server on any computer. Your messages are encrypted — the server sees nothing.
          </Text>
        </View>

        {/* Create Room */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.accent} /> Create Room
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreateRoom}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? 'Connecting...' : 'Generate Room'}
            </Text>
          </TouchableOpacity>

          {generatedCode ? (
            <TouchableOpacity style={styles.codeBox} onPress={copyCode}>
              <Text style={styles.codeLabel}>Share this code with your friend:</Text>
              <Text style={styles.codeText}>{generatedCode}</Text>
              <Text style={styles.codeCopy}>
                <Ionicons name="copy-outline" size={12} /> Tap to copy
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Join Room */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="enter-outline" size={16} color={COLORS.warning} /> Join Room
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter room code"
            placeholderTextColor={COLORS.textDim}
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={handleJoinRoom}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="enter-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? 'Connecting...' : 'Join Room'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <TouchableOpacity
          style={styles.settingsLink}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.settingsText}>Privacy Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textDim,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  joinButton: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 4,
  },
  codeCopy: {
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textDim,
    fontSize: 12,
    marginHorizontal: 16,
    fontWeight: '600',
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 16,
  },
  settingsText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
