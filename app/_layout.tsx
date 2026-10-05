import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DIProvider } from '../src/presentation/di/DIContext';

export default function RootLayout() {
  return (
    <DIProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#FFF',
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/new"
          options={{ title: 'Nova Transação', presentation: 'modal' }}
        />
        <Stack.Screen
          name="pin/setup"
          options={{ title: 'Configurar PIN de 4 Dígitos' }}
        />
        <Stack.Screen
          name="pin/unlock"
          options={{ title: 'Desbloquear Aplicativo', headerShown: false }}
        />
      </Stack>
    </DIProvider>
  );
}
