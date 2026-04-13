import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform } from 'react-native';

let loadError = null;
let LockScreen, AppNavigator, cryptoService;

try {
  if (Platform.OS !== 'web') {
    require('react-native-get-random-values');
  }
  cryptoService = require('./src/services/crypto').default;
  LockScreen = require('./src/screens/LockScreen').default;
  AppNavigator = require('./src/navigation/AppNavigator').default;
} catch (e) {
  loadError = e;
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(loadError);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      if (cryptoService) await cryptoService.init();
      setReady(true);
    } catch (e) {
      setError(e);
      setReady(true);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="light" />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error.message || String(error)}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Loading Phantom Chat...</Text>
      </View>
    );
  }

  if (!unlocked) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LockScreen onUnlock={() => setUnlocked(true)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a0000',
    padding: 40,
    justifyContent: 'center',
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorText: {
    color: '#ffaaaa',
    fontSize: 14,
    lineHeight: 22,
  },
});
