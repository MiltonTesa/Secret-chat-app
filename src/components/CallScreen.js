import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function CallScreen({ isVideo, localStream, remoteStream, onEnd, peerName }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Attach streams to video elements on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [localStream, remoteStream]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMuted(!audioTrack.enabled);
      }
    }
  };

  const handleVideoToggle = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);
      }
    }
  };

  const renderWebVideo = () => {
    if (Platform.OS !== 'web') return null;
    return (
      <View style={styles.videoContainer}>
        {/* Remote video (big) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
        {/* Local video (small overlay) */}
        {isVideo && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 120,
              height: 160,
              objectFit: 'cover',
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isVideo ? (
        renderWebVideo()
      ) : (
        <View style={styles.audioContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={64} color={COLORS.primaryLight} />
          </View>
          <Text style={styles.peerName}>{peerName || 'Peer'}</Text>
          <Text style={styles.callStatus}>
            {remoteStream ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      )}

      {/* Duration */}
      <View style={styles.durationContainer}>
        <View style={styles.durationBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, muted && styles.controlBtnActive]}
          onPress={handleMute}
        >
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={24} color="#fff" />
          <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {isVideo && (
          <TouchableOpacity
            style={[styles.controlBtn, videoOff && styles.controlBtnActive]}
            onPress={handleVideoToggle}
          >
            <Ionicons name={videoOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
            <Text style={styles.controlLabel}>{videoOff ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.endCallBtn} onPress={onEnd}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    zIndex: 100,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  audioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  peerName: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  callStatus: {
    fontSize: 14,
    color: COLORS.accent,
  },
  durationContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  durationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: COLORS.primary,
  },
  controlLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    position: 'absolute',
    bottom: -18,
  },
  endCallBtn: {
    alignItems: 'center',
    gap: 6,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
  },
});
