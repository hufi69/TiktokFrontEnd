import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PINK = '#FF6B9D';
const TEXT = '#2C2C2C';

const ResetSuccessScreen = ({ onDone }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <View style={styles.card}>
        <View style={styles.badge} />
        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.caption}>Your account is ready to use</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onDone}>
          <Text style={styles.primaryText}>Go back to Homepage</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: { width: 280, borderRadius: 16, backgroundColor: '#fff', padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  badge: { width: 64, height: 64, borderRadius: 32, backgroundColor: PINK, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 6 },
  caption: { color: '#666', marginBottom: 16 },
  primaryButton: { backgroundColor: PINK, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
  primaryText: { color: '#fff', fontWeight: '600' },
});



export default ResetSuccessScreen;

