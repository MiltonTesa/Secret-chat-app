import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import storageService from '../services/storage';

const PIN_LENGTH = 4;

export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('check'); // check, enter, setup, confirm
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkPin();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const checkPin = async () => {
    const hasPin = await storageService.hasPin();
    setStep(hasPin ? 'enter' : 'setup');
  };

  const shake = () => {
    if (Platform.OS !== 'web') Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = async (digit) => {
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      if (step === 'enter') {
        const valid = await storageService.verifyPin(newPin);
        if (valid) {
          onUnlock();
        } else {
          shake();
          setError('Wrong PIN');
          setPin('');
        }
      } else if (step === 'setup') {
        setConfirmPin(newPin);
        setPin('');
        setStep('confirm');
      } else if (step === 'confirm') {
        if (newPin === confirmPin) {
          await storageService.setPin(newPin);
          onUnlock();
        } else {
          shake();
          setError('PINs do not match');
          setPin('');
          setStep('setup');
          setConfirmPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const getTitle = () => {
    switch (step) {
      case 'enter': return 'Enter PIN';
      case 'setup': return 'Create PIN';
      case 'confirm': return 'Confirm PIN';
      default: return '';
    }
  };

  const renderDots = () => (
    <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      ))}
    </Animated.View>
  );

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') return <View key={keyIndex} style={styles.key} />;
              if (key === 'delete') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleDelete}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="backspace-outline" size={28} color={COLORS.text} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.key}
                  onPress={() => handleDigit(key)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>Phantom Chat</Text>
        <Text style={styles.title}>{getTitle()}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      {renderDots()}
      {renderKeypad()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  error: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
  },
  dotError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger,
  },
  keypad: {
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 24,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.text,
  },
});
