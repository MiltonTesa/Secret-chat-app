import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import storageService from '../services/storage';
import cryptoService from '../services/crypto';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    disappearingMessages: false,
    disappearTimer: 30,
    screenSecurity: true,
    notificationPreview: false,
  });
  const [timerInput, setTimerInput] = useState('30');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await storageService.getSettings();
    setSettings(s);
    setTimerInput(String(s.disappearTimer));
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await storageService.saveSettings(updated);
  };

  const handleTimerChange = async (text) => {
    setTimerInput(text);
    const num = parseInt(text, 10);
    if (num > 0 && num <= 86400) {
      await updateSetting('disappearTimer', num);
    }
  };

  const handleResetKeys = () => {
    Alert.alert(
      'Reset Encryption Keys',
      'This will generate new encryption keys. You will need to reconnect with your chat partner. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await cryptoService.resetKeys();
            Alert.alert('Done', 'New encryption keys generated');
          },
        },
      ]
    );
  };

  const handleChangePin = () => {
    Alert.alert(
      'Change PIN',
      'This will remove your current PIN and let you set a new one on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset PIN',
          style: 'destructive',
          onPress: async () => {
            await storageService.removePin();
            Alert.alert('Done', 'PIN removed. Set a new one on next launch.');
          },
        },
      ]
    );
  };

  const renderSettingRow = (icon, title, subtitle, right) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color={COLORS.primaryLight} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Messages Section */}
        <Text style={styles.sectionHeader}>MESSAGES</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'timer-outline',
            'Disappearing Messages',
            'Messages auto-delete after timer expires',
            <Switch
              value={settings.disappearingMessages}
              onValueChange={(v) => updateSetting('disappearingMessages', v)}
              trackColor={{ false: COLORS.bgCard, true: COLORS.primaryDark }}
              thumbColor={settings.disappearingMessages ? COLORS.primary : COLORS.textDim}
            />
          )}

          {settings.disappearingMessages && (
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>Timer (seconds):</Text>
              <TextInput
                style={styles.timerInput}
                value={timerInput}
                onChangeText={handleTimerChange}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          )}

          <View style={styles.separator} />

          {renderSettingRow(
            'eye-off-outline',
            'Hide Notification Preview',
            'Don\'t show message content in notifications',
            <Switch
              value={settings.notificationPreview}
              onValueChange={(v) => updateSetting('notificationPreview', v)}
              trackColor={{ false: COLORS.bgCard, true: COLORS.primaryDark }}
              thumbColor={settings.notificationPreview ? COLORS.primary : COLORS.textDim}
            />
          )}
        </View>

        {/* Security Section */}
        <Text style={styles.sectionHeader}>SECURITY</Text>
        <View style={styles.section}>
          {renderSettingRow(
            'shield-outline',
            'Screen Security',
            'Prevent screenshots and screen recording',
            <Switch
              value={settings.screenSecurity}
              onValueChange={(v) => updateSetting('screenSecurity', v)}
              trackColor={{ false: COLORS.bgCard, true: COLORS.primaryDark }}
              thumbColor={settings.screenSecurity ? COLORS.primary : COLORS.textDim}
            />
          )}

          <View style={styles.separator} />

          <TouchableOpacity onPress={handleChangePin}>
            {renderSettingRow(
              'keypad-outline',
              'Change PIN',
              'Reset your app lock PIN',
              <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
            )}
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity onPress={handleResetKeys}>
            {renderSettingRow(
              'key-outline',
              'Reset Encryption Keys',
              'Generate new keys (requires reconnect)',
              <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
            )}
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primaryLight} />
            <Text style={styles.infoText}>
              Phantom Chat uses NaCl (Networking and Cryptography library) for end-to-end encryption.
              Messages are encrypted on your device before being sent. The relay server only sees
              encrypted data it cannot read. No messages are ever stored on the server.
            </Text>
          </View>
        </View>

        <Text style={styles.version}>Phantom Chat v1.0.0</Text>
      </ScrollView>
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
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },
  section: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 60,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    marginLeft: 48,
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  timerInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  version: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 24,
  },
});
