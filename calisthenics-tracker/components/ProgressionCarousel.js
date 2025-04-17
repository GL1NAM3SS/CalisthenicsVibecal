  import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import db from '../db/schema';

const { width } = Dimensions.get('window');

export default function ProgressionCarousel({ exerciseId, onAddCustom }) {
  const [progressions, setProgressions] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (exerciseId) {
      db.transaction(tx => {
        tx.executeSql('SELECT * FROM progressions WHERE exercise_id = ? ORDER BY difficulty ASC', [exerciseId], (_, { rows }) => {
          setProgressions(rows._array);
        });
      });
    }
  }, [exerciseId]);

  if (!progressions.length) return null;
  const prog = progressions[current];

  const goPrev = () => setCurrent(c => Math.max(0, c - 1));
  const goNext = () => setCurrent(c => Math.min(progressions.length - 1, c + 1));

  return (
    <View style={styles.carousel}>
      <TouchableOpacity onPress={goPrev} disabled={current === 0} style={styles.arrowBtn}>
        <Text style={styles.arrow}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.name}>{prog.name}</Text>
        <Text style={styles.desc}>{prog.description}</Text>
        <Text style={styles.goal}>Goal: {prog.goal}</Text>
        <Text style={styles.level}>Difficulty: {prog.difficulty}/10</Text>
        <View style={styles.linksRow}>
          {prog.prev_prog_id && <Text style={styles.link}>← Easier</Text>}
          {prog.next_prog_id && <Text style={styles.link}>Harder →</Text>}
        </View>
      </View>
      <TouchableOpacity onPress={goNext} disabled={current === progressions.length - 1} style={styles.arrowBtn}>
        <Text style={styles.arrow}>{'>'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addBtn} onPress={onAddCustom}>
        <Text style={styles.addText}>+ Add Progression</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  arrowBtn: { padding: 8 },
  arrow: { color: '#fff', fontSize: 28 },
  card: { width: width * 0.65, backgroundColor: '#222', borderRadius: 14, padding: 16, alignItems: 'center' },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  desc: { color: '#aaa', fontSize: 14, marginTop: 6, textAlign: 'center' },
  goal: { color: '#6cf', fontSize: 14, marginTop: 6 },
  level: { color: '#fc6', fontSize: 14, marginTop: 6 },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  link: { color: '#fff', fontSize: 12 },
  addBtn: { marginLeft: 12, backgroundColor: '#444', borderRadius: 8, padding: 8 },
  addText: { color: '#fff', fontSize: 14 }
});
