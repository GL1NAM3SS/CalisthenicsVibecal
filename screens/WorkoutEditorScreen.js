import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import db from '../db/schema';
import ExerciseBottomSheet from '../components/ExerciseBottomSheet';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { exportSingleWorkout } from '../utils/exportImport';

export default function WorkoutEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const workoutId = route.params?.workoutId;
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [comments, setComments] = useState('');
  const [exercises, setExercises] = useState([]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [editExerciseData, setEditExerciseData] = useState(null);

  useEffect(() => {
    if (workoutId) {
      db.transaction(tx => {
        tx.executeSql('SELECT * FROM workouts WHERE id = ?', [workoutId], (_, { rows }) => {
          if (rows.length > 0) {
            const w = rows._array[0];
            setName(w.name);
            setGoal(w.goal);
            setComments(w.comments);
          }
        });
      });
      fetchExercises();
    }
  }, [workoutId]);

  const fetchExercises = () => {
    if (workoutId) {
      db.transaction(tx => {
        tx.executeSql('SELECT we.*, e.name as exercise_name FROM workout_exercises we LEFT JOIN exercises e ON we.exercise_id = e.id WHERE we.workout_id = ?', [workoutId], (_, { rows }) => {
          setExercises(rows._array);
        });
      });
    }
  };

  const saveWorkout = () => {
    if (!name) return;
    if (workoutId) {
      db.transaction(tx => {
        tx.executeSql('UPDATE workouts SET name=?, goal=?, comments=? WHERE id=?', [name, goal, comments, workoutId]);
      });
    } else {
      db.transaction(tx => {
        tx.executeSql('INSERT INTO workouts (name, created_at, goal, comments) VALUES (?, datetime(), ?, ?)', [name, goal, comments], (_, result) => {
          const newId = result.insertId;
          navigation.replace('WorkoutEditor', { workoutId: newId });
        });
      });
      return;
    }
    navigation.goBack();
  };

  const handleAddExercise = (data) => {
    if (!workoutId) return;
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO workout_exercises (workout_id, exercise_id, progression_id, reps, sets, time_seconds, weight, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [workoutId, data.exercise_id, data.progression_id, data.reps, data.sets, data.time_seconds, data.weight, data.notes],
        () => fetchExercises()
      );
    });
    setShowBottomSheet(false);
  };

  const handleEditExercise = (item) => {
    setEditExerciseData(item);
    setShowBottomSheet(true);
  };

  const handleDeleteExercise = (id) => {
    Alert.alert('Delete Exercise', 'Are you sure you want to remove this exercise from the workout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        db.transaction(tx => {
          tx.executeSql('DELETE FROM workout_exercises WHERE id = ?', [id], () => fetchExercises());
        });
      }}
    ]);
  };

  // Add set to exercise with haptic feedback
  const handleAddSet = (item) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE workout_exercises SET sets = sets + 1 WHERE id = ?',
        [item.id],
        () => fetchExercises()
      );
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    if (workoutId) {
      db.transaction(tx => {
        tx.executeSql('SELECT * FROM workouts WHERE id = ?', [workoutId], (_, { rows }) => {
          if (rows.length > 0) {
            const w = rows._array[0];
            setName(w.name);
            setGoal(w.goal);
            setComments(w.comments);
          }
        });
      });
    }
  }, [workoutId]);

  const saveWorkout = () => {
    if (!name) return;
    if (workoutId) {
      db.transaction(tx => {
        tx.executeSql('UPDATE workouts SET name=?, goal=?, comments=? WHERE id=?', [name, goal, comments, workoutId]);
      });
    } else {
      db.transaction(tx => {
        tx.executeSql('INSERT INTO workouts (name, created_at, goal, comments) VALUES (?, datetime(), ?, ?)', [name, goal, comments]);
      });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {workoutId && (
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Edit Workout</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={() => exportSingleWorkout(workoutId)}>
            <Text style={styles.exportText}>Export Workout</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.label}>Workout Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Push Focus" />
      <Text style={styles.label}>Goal</Text>
      <TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="e.g. Strength" />
      <Text style={styles.label}>Comments</Text>
      <TextInput style={styles.input} value={comments} onChangeText={setComments} placeholder="Notes..." multiline />
      <Text style={styles.label}>Exercises</Text>
      <FlatList
        data={exercises}
        keyExtractor={item => item.id?.toString()}
        renderItem={({ item }) => (
          <PanGestureHandler
            onGestureEvent={({ nativeEvent }) => {
              if (nativeEvent.translationY < -50 && Math.abs(nativeEvent.velocityY) > 500) {
                // Swipe up detected
                handleAddSet(item);
              }
            }}
          >
            <View>
              <TouchableOpacity style={styles.exerciseCard} onPress={() => handleEditExercise(item)}>
                <Text style={styles.exerciseTitle}>{item.exercise_name}</Text>
                <Text style={styles.exerciseSub}>{item.sets} x {item.reps} reps {item.time_seconds ? `(${item.time_seconds}s)` : ''}</Text>
                <TouchableOpacity onPress={() => handleDeleteExercise(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
                <Text style={styles.swipeHint}>⬆️ Swipe up to add set</Text>
              </TouchableOpacity>
            </View>
          </PanGestureHandler>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exercises. Add one below.</Text>}
        style={{ maxHeight: 200, marginTop: 8 }}
      />
      <TouchableOpacity style={styles.addExerciseBtn} onPress={() => { setEditExerciseData(null); setShowBottomSheet(true); }}>
        <Text style={styles.addExerciseText}>+ Add Exercise</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveBtn} onPress={saveWorkout}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
      <ExerciseBottomSheet
        visible={showBottomSheet}
        onClose={() => { setShowBottomSheet(false); setEditExerciseData(null); }}
        onSave={editExerciseData ? (data) => {
          db.transaction(tx => {
            tx.executeSql(
              'UPDATE workout_exercises SET exercise_id=?, progression_id=?, reps=?, sets=?, time_seconds=?, weight=?, notes=? WHERE id=?',
              [data.exercise_id, data.progression_id, data.reps, data.sets, data.time_seconds, data.weight, data.notes, editExerciseData.id],
              () => fetchExercises()
            );
          });
          setShowBottomSheet(false);
          setEditExerciseData(null);
        } : handleAddExercise}
        workoutId={workoutId}
        editData={editExerciseData}
      />
      <TouchableOpacity
        style={[styles.startWorkoutBtn, exercises.length === 0 && { opacity: 0.5 }]}
        onPress={() => navigation.navigate('TrainingMode', { workoutId })}
        disabled={exercises.length === 0}
      >
        <Text style={styles.startWorkoutText}>Start Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  exportBtn: { backgroundColor: '#444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  exportText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  label: { color: '#fff', fontSize: 16, marginTop: 16 },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 12, marginTop: 8 },
  saveBtn: { backgroundColor: '#007AFF', marginTop: 32, padding: 16, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  exerciseCard: { backgroundColor: '#222', borderRadius: 8, padding: 12, marginVertical: 6 },
  exerciseTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  exerciseSub: { color: '#aaa', fontSize: 14, marginTop: 2 },
  deleteBtn: { position: 'absolute', right: 10, top: 10 },
  deleteText: { color: '#FF5A5F', fontWeight: 'bold' },
  addExerciseBtn: { backgroundColor: '#444', marginTop: 10, padding: 12, borderRadius: 8, alignItems: 'center' },
  addExerciseText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 8 },
  swipeHint: { color: '#888', fontSize: 12, marginTop: 4, textAlign: 'right' },
  startWorkoutBtn: { backgroundColor: '#12C06A', marginTop: 24, padding: 18, borderRadius: 12, alignItems: 'center' },
  startWorkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 20 }
});
