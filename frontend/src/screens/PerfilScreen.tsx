import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, FlatList, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { getMiPerfil, updatePerfil, getMisRecetas } from '../services/api';

export default function PerfilScreen({ navigation }: any) {
  const [perfil, setPerfil] = useState<any>(null);
  const [preferencias, setPreferencias] = useState('');
  const [alergias, setAlergias] = useState('');
  const [misRecetas, setMisRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const [dataPerfil, dataRecetas] = await Promise.all([getMiPerfil(), getMisRecetas()]);
      setPerfil(dataPerfil);
      setPreferencias(dataPerfil.preferencias || '');
      setAlergias(dataPerfil.alergias || '');
      if (Array.isArray(dataRecetas)) setMisRecetas(dataRecetas);
      setCargando(false);
    };
    cargar();
  }, []);

  const guardar = async () => {
    setGuardando(true);
    const data = await updatePerfil({ preferencias, alergias });
    setGuardando(false);
    if (data.id) {
      Alert.alert('Guardado', 'Perfil actualizado correctamente');
    } else {
      Alert.alert('Error', 'No se pudo guardar');
    }
  };

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('token');
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#e07a5f" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Mi Perfil</Text>
      <Text style={styles.usuario}>{perfil?.user?.username}</Text>
      <Text style={styles.email}>{perfil?.user?.email}</Text>

      <Text style={styles.label}>Preferencias alimenticias</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Vegano, sin gluten..."
        value={preferencias}
        onChangeText={setPreferencias}
        multiline
      />

      <Text style={styles.label}>Alergias</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Frutos secos, lactosa..."
        value={alergias}
        onChangeText={setAlergias}
        multiline
      />

      <TouchableOpacity style={styles.boton} onPress={guardar} disabled={guardando}>
        {guardando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botonTexto}>Guardar cambios</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.seccion}>Mis recetas ({misRecetas.length})</Text>
      {misRecetas.length === 0 ? (
        <Text style={styles.vacio}>No has creado ninguna receta aún</Text>
      ) : (
        misRecetas.map((receta: any) => (
          <TouchableOpacity
            key={receta.id}
            style={styles.tarjeta}
            onPress={() => navigation.navigate('DetalleReceta', { receta })}
          >
            {receta.imagen_url ? (
              <Image source={{ uri: receta.imagen_url }} style={styles.tarjetaImagen} />
            ) : null}
            <View style={styles.tarjetaTexto}>
              <Text style={styles.tarjetaTitulo}>{receta.titulo}</Text>
              <Text style={styles.tarjetaInfo}>
                {receta.categoria} · {receta.tiempo_prep} min · {receta.calorias} kcal
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.botonCerrar} onPress={cerrarSesion}>
        <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 48, backgroundColor: '#fffaf7' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  volver: { marginBottom: 12 },
  volverTexto: { color: '#e07a5f', fontSize: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#c1553a', marginBottom: 4 },
  usuario: { fontSize: 18, color: '#e07a5f', fontWeight: 'bold', marginBottom: 2 },
  email: { fontSize: 14, color: '#888', marginBottom: 24 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, marginBottom: 16, fontSize: 15, minHeight: 60,
  },
  boton: {
    backgroundColor: '#e07a5f', padding: 14,
    borderRadius: 8, alignItems: 'center', marginBottom: 20,
  },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  seccion: { fontSize: 18, fontWeight: 'bold', color: '#c1553a', marginBottom: 12 },
  vacio: { color: '#999', fontStyle: 'italic', marginBottom: 16 },
  tarjeta: { borderRadius: 8, backgroundColor: '#fef0eb', marginBottom: 10, overflow: 'hidden' },
  tarjetaImagen: { width: '100%', height: 120 },
  tarjetaTexto: { padding: 10 },
  tarjetaTitulo: { fontSize: 15, fontWeight: 'bold', color: '#c1553a' },
  tarjetaInfo: { fontSize: 12, color: '#555', marginTop: 2 },
  botonCerrar: {
    padding: 14, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#e63946', marginTop: 8,
  },
  botonCerrarTexto: { color: '#e63946', fontWeight: 'bold', fontSize: 16 },
});
