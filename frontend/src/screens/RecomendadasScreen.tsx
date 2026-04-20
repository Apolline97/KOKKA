import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getRecomendadas } from '../services/api';

export default function RecomendadasScreen({ navigation }: any) {
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const data = await getRecomendadas();
      if (Array.isArray(data)) setRecetas(data);
      setCargando(false);
    };
    cargar();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
        <Text style={styles.volverTexto}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Recomendadas</Text>
      <Text style={styles.subtitulo}>Menos de 30 min y 600 kcal</Text>

      {cargando ? (
        <ActivityIndicator size="large" color="#e07a5f" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() => navigation.navigate('DetalleReceta', { receta: item })}
            >
              <Text style={styles.tarjetaTitulo}>{item.titulo}</Text>
              <Text style={styles.tarjetaInfo}>
                {item.categoria} · {item.tiempo_prep} min · {item.calorias} kcal
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.vacio}>No hay recetas recomendadas aún</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#fffaf7' },
  volver: { marginBottom: 12 },
  volverTexto: { color: '#e07a5f', fontSize: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#c1553a', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: '#888', marginBottom: 16 },
  tarjeta: {
    padding: 14, borderRadius: 8,
    backgroundColor: '#fef0eb', marginBottom: 10,
  },
  tarjetaTitulo: { fontSize: 16, fontWeight: 'bold', color: '#c1553a' },
  tarjetaInfo: { fontSize: 13, color: '#555', marginTop: 4 },
  vacio: { textAlign: 'center', color: '#999', marginTop: 32 },
});
