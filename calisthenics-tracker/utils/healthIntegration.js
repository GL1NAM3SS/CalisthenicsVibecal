// healthIntegration.js
// Scaffolding for Apple Health (iOS) and Google Fit (Android) integration
// This module provides connect/disconnect and sync functions for both platforms.

import { Platform, Alert } from 'react-native';

// Apple HealthKit (iOS)
let AppleHealthKit;
if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch (e) {
    AppleHealthKit = null;
  }
}

// Google Fit (Android)
let GoogleFit;
if (Platform.OS === 'android') {
  try {
    GoogleFit = require('react-native-google-fit').default;
  } catch (e) {
    GoogleFit = null;
  }
}

export async function connectHealthIntegration() {
  if (Platform.OS === 'ios' && AppleHealthKit) {
    // Request permissions for Apple HealthKit
    return new Promise((resolve, reject) => {
      const options = {
        permissions: {
          read: ["ActiveEnergyBurned", "Workout"],
          write: ["Workout"]
        }
      };
      AppleHealthKit.initHealthKit(options, (err, res) => {
        if (err) {
          Alert.alert('Apple HealthKit Error', err.message || String(err));
          reject(err);
        } else {
          Alert.alert('Apple HealthKit Connected', 'Successfully connected to Apple Health.');
          resolve(res);
        }
      });
    });
  } else if (Platform.OS === 'android' && GoogleFit) {
    // Request permissions for Google Fit
    return new Promise((resolve, reject) => {
      GoogleFit.authorize()
        .then(authResult => {
          if (authResult.success) {
            Alert.alert('Google Fit Connected', 'Successfully connected to Google Fit.');
            resolve(authResult);
          } else {
            Alert.alert('Google Fit Error', authResult.message || 'Authorization failed');
            reject(authResult);
          }
        })
        .catch(err => {
          Alert.alert('Google Fit Error', err.message || String(err));
          reject(err);
        });
    });
  } else {
    Alert.alert('Integration Not Supported', 'Health integration is only available on iOS (Apple Health) and Android (Google Fit).');
  }
}

export async function disconnectHealthIntegration() {
  // No official disconnect, but can revoke tokens or show info
  Alert.alert('Disconnected', 'Health integration disconnected.');
}

export async function syncWorkoutToHealth({ name, duration, calories, startDate, endDate }) {
  if (Platform.OS === 'ios' && AppleHealthKit) {
    // Example: Save workout to Apple Health
    AppleHealthKit.saveWorkout({
      type: 'Other',
      startDate,
      endDate,
      duration,
      energyBurned: calories,
      energyBurnedUnit: 'kcal',
      metadata: { name },
    }, (err, res) => {
      if (err) Alert.alert('Apple HealthKit Error', err.message || String(err));
      else Alert.alert('Workout Synced', 'Workout synced to Apple Health!');
    });
  } else if (Platform.OS === 'android' && GoogleFit) {
    // Example: Save workout to Google Fit
    GoogleFit.saveWorkout({
      start: startDate,
      end: endDate,
      activityType: 'Other',
      calories,
      name,
    }, (err, res) => {
      if (err) Alert.alert('Google Fit Error', err.message || String(err));
      else Alert.alert('Workout Synced', 'Workout synced to Google Fit!');
    });
  } else {
    Alert.alert('Integration Not Supported', 'Health integration is not available on this platform.');
  }
}
