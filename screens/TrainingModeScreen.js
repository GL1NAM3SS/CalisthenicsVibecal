import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import db from '../db/schema';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as KeepAwake from 'expo-keep-awake';

export default function TrainingModeScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const workoutId = route.params?.workoutId;
  const [exercises, setExercises] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sets, setSets] = useState([]); // [{exerciseId, setNumber, completed}]
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(60);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (workoutId) {
      db.transaction(tx => {
        tx.executeSql('SELECT we.*, e.name as exercise_name FROM workout_exercises we LEFT JOIN exercises e ON we.exercise_id = e.id WHERE we.workout_id = ?', [workoutId], (_, { rows }) => {
          setExercises(rows._array);
        });
      });
    }
    KeepAwake.activateKeepAwake();
    return () => KeepAwake.deactivateKeepAwake();
  }, [workoutId]);

  useEffect(() => {
    if (resting && timer > 0) {
      const timeout = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timeout);
    } else if (resting && timer === 0) {
      setResting(false);
      Notifications.scheduleNotificationAsync({
        content: { title: 'Rest Over', body: 'Time for your next set!' },
        trigger: null
      });
    }
  }, [resting, timer]);

  const markSetComplete = (exercise, setNumber) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO sets (workout_exercise_id, set_number, completed, completed_at) VALUES (?, ?, 1, datetime())',
        [exercise.id, setNumber],
        () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSets([...sets, { exerciseId: exercise.id, setNumber, completed: true }]);
        }
      );
    });
  };

  const startRest = (seconds) => {
    setResting(true);
    setTimer(seconds);
  };

  if (!exercises.length) return <View style={styles.container}><Text style={styles.title}>Loading workout...</Text></View>;
  const exercise = exercises[currentIdx];
  const totalSets = exercise.sets;
  const completedSets = sets.filter(s => s.exerciseId === exercise.id).map(s => s.setNumber);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise.exercise_name}</Text>
      <Text style={styles.sub}>{exercise.sets} sets × {exercise.reps} reps {exercise.time_seconds ? `(${exercise.time_seconds}s)` : ''}</Text>
      <FlatList
        data={Array.from({ length: totalSets }, (_, i) => i + 1)}
        horizontal
        keyExtractor={n => n.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.setBtn, completedSets.includes(item) && styles.setBtnDone]}
            onPress={() => !completedSets.includes(item) && markSetComplete(exercise, item)}
            disabled={completedSets.includes(item)}
          >
            <Text style={styles.setText}>{item}</Text>
          </TouchableOpacity>
        )}
        style={{ marginVertical: 24 }}
      />
      <TouchableOpacity
        style={styles.restBtn}
        onPress={() => startRest(restTime)}
        disabled={resting}
      >
        <Text style={styles.restText}>{resting ? `Rest: ${timer}s` : 'Start Rest'}</Text>
      </TouchableOpacity>
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setCurrentIdx(idx => Math.max(0, idx - 1))}
          disabled={currentIdx === 0}
        >
          <Text style={styles.navText}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setCurrentIdx(idx => Math.min(exercises.length - 1, idx + 1))}
          disabled={currentIdx === exercises.length - 1}
        >
          <Text style={styles.navText}>Next</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.exitText}>Exit Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  sub: { color: '#aaa', fontSize: 18, textAlign: 'center', marginTop: 8 },
  setBtn: { backgroundColor: '#222', borderRadius: 32, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  setBtnDone: { backgroundColor: '#007AFF' },
  setText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  restBtn: { backgroundColor: '#444', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  restText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  navBtn: { backgroundColor: '#222', padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  navText: { color: '#fff', fontWeight: 'bold' },
  exitBtn: { backgroundColor: '#FF5A5F', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32 },
  exitText: { color: '#fff', fontWeight: 'bold' }
});
