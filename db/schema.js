// SQLite schema and seed for built-in exercises and progressions
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('calisthenics.db');

export function initDB() {
  db.transaction(tx => {
    // Workouts
    tx.executeSql(`CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at TEXT,
      goal TEXT,
      comments TEXT
    );`);
    // Exercises
    tx.executeSql(`CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      subtype TEXT,
      progression_id INTEGER,
      is_custom INTEGER DEFAULT 0
    );`);
    // Progressions
    tx.executeSql(`CREATE TABLE IF NOT EXISTS progressions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER,
      name TEXT,
      description TEXT,
      goal TEXT,
      difficulty INTEGER,
      prev_prog_id INTEGER,
      next_prog_id INTEGER
    );`);
    // Workout Exercises (junction)
    tx.executeSql(`CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER,
      exercise_id INTEGER,
      progression_id INTEGER,
      reps INTEGER,
      sets INTEGER,
      time_seconds INTEGER,
      weight REAL,
      notes TEXT
    );`);
    // Sets (for tracking completion)
    tx.executeSql(`CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id INTEGER,
      set_number INTEGER,
      completed INTEGER,
      completed_at TEXT
    );`);
  });
}

// Seed built-in exercises and progressions
export function seedBuiltInExercises() {
  db.transaction(tx => {
    // Example: Pull-ups
    tx.executeSql(`INSERT OR IGNORE INTO exercises (id, name, category, subtype, is_custom) VALUES (1, 'Pull-up', 'pull-ups', 'dynamic', 0);`);
    tx.executeSql(`INSERT OR IGNORE INTO progressions (id, exercise_id, name, description, goal, difficulty, prev_prog_id, next_prog_id) VALUES
      (1, 1, 'Negative Pull-up', 'Lowering phase only', 'strength', 2, NULL, 2),
      (2, 1, 'Australian Pull-up', 'Body at angle', 'strength', 3, 1, 3),
      (3, 1, 'Assisted Pull-up', 'With band or partner', 'strength', 4, 2, 4),
      (4, 1, 'Standard Pull-up', 'Full range', 'strength', 6, 3, 5),
      (5, 1, 'Archer Pull-up', 'One arm assists', 'strength', 8, 4, 6),
      (6, 1, 'One-Arm Pull-up', 'Advanced', 'strength', 10, 5, NULL)
    ;`);
    // Add more built-in exercises/progressions as needed
  });
}

export default db;
