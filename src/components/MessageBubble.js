import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import MediaService from '../services/media';

export default function MessageBubble({ message, isMine, disappearTimer }) {
  const [fadeAnim] = useState(new Animated.Value(1));
  const [timeLeft, setTimeLeft] = useState(disappearTimer);

  useEffect(() => {
    if (!disappearTimer || disappearTimer <= 0) return;
    setTimeLeft(disappearTimer);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [disappearTimer]);

  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownload = () => {
    if (message.fileData && Platform.OS === 'web') {
      MediaService.downloadFile(message.fileData, message.fileName || 'file');
    }
  };

  const renderContent = () => {
    // Image message
    if (message.type === 'image' && message.imageData) {
      return (
        <View>
          <Image
            source={{ uri: message.imageData }}
            style={styles.image}
            resizeMode="cover"
          />
          {message.text ? (
            <Text style={[styles.text, isMine && styles.myText]}>{message.text}</Text>
          ) : null}
        </View>
      );
    }

    // File message
    if (message.type === 'file' && message.fileData) {
      return (
        <TouchableOpacity onPress={handleDownload} style={styles.fileContainer}>
          <View style={styles.fileIcon}>
            <Ionicons name="document-outline" size={24} color={COLORS.primaryLight} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, isMine && styles.myText]} numberOfLines={1}>
              {message.fileName || 'file'}
            </Text>
            <Text style={[styles.fileSize, isMine && styles.myMetaText]}>
              {message.fileSize ? MediaService.formatSize(message.fileSize) : ''}
              {Platform.OS === 'web' ? ' • Tap to download' : ''}
            </Text>
          </View>
          <Ionicons name="download-outline" size={20} color={isMine ? 'rgba(255,255,255,0.7)' : COLORS.textMuted} />
        </TouchableOpacity>
      );
    }

    // Text message
    return <Text style={[styles.text, isMine && styles.myText]}>{message.text}</Text>;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isMine ? styles.myMessage : styles.theirMessage,
        { opacity: fadeAnim },
      ]}
    >
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        {renderContent()}
        <View style={styles.meta}>
          {disappearTimer > 0 && (
            <View style={styles.timerContainer}>
              <Ionicons name="timer-outline" size={10} color={isMine ? 'rgba(255,255,255,0.5)' : COLORS.textDim} />
              <Text style={[styles.timerText, isMine && styles.myMetaText]}>{timeLeft}s</Text>
            </View>
          )}
          <Text style={[styles.time, isMine && styles.myMetaText]}>
            {formatTime(message.timestamp)}
          </Text>
          {isMine && (
            <Ionicons
              name={message.delivered ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.delivered ? COLORS.accent : 'rgba(255,255,255,0.5)'}
              style={styles.checkmark}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 2, marginHorizontal: 12 },
  myMessage: { alignItems: 'flex-end' },
  theirMessage: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myBubble: { backgroundColor: COLORS.myBubble, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: COLORS.theirBubble, borderBottomLeftRadius: 4 },
  text: { color: COLORS.text, fontSize: 16, lineHeight: 22 },
  myText: { color: '#fff' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  time: { fontSize: 11, color: COLORS.textDim },
  myMetaText: { color: 'rgba(255,255,255,0.5)' },
  checkmark: { marginLeft: 2 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  timerText: { fontSize: 10, color: COLORS.textDim },
  image: { width: 220, height: 220, borderRadius: 12, marginBottom: 4 },
  fileContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 200 },
  fileIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  fileInfo: { flex: 1 },
  fileName: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  fileSize: { color: COLORS.textDim, fontSize: 11, marginTop: 2 },
});
