import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './screens/HomeScreen';
import WorkoutEditorScreen from './screens/WorkoutEditorScreen';
import ExerciseDBScreen from './screens/ExerciseDBScreen';
import TrainingModeScreen from './screens/TrainingModeScreen';
import SettingsScreen from './screens/SettingsScreen';
import { StatusBar } from 'expo-status-bar';

// Enable native screens for performance
enableScreens();

const Stack = createNativeStackNavigator();

function MainApp() {
  const { theme } = useTheme();

  useEffect(() => {
    // Request notification permissions
    Notifications.requestPermissionsAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationContainer theme={{
        dark: theme.background === '#111' || theme.background === '#000',
        colors: {
          background: theme.background,
          card: theme.card,
          text: theme.text,
          primary: theme.accent,
          border: theme.card,
          notification: theme.accent,
        },
      }}>
        <StatusBar style={theme.background === '#fff' ? 'dark' : 'light'} />
        <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="WorkoutEditor" component={WorkoutEditorScreen} options={{ gestureEnabled: true }} />
          <Stack.Screen name="ExerciseDB" component={ExerciseDBScreen} options={{ gestureEnabled: true }} />
          <Stack.Screen name="TrainingMode" component={TrainingModeScreen} options={{ gestureEnabled: true }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ gestureEnabled: true }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
