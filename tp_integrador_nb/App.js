import React, { useState } from 'react';
import { SafeAreaView, Text, Button, View } from 'react-native';
import Login from './src/components/Login';
import EventList from './src/components/EventList';

export default function App() {
  const [token, setToken] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const handleLogout = () => {
    setToken(null);
    setSelectedEventId(null);
  };

  if (!token) {
    return <Login onLoginSuccess={setToken} />;
  }

  if (!selectedEventId) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Button title="Cerrar sesión" onPress={handleLogout} />
        <EventList token={token} onSelectEvent={setSelectedEventId} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Detalle del evento {selectedEventId} (pendiente implementar)</Text>
      <Button title="Volver al listado" onPress={() => setSelectedEventId(null)} />
      <Button title="Cerrar sesión" onPress={handleLogout} />
    </SafeAreaView>
  );
}
