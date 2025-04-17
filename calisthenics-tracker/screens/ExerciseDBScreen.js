import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import db from '../db/schema';
import ProgressionCarousel from '../components/ProgressionCarousel';
import { exportExerciseDB } from '../utils/exportImport';

export default function ExerciseDBScreen() {
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState([]);
  const [category, setCategory] = useState('');
  const [subtype, setSubtype] = useState('');
  const [difficulty, setDifficulty] = useState(0);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM exercises', [], (_, { rows }) => {
        setExercises(rows._array);
      });
    });
  }, []);

  // Gather unique categories and subtypes for filters
  const categories = Array.from(new Set(exercises.map(e => e.category).filter(Boolean)));
  const subtypes = Array.from(new Set(exercises.filter(e => !category || e.category === category).map(e => e.subtype).filter(Boolean)));

  // Filtering logic
  const filtered = exercises.filter(e => {
    const matchesName = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || e.category === category;
    const matchesSubtype = !subtype || e.subtype === subtype;
    let matchesDifficulty = true;
    if (difficulty > 0 && e.id) {
      // Check if any progression for this exercise matches difficulty
      // This is a basic stub: in a real app, progressions would be pre-fetched or filtered in SQL
      // Here, we just allow all unless difficulty is set
    }
    return matchesName && matchesCategory && matchesSubtype && matchesDifficulty;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Exercise Database</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.exportBtn} onPress={exportExerciseDB}>
            <Text style={styles.exportText}>Export DB</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.importBtn} onPress={importExerciseDB}>
            <Text style={styles.exportText}>Import DB</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Search exercises..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filterRow}>
        <Picker
          selectedValue={category}
          style={styles.picker}
          onValueChange={setCategory}
        >
          <Picker.Item label="All Categories" value="" />
          {categories.map(cat => <Picker.Item key={cat} label={cat} value={cat} />)}
        </Picker>
        <Picker
          selectedValue={subtype}
          style={styles.picker}
          onValueChange={setSubtype}
        >
          <Picker.Item label="All Subtypes" value="" />
          {subtypes.map(sub => <Picker.Item key={sub} label={sub} value={sub} />)}
        </Picker>
      </View>
      {/* Difficulty filter UI can be added here if difficulty is needed */}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.category} - {item.subtype}</Text>
            <ProgressionCarousel
              exerciseId={item.id}
              onAddCustom={() => Alert.alert('Custom Progression', 'Feature coming soon!')}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exercises found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', paddingTop: 48, paddingHorizontal: 16 },
  filterRow: { flexDirection: 'row', marginBottom: 8 },
  picker: { flex: 1, color: '#fff', backgroundColor: '#222', borderRadius: 8, marginRight: 8 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  exportBtn: { backgroundColor: '#444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  importBtn: { backgroundColor: '#444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  exportText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 16 },
  card: { backgroundColor: '#222', borderRadius: 12, padding: 18, marginBottom: 12 },
  cardTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  cardSub: { fontSize: 14, color: '#aaa', marginTop: 4 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 48 }
});
