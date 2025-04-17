import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import { FAB } from '../components/FAB';
import db, { initDB } from '../db/schema';
import { exportAllWorkouts } from '../utils/exportImport';

export default function HomeScreen() {
  const [workouts, setWorkouts] = React.useState([]);

  useEffect(() => {
    initDB();
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM workouts ORDER BY created_at DESC', [], (_, { rows }) => {
        setWorkouts(rows._array);
      });
    });
  }, []);

  const openWorkout = (id) => {
    navigation.navigate('WorkoutEditor', { workoutId: id });
  };

  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Workouts</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <MaterialIcons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={() => exportAllWorkouts()}>
            <Text style={styles.exportText}>Export Workouts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.importBtn} onPress={() => importWorkouts()}>
            <Text style={styles.exportText}>Import Workouts</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={workouts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openWorkout(item.id)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.goal}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No workouts yet. Tap + to add.</Text>}
      />
      <FAB onPress={() => navigation.navigate('WorkoutEditor')} icon={<MaterialIcons name="add" size={28} color="#fff" />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', paddingTop: 48, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  settingsBtn: { marginRight: 8, padding: 8 },
  exportBtn: { backgroundColor: '#444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  importBtn: { backgroundColor: '#444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  exportText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#222', borderRadius: 12, padding: 18, marginBottom: 12 },
  cardTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  cardSub: { fontSize: 14, color: '#aaa', marginTop: 4 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 48 }
});
