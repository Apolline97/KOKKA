import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getFavoritos, removeFavorito } from '../services/api';

export default function FavoritosScreen({ navigation }: any) {
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const data = await getFavoritos();
    if (Array.isArray(data)) setFavoritos(data);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const quitar = async (recetaId: number) => {
    await removeFavorito(recetaId);
    cargar();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
        <Text style={styles.volverTexto}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Mis favoritas</Text>

      {cargando ? (
        <ActivityIndicator size="large" color="#e07a5f" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() => navigation.navigate('DetalleReceta', { receta: item.receta })}
            >
              {item.receta.imagen_url ? (
                <Image source={{ uri: item.receta.imagen_url }} style={styles.imagen} />
              ) : null}
              <View style={styles.tarjetaTexto}>
                <Text style={styles.tarjetaTitulo}>{item.receta.titulo}</Text>
                <Text style={styles.tarjetaInfo}>
                  {item.receta.categoria} · {item.receta.tiempo_prep} min · {item.receta.calorias} kcal
                </Text>
                <TouchableOpacity onPress={() => quitar(item.receta.id)}>
                  <Text style={styles.quitar}>♥ Quitar de favoritos</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.vacio}>No tienes recetas favoritas aún</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#fffaf7' },
  volver: { marginBottom: 12 },
  volverTexto: { color: '#e07a5f', fontSize: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#c1553a', marginBottom: 16 },
  tarjeta: { borderRadius: 8, backgroundColor: '#fef0eb', marginBottom: 12, overflow: 'hidden' },
  imagen: { width: '100%', height: 140 },
  tarjetaTexto: { padding: 12 },
  tarjetaTitulo: { fontSize: 16, fontWeight: 'bold', color: '#c1553a' },
  tarjetaInfo: { fontSize: 13, color: '#555', marginTop: 4 },
  quitar: { color: '#e07a5f', fontSize: 13, marginTop: 8, fontWeight: 'bold' },
  vacio: { textAlign: 'center', color: '#999', marginTop: 32 },
});
