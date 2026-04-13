import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function ChatInput({ onSend, onTyping, onAttach, onVoiceCall, onVideoCall, disabled }) {
  const [text, setText] = useState('');
  const [sendScale] = useState(new Animated.Value(1));
  const [showAttach, setShowAttach] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.8, duration: 50, useNativeDriver: true }),
      Animated.timing(sendScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    onSend(trimmed);
    setText('');
    onTyping?.(false);
  };

  const handleTextChange = (value) => {
    setText(value);
    onTyping?.(value.length > 0);
  };

  return (
    <View>
      {/* Attachment menu */}
      {showAttach && (
        <View style={styles.attachMenu}>
          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => { setShowAttach(false); onAttach?.('image'); }}
          >
            <View style={[styles.attachIcon, { backgroundColor: '#7c3aed' }]}>
              <Ionicons name="image" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => { setShowAttach(false); onAttach?.('file'); }}
          >
            <View style={[styles.attachIcon, { backgroundColor: '#06d6a0' }]}>
              <Ionicons name="document" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => { setShowAttach(false); onVoiceCall?.(); }}
          >
            <View style={[styles.attachIcon, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="call" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => { setShowAttach(false); onVideoCall?.(); }}
          >
            <View style={[styles.attachIcon, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="videocam" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => setShowAttach(!showAttach)}
          disabled={disabled}
        >
          <Ionicons
            name={showAttach ? 'close' : 'add-circle'}
            size={28}
            color={disabled ? COLORS.textDim : COLORS.primaryLight}
          />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={disabled ? 'Waiting for peer...' : 'Type a secret message...'}
            placeholderTextColor={COLORS.textDim}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={5000}
            editable={!disabled}
            returnKeyType="default"
          />
        </View>

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || disabled) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || disabled}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={20}
              color={text.trim() && !disabled ? '#fff' : COLORS.textDim}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.bgLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  attachBtn: {
    padding: 6,
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.bgInput,
  },
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.bgLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachOption: {
    alignItems: 'center',
    gap: 4,
  },
  attachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
