import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import db from '../db/schema';

export default function ExerciseBottomSheet({ visible, onClose, onSave, workoutId, editData }) {
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState(editData?.exercise_id || null);
  const [progressionId, setProgressionId] = useState(editData?.progression_id || null);
  const [reps, setReps] = useState(editData?.reps || 10);
  const [sets, setSets] = useState(editData?.sets || 3);
  const [timeSeconds, setTimeSeconds] = useState(editData?.time_seconds || 0);
  const [weight, setWeight] = useState(editData?.weight || '');
  const [notes, setNotes] = useState(editData?.notes || '');
  const [progressions, setProgressions] = useState([]);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM exercises', [], (_, { rows }) => {
        setExercises(rows._array);
      });
    });
  }, []);

  useEffect(() => {
    if (exerciseId) {
      db.transaction(tx => {
        tx.executeSql('SELECT * FROM progressions WHERE exercise_id = ?', [exerciseId], (_, { rows }) => {
          setProgressions(rows._array);
        });
      });
    } else {
      setProgressions([]);
    }
  }, [exerciseId]);

  const handleSave = () => {
    if (!exerciseId) return;
    onSave({
      exercise_id: exerciseId,
      progression_id: progressionId,
      reps,
      sets,
      time_seconds: timeSeconds,
      weight,
      notes
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add Exercise</Text>
          <Text style={styles.label}>Exercise</Text>
          <Picker
            selectedValue={exerciseId}
            onValueChange={setExerciseId}
            style={styles.picker}
          >
            <Picker.Item label="Select exercise" value={null} />
            {exercises.map(e => (
              <Picker.Item key={e.id} label={e.name} value={e.id} />
            ))}
          </Picker>
          {progressions.length > 0 && (
            <>
              <Text style={styles.label}>Progression</Text>
              <Picker
                selectedValue={progressionId}
                onValueChange={setProgressionId}
                style={styles.picker}
              >
                <Picker.Item label="Select progression" value={null} />
                {progressions.map(p => (
                  <Picker.Item key={p.id} label={p.name} value={p.id} />
                ))}
              </Picker>
            </>
          )}
          <Text style={styles.label}>Reps</Text>
          <Picker selectedValue={reps} onValueChange={setReps} style={styles.picker}>
            {[...Array(51).keys()].slice(1).map(n => (
              <Picker.Item key={n} label={n.toString()} value={n} />
            ))}
          </Picker>
          <Text style={styles.label}>Sets</Text>
          <Picker selectedValue={sets} onValueChange={setSets} style={styles.picker}>
            {[...Array(21).keys()].slice(1).map(n => (
              <Picker.Item key={n} label={n.toString()} value={n} />
            ))}
          </Picker>
          <Text style={styles.label}>Time (sec, for isometrics)</Text>
          <Picker selectedValue={timeSeconds} onValueChange={setTimeSeconds} style={styles.picker}>
            {[0, ...Array(300).keys()].map(n => (
              <Picker.Item key={n} label={n.toString()} value={n} />
            ))}
          </Picker>
          <Text style={styles.label}>Weight (kg, optional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={weight.toString()}
            onChangeText={setWeight}
            placeholder="e.g. 5"
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes..."
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#181818', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  label: { color: '#aaa', marginTop: 12 },
  picker: { backgroundColor: '#222', color: '#fff', marginTop: 4 },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 8, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#aaa', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
