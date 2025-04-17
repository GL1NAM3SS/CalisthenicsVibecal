import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import db from '../db/schema';

export async function exportAllWorkouts() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM workouts', [], async (_, { rows }) => {
        const workouts = rows._array;
        let content = '# Workout History\n\n';
        for (let w of workouts) {
          content += `Workout: ${w.name} - ${new Date(w.created_at).toLocaleDateString()}\n`;
          content += '-------------------------------\n';
          content += `Goal: ${w.goal || ''}\n`;
          content += `Comments: ${w.comments || ''}\n`;
          // Exercises
          await new Promise((res, rej) => {
            tx.executeSql('SELECT we.*, e.name as exercise_name FROM workout_exercises we LEFT JOIN exercises e ON we.exercise_id = e.id WHERE we.workout_id = ?', [w.id], (_, { rows }) => {
              for (let ex of rows._array) {
                content += `- ${ex.exercise_name} - Progression: ${ex.progression_id || ''}\n  Sets: ${ex.sets}\n  Reps: ${ex.reps}\n  Time: ${ex.time_seconds || ''}\n  Weight: ${ex.weight || ''}\n  Notes: ${ex.notes || ''}\n`;
              }
              res();
            });
          });
          content += '\n';
        }
        // Write to file
        const fileUri = FileSystem.cacheDirectory + 'workouts_export.md';
        await FileSystem.writeAsStringAsync(fileUri, content);
        await Sharing.shareAsync(fileUri);
        resolve();
      }, reject);
    });
  });
}

export async function exportExerciseDB() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM exercises', [], async (_, { rows }) => {
        const exercises = rows._array;
        let content = '# Exercise Database\n\n';
        for (let e of exercises) {
          content += `Exercise: ${e.name}\nCategory: ${e.category}\nSubtype: ${e.subtype}\nCustom: ${e.is_custom ? 'Yes' : 'No'}\n`;
          // Progressions
          await new Promise((res, rej) => {
            tx.executeSql('SELECT * FROM progressions WHERE exercise_id = ?', [e.id], (_, { rows }) => {
              for (let p of rows._array) {
                content += `  - ${p.name} (Goal: ${p.goal}, Difficulty: ${p.difficulty}/10)\n    ${p.description}\n`;
              }
              res();
            });
          });
          content += '\n';
        }
        const fileUri = FileSystem.cacheDirectory + 'exercise_db_export.md';
        await FileSystem.writeAsStringAsync(fileUri, content);
        await Sharing.shareAsync(fileUri);
        resolve();
      }, reject);
    });
  });
}

export async function exportSingleWorkout(workoutId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM workouts WHERE id = ?', [workoutId], async (_, { rows }) => {
        if (!rows.length) return reject('Workout not found');
        const w = rows._array[0];
        let content = `# Workout: ${w.name}\n`;
        content += `Date: ${new Date(w.created_at).toLocaleDateString()}\n`;
        content += `Goal: ${w.goal || ''}\n`;
        content += `Comments: ${w.comments || ''}\n`;
        // Exercises
        await new Promise((res, rej) => {
          tx.executeSql('SELECT we.*, e.name as exercise_name FROM workout_exercises we LEFT JOIN exercises e ON we.exercise_id = e.id WHERE we.workout_id = ?', [w.id], (_, { rows }) => {
            for (let ex of rows._array) {
              content += `- ${ex.exercise_name} - Progression: ${ex.progression_id || ''}\n  Sets: ${ex.sets}\n  Reps: ${ex.reps}\n  Time: ${ex.time_seconds || ''}\n  Weight: ${ex.weight || ''}\n  Notes: ${ex.notes || ''}\n`;
            }
            res();
          });
        });
        content += '\n';
        // Write to file
        const fileUri = FileSystem.cacheDirectory + `workout_${w.id}_export.md`;
        await FileSystem.writeAsStringAsync(fileUri, content);
        await Sharing.shareAsync(fileUri);
        resolve();
      }, reject);
    });
  });
}

import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export async function importWorkouts() {
  try {
    const res = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'text/markdown', 'application/octet-stream'] });
    if (res.type !== 'success') return;
    const content = await FileSystem.readAsStringAsync(res.uri);
    // Very basic parsing: expects lines starting with '# Workout:'
    const workouts = content.split(/# Workout:/).slice(1);
    db.transaction(tx => {
      workouts.forEach(block => {
        const lines = block.split('\n').map(l => l.trim());
        const name = lines[0];
        const goal = (lines.find(l => l.startsWith('Goal:')) || '').replace('Goal:', '').trim();
        const comments = (lines.find(l => l.startsWith('Comments:')) || '').replace('Comments:', '').trim();
        tx.executeSql('INSERT INTO workouts (name, created_at, goal, comments) VALUES (?, datetime(), ?, ?)', [name, goal, comments], (_, result) => {
          const workoutId = result.insertId;
          // Parse exercises
          lines.forEach(line => {
            if (line.startsWith('- ')) {
              const [exName, ...rest] = line.replace('- ', '').split(' - Progression: ');
              tx.executeSql('SELECT id FROM exercises WHERE name = ?', [exName], (_, { rows }) => {
                let exId = rows.length ? rows._array[0].id : null;
                if (!exId) {
                  tx.executeSql('INSERT INTO exercises (name, category, subtype, is_custom) VALUES (?, ?, ?, 1)', [exName, '', ''], (_, r) => {
                    exId = r.insertId;
                    insertWorkoutExercise(tx, workoutId, exId, rest[0]);
                  });
                } else {
                  insertWorkoutExercise(tx, workoutId, exId, rest[0]);
                }
              });
            }
          });
        });
      });
    });
    Alert.alert('Import Complete', 'Workouts imported.');
  } catch (e) {
    Alert.alert('Import Failed', e.message);
  }
}

function insertWorkoutExercise(tx, workoutId, exId, progression) {
  // This is a basic stub, for more fields parsing can be improved
  tx.executeSql('INSERT INTO workout_exercises (workout_id, exercise_id, progression_id, reps, sets, time_seconds, weight, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [workoutId, exId, null, 0, 0, 0, 0, '']);
}

export async function importExerciseDB() {
  try {
    const res = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'text/markdown', 'application/octet-stream'] });
    if (res.type !== 'success') return;
    const content = await FileSystem.readAsStringAsync(res.uri);
    // Very basic parsing: expects lines starting with 'Exercise:'
    const exercises = content.split(/Exercise:/).slice(1);
    db.transaction(tx => {
      exercises.forEach(block => {
        const lines = block.split('\n').map(l => l.trim());
        const name = lines[0];
        const category = (lines.find(l => l.startsWith('Category:')) || '').replace('Category:', '').trim();
        const subtype = (lines.find(l => l.startsWith('Subtype:')) || '').replace('Subtype:', '').trim();
        tx.executeSql('INSERT INTO exercises (name, category, subtype, is_custom) VALUES (?, ?, ?, 1)', [name, category, subtype]);
        // Progression parsing can be added here
      });
    });
    Alert.alert('Import Complete', 'Exercises imported.');
  } catch (e) {
    Alert.alert('Import Failed', e.message);
  }
}
