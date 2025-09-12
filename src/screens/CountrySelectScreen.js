import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COUNTRIES from '../data/countries.json';
import { colors } from '../constants/theme';

const flagEmoji = (countryCode) => {
  // Converts ISO-3166 alpha-2 to emoji flag
  // e.g., 'US' => 🇺🇸
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};


const CountryRow = ({ item, selected, onPress }) => (
  <TouchableOpacity style={[styles.row, selected && styles.rowSelected]} onPress={onPress} accessibilityRole="button">
    <View style={styles.leftBlock}>
      <Text style={styles.flag}>{flagEmoji(item.code)}</Text>
      <Text style={styles.code}>{item.code}</Text>
      <Text style={styles.name}>{item.name}</Text>
    </View>
    <View style={[styles.radio, selected && styles.radioActive]}
    />
  </TouchableOpacity>
);

const CountrySelectScreen = ({ onBack, onContinue, defaultValue }) => {
  const [query, setQuery] = useState(defaultValue || '');
  const [selected, setSelected] = useState(null);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView enabled={Platform.OS === 'ios'} behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} onPress={onBack} accessibilityLabel="Go back">
            <View style={styles.chevron} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Your Country</Text>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder="Search"
            placeholderTextColor="#C1C1C1"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <CountryRow
              item={item}
              selected={selected?.code === item.code}
              onPress={() => setSelected(item)}
            />
          )}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, !selected && styles.primaryDisabled]}
            onPress={() => selected && onContinue?.({ key: selected.code, value: selected.name })}
            disabled={!selected}
          >
            <Text style={[styles.primaryText, !selected && styles.primaryTextDisabled]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, marginRight: 8 },
  chevron: { width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.text, transform: [{ rotate: '45deg' }], marginLeft: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  search: { height: 44, backgroundColor: colors.bgAlt, borderRadius: 12, paddingHorizontal: 12, color: colors.text },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  rowSelected: { borderColor: colors.pink },
  leftBlock: { flexDirection: 'row', alignItems: 'center' },
  flag: { fontSize: 22, marginRight: 8 },
  code: { width: 30, color: '#8a8a8a', marginRight: 8 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#FFC1D2', backgroundColor: colors.bg },
  radioActive: { borderColor: colors.pink, backgroundColor: colors.bg },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F1F1F1' },
  primaryButton: { backgroundColor: colors.pink, paddingVertical: 16, borderRadius: 24, alignItems: 'center' },
  primaryDisabled: { backgroundColor: '#E0E0E0' },
  primaryText: { color: '#fff', fontWeight: '700' },
  primaryTextDisabled: { color: '#A0A0A0' },
});

export default CountrySelectScreen;
