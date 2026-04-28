import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavoritos, addFavorito, removeFavorito } from '../services/api';

export default function DetalleRecetaScreen({ route, navigation }: any) {
  const { receta } = route.params;
  const [esFavorito, setEsFavorito] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const comprobar = async () => {
      const [dataFavs, storedId] = await Promise.all([
        getFavoritos(),
        AsyncStorage.getItem('user_id'),
      ]);
      if (Array.isArray(dataFavs)) {
        setEsFavorito(dataFavs.some((f: any) => f.receta.id === receta.id));
      }
      if (storedId) setUserId(parseInt(storedId));
    };
    comprobar();
  }, []);

  const toggleFavorito = async () => {
    if (esFavorito) {
      await removeFavorito(receta.id);
      setEsFavorito(false);
    } else {
      await addFavorito(receta.id);
      setEsFavorito(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
        <Text style={styles.volverTexto}>← Volver</Text>
      </TouchableOpacity>

      {receta.imagen_url ? (
        <Image source={{ uri: receta.imagen_url }} style={styles.imagen} />
      ) : null}

      <View style={styles.cabecera}>
        <Text style={styles.titulo}>{receta.titulo}</Text>
        <View style={styles.cabeceraAcciones}>
          {receta.creador?.id === userId && (
            <TouchableOpacity
              onPress={() => navigation.navigate('EditarReceta', { receta })}
              style={styles.botonEditar}
            >
              <Text style={styles.botonEditarTexto}>✏️ Editar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleFavorito} style={styles.corazon}>
            <Text style={styles.corazonTexto}>{esFavorito ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fila}>
        <Text style={styles.etiqueta}>{receta.categoria}</Text>
        <Text style={styles.etiqueta}>{receta.tiempo_prep} min</Text>
        <Text style={styles.etiqueta}>{receta.calorias} kcal</Text>
      </View>

      <Text style={styles.descripcion}>{receta.descripcion}</Text>

      <Text style={styles.seccion}>Ingredientes</Text>
      {receta.ingredientes && receta.ingredientes.length > 0 ? (
        receta.ingredientes.map((ri: any) => (
          <Text key={ri.id} style={styles.item}>
            • {ri.cantidad} {ri.ingrediente.unidad_medida} de {ri.ingrediente.nombre}
          </Text>
        ))
      ) : (
        <Text style={styles.vacio}>Sin ingredientes</Text>
      )}

      <Text style={styles.seccion}>Pasos</Text>
      {receta.pasos && receta.pasos.length > 0 ? (
        receta.pasos.map((paso: any) => (
          <View key={paso.id} style={styles.paso}>
            <Text style={styles.pasoNumero}>{paso.numero}</Text>
            <Text style={styles.pasoTexto}>{paso.descripcion}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.vacio}>Sin pasos</Text>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf7' },
  imagen: { width: '100%', height: 220 },
  volver: { marginBottom: 12, paddingHorizontal: 16, paddingTop: 48 },
  volverTexto: { color: '#e07a5f', fontSize: 16 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#c1553a', flex: 1 },
  cabeceraAcciones: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botonEditar: { backgroundColor: '#fde3d5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  botonEditarTexto: { color: '#e07a5f', fontSize: 13, fontWeight: 'bold' },
  corazon: { padding: 8 },
  corazonTexto: { fontSize: 28, color: '#e07a5f' },
  fila: { flexDirection: 'row', gap: 8, marginBottom: 12, paddingHorizontal: 16 },
  etiqueta: {
    backgroundColor: '#fde3d5', color: '#e07a5f',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, fontSize: 13,
  },
  descripcion: { fontSize: 15, color: '#444', marginBottom: 20, lineHeight: 22, paddingHorizontal: 16 },
  seccion: { fontSize: 18, fontWeight: 'bold', color: '#e07a5f', marginBottom: 10, paddingHorizontal: 16 },
  item: { fontSize: 15, color: '#333', marginBottom: 6, paddingHorizontal: 16 },
  paso: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start', paddingHorizontal: 16 },
  pasoNumero: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e07a5f', color: '#fff',
    textAlign: 'center', lineHeight: 28,
    fontWeight: 'bold', marginRight: 10, fontSize: 14,
  },
  pasoTexto: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22 },
  vacio: { color: '#999', fontStyle: 'italic', marginBottom: 12 },
});
