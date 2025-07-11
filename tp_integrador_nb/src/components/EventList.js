import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchEvents } from '../services/api';

const EventList = ({ token, onSelectEvent }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ name: '', startdate: '', tag: '' });

  const limit = 15;

  const loadEvents = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = {
        limit,
        offset: reset ? 0 : page * limit,
        ...filters,
      };
      const data = await fetchEvents(token, params);
      if (reset) {
        setEvents(data.collection);
        setPage(1);
      } else {
        setEvents(prev => [...prev, ...data.collection]);
        setPage(prev => prev + 1);
      }
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(true);
  }, [filters]);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => onSelectEvent(item.id)} style={styles.item}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>{item.description}</Text>
      <Text>Fecha: {new Date(item.start_date).toLocaleDateString()}</Text>
      <Text>Precio: {item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TextInput
          placeholder="Nombre"
          value={filters.name}
          onChangeText={text => setFilters(prev => ({ ...prev, name: text }))}
          style={styles.input}
        />
        <TextInput
          placeholder="Fecha inicio (YYYY-MM-DD)"
          value={filters.startdate}
          onChangeText={text => setFilters(prev => ({ ...prev, startdate: text }))}
          style={styles.input}
        />
        <TextInput
          placeholder="Tag"
          value={filters.tag}
          onChangeText={text => setFilters(prev => ({ ...prev, tag: text }))}
          style={styles.input}
        />
        <Button title="Buscar" onPress={() => loadEvents(true)} />
      </View>
      {loading && page === 1 ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          onEndReached={() => {
            if (events.length < total) loadEvents();
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  filters: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontWeight: 'bold', fontSize: 16 },
});

export default EventList;
