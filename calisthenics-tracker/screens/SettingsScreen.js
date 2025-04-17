import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import * as Notifications from 'expo-notifications';
import { connectHealthIntegration, disconnectHealthIntegration } from '../utils/healthIntegration';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import db from '../db/schema';

async function backupData() {
  // Export all tables as JSON
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM workouts', [], (_, { rows }) => {
        const workouts = rows._array;
        tx.executeSql('SELECT * FROM exercises', [], (_, { rows }) => {
          const exercises = rows._array;
          tx.executeSql('SELECT * FROM progressions', [], async (_, { rows }) => {
            const progressions = rows._array;
            tx.executeSql('SELECT * FROM workout_exercises', [], async (_, { rows }) => {
              const workoutExercises = rows._array;
              tx.executeSql('SELECT * FROM sets', [], async (_, { rows }) => {
                const sets = rows._array;
                const data = { workouts, exercises, progressions, workoutExercises, sets };
                const fileUri = FileSystem.cacheDirectory + 'calisthenics_backup.json';
                await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
                await Sharing.shareAsync(fileUri);
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

async function restoreData() {
  try {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (res.type !== 'success') return;
    const content = await FileSystem.readAsStringAsync(res.uri);
    const data = JSON.parse(content);
    db.transaction(tx => {
      if (data.workouts) data.workouts.forEach(w => tx.executeSql('INSERT OR REPLACE INTO workouts (id, name, created_at, goal, comments) VALUES (?, ?, ?, ?, ?)', [w.id, w.name, w.created_at, w.goal, w.comments]));
      if (data.exercises) data.exercises.forEach(e => tx.executeSql('INSERT OR REPLACE INTO exercises (id, name, category, subtype, is_custom) VALUES (?, ?, ?, ?, ?)', [e.id, e.name, e.category, e.subtype, e.is_custom]));
      if (data.progressions) data.progressions.forEach(p => tx.executeSql('INSERT OR REPLACE INTO progressions (id, exercise_id, name, description, goal, difficulty, prev_prog_id, next_prog_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [p.id, p.exercise_id, p.name, p.description, p.goal, p.difficulty, p.prev_prog_id, p.next_prog_id]));
      if (data.workoutExercises) data.workoutExercises.forEach(we => tx.executeSql('INSERT OR REPLACE INTO workout_exercises (id, workout_id, exercise_id, progression_id, reps, sets, time_seconds, weight, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [we.id, we.workout_id, we.exercise_id, we.progression_id, we.reps, we.sets, we.time_seconds, we.weight, we.notes]));
      if (data.sets) data.sets.forEach(s => tx.executeSql('INSERT OR REPLACE INTO sets (id, workout_exercise_id, set_number, completed, completed_at) VALUES (?, ?, ?, ?, ?)', [s.id, s.workout_exercise_id, s.set_number, s.completed, s.completed_at]));
    });
    Alert.alert('Restore Complete', 'Your data has been restored.');
  } catch (e) {
    Alert.alert('Restore Failed', e.message);
  }
}

const THEME_OPTIONS = [
  { key: 'system', label: 'System Default' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'amoled', label: 'AMOLED Black' },
];

export default function SettingsScreen() {
  const [theme, setTheme] = useState('system');
  const [restNotifications, setRestNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(false);
  const [healthIntegration, setHealthIntegration] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(t => {
      if (t) setTheme(t);
    });
    AsyncStorage.getItem('restNotifications').then(v => setRestNotifications(v !== 'false'));
    AsyncStorage.getItem('workoutReminders').then(v => setWorkoutReminders(v === 'true'));
    AsyncStorage.getItem('healthIntegration').then(v => setHealthIntegration(v === 'true'));
  }, []);

  const selectTheme = async (t) => {
    setTheme(t);
    await AsyncStorage.setItem('theme', t);
    Alert.alert('Theme Changed', `Theme set to ${THEME_OPTIONS.find(opt => opt.key === t)?.label}`);
  };

  const toggleRestNotifications = async () => {
    const newVal = !restNotifications;
    setRestNotifications(newVal);
    await AsyncStorage.setItem('restNotifications', String(newVal));
    if (newVal) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest Timer',
          body: 'Your rest period is over. Time to continue your workout!',
        },
        trigger: { seconds: 60, repeats: false }, // Example: 1 min rest
      });
      Alert.alert('Rest Timer Enabled', 'A sample rest timer notification will fire in 1 minute.');
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Rest Timer Disabled', 'All rest timer notifications cancelled.');
    }
  };

  const toggleWorkoutReminders = async () => {
    const newVal = !workoutReminders;
    setWorkoutReminders(newVal);
    await AsyncStorage.setItem('workoutReminders', String(newVal));
    if (newVal) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Workout Reminder',
          body: 'Don\'t forget to train today! 💪',
        },
        trigger: { hour: 18, minute: 0, repeats: true }, // Example: daily at 6pm
      });
      Alert.alert('Workout Reminder Enabled', 'A daily workout reminder will fire at 6:00 PM.');
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Workout Reminder Disabled', 'All workout reminders cancelled.');
    }
  };

  const toggleHealthIntegration = async () => {
    const newVal = !healthIntegration;
    setHealthIntegration(newVal);
    await AsyncStorage.setItem('healthIntegration', String(newVal));
    if (newVal) {
      await connectHealthIntegration();
    } else {
      await disconnectHealthIntegration();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings & Backup</Text>
      <TouchableOpacity style={styles.btn} onPress={backupData}>
        <Text style={styles.btnText}>Backup Data (Cloud/Drive)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={restoreData}>
        <Text style={styles.btnText}>Restore Data</Text>
      </TouchableOpacity>
      <View style={styles.themeSection}>
        <Text style={styles.themeLabel}>Theme</Text>
        {THEME_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.themeBtn, theme === opt.key && styles.themeBtnActive]}
            onPress={() => selectTheme(opt.key)}
          >
            <Text style={[styles.themeBtnText, theme === opt.key && styles.themeBtnTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.optionLabel}>Rest Timer Notifications</Text>
          <Switch value={restNotifications} onValueChange={toggleRestNotifications} />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.optionLabel}>Workout Reminders</Text>
          <Switch value={workoutReminders} onValueChange={toggleWorkoutReminders} />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Integrations</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.optionLabel}>Apple Health / Google Fit</Text>
          <Switch value={healthIntegration} onValueChange={toggleHealthIntegration} />
        </View>
      </View>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 24 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  btn: { backgroundColor: '#444', borderRadius: 10, padding: 18, marginVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  themeSection: { marginTop: 24 },
  themeLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  themeBtn: { backgroundColor: '#222', borderRadius: 8, padding: 12, marginVertical: 5 },
  themeBtnActive: { backgroundColor: '#12C06A' },
  themeBtnText: { color: '#fff', fontSize: 16 },
  themeBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  section: { marginTop: 32 },
  sectionLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  optionLabel: { color: '#fff', fontSize: 16 },
});
