import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, TextInput, Alert, Dimensions, Animated, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getReceta, getFavoritos, addFavorito, removeFavorito, getValoraciones, crearValoracion, deleteReceta } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DetalleRecetaScreen({ route, navigation }: any) {
  const { receta: recetaBase } = route.params;
  const [receta, setReceta] = useState<any>(recetaBase);
  const [cargando, setCargando] = useState(true);
  const [esFavorito, setEsFavorito] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [valoraciones, setValoraciones] = useState<any[]>([]);
  const [miPuntuacion, setMiPuntuacion] = useState(0);
  const [miComentario, setMiComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [vistaActual, setVistaActual] = useState<'detalle' | 'valoraciones'>('detalle');

  const slideAnim = useRef(new Animated.Value(0)).current;

  const cambiarVista = (vista: 'detalle' | 'valoraciones') => {
    const toValue = vista === 'detalle' ? 0 : -SCREEN_WIDTH;
    Animated.timing(slideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setVistaActual(vista);
  };

  const cargar = useCallback(async () => {
    try {
      const [recetaCompleta, dataFavs, storedId, storedUsername, vals] = await Promise.all([
        getReceta(recetaBase.id),
        getFavoritos(),
        AsyncStorage.getItem('user_id'),
        AsyncStorage.getItem('username'),
        getValoraciones(recetaBase.id),
      ]);
      if (recetaCompleta?.id) setReceta(recetaCompleta);
      if (Array.isArray(dataFavs)) {
        setEsFavorito(dataFavs.some((f: any) => f.receta.id === recetaBase.id));
      }
      if (storedId) setUserId(parseInt(storedId));
      if (Array.isArray(vals)) {
        setValoraciones(vals);
        if (storedUsername) {
          const mia = vals.find((v: any) => v.username === storedUsername);
          if (mia) {
            setMiPuntuacion(mia.puntuacion);
            setMiComentario(mia.comentario);
          }
        }
      }
    } catch (_) {
    } finally {
      setCargando(false);
    }
  }, [recetaBase.id]);

  useEffect(() => { cargar(); }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  const recargarValoraciones = async () => {
    try {
      const username = await AsyncStorage.getItem('username');
      const vals = await getValoraciones(recetaBase.id);
      if (Array.isArray(vals)) {
        setValoraciones(vals);
        const mia = vals.find((v: any) => v.username === username);
        if (mia) {
          setMiPuntuacion(mia.puntuacion);
          setMiComentario(mia.comentario);
        }
        const mediaActual = vals.length
          ? Math.round((vals.reduce((s: number, v: any) => s + v.puntuacion, 0) / vals.length) * 10) / 10
          : null;
        setReceta((prev: any) => ({ ...prev, media_valoracion: mediaActual }));
      }
    } catch (_) {}
  };

  const enviarValoracion = async () => {
    if (miPuntuacion === 0) {
      Alert.alert('Error', 'Selecciona una puntuación del 1 al 5');
      return;
    }
    setEnviando(true);
    try {
      await crearValoracion(recetaBase.id, miPuntuacion, miComentario);
      await recargarValoraciones();
      Alert.alert('¡Gracias!', 'Tu valoración se ha guardado.');
    } catch (_) {
      Alert.alert('Error', 'No se pudo guardar la valoración.');
    } finally {
      setEnviando(false);
    }
  };

  const eliminarReceta = () => {
    Alert.alert(
      'Eliminar receta',
      '¿Seguro que quieres eliminar esta receta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            await deleteReceta(receta.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleFavorito = async () => {
    if (esFavorito) {
      const ok = await removeFavorito(receta.id);
      if (ok) setEsFavorito(false);
    } else {
      const data = await addFavorito(receta.id);
      if (data?.id || data?.receta) setEsFavorito(true);
    }
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e07a5f" />
      </View>
    );
  }

  const estrellas = (n: number, size = 16) =>
    [1, 2, 3, 4, 5].map(i => (
      <Text key={i} style={[styles.estrella, { fontSize: size }]}>
        {i <= n ? '★' : '☆'}
      </Text>
    ));

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          width: SCREEN_WIDTH * 2,
          flex: 1,
          transform: [{ translateX: slideAnim }],
        }}
      >
        {/* ── PANEL 1: Detalle ── */}
        <View style={{ width: SCREEN_WIDTH }}>
          <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e07a5f']} tintColor="#e07a5f" />}
          >
            <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
              <Text style={styles.volverTexto}>← Volver</Text>
            </TouchableOpacity>

            {receta.imagen_url ? (
              <Image source={{ uri: receta.imagen_url }} style={styles.imagen} />
            ) : null}

            <View style={styles.cabecera}>
              <Text style={styles.titulo}>{receta.titulo}</Text>
              <View style={styles.cabeceraAcciones}>
                {receta.media_valoracion ? (
                  <Text style={styles.mediaTexto}>★ {receta.media_valoracion}</Text>
                ) : null}
                {receta.creador?.id === userId && (
                  <>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EditarReceta', { receta })}
                      style={styles.botonEditar}
                    >
                      <Text style={styles.botonEditarTexto}>✏️ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={eliminarReceta} style={styles.botonEliminar}>
                      <Text style={styles.botonEliminarTexto}>🗑️</Text>
                    </TouchableOpacity>
                  </>
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
              receta.ingredientes.map((ri: any) => {
                const cant = parseFloat(ri.cantidad);
                const cantStr = cant % 1 === 0 ? String(Math.round(cant)) : String(Math.round(cant * 100) / 100);
                const unidad = ri.unidad_medida || ri.ingrediente.unidad_medida;
                const nombre = ri.ingrediente.nombre;
                const sinUnidad = !unidad || unidad === 'al gusto' || unidad === 'para servir' || unidad === 'opcional';
                const linea = sinUnidad
                  ? `• ${cantStr} de ${nombre}${unidad && unidad !== 'al gusto' ? ` (${unidad})` : ''}`
                  : `• ${cantStr} ${unidad} de ${nombre}`;
                return <Text key={ri.id} style={styles.item}>{linea}</Text>;
              })
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

            <TouchableOpacity
              style={styles.valoracionesBtn}
              onPress={() => cambiarVista('valoraciones')}
            >
              <Text style={styles.valoracionesBtnTexto}>
                ★ Valoraciones ({valoraciones.length}) →
              </Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>

        {/* ── PANEL 2: Valoraciones ── */}
        <View style={{ width: SCREEN_WIDTH }}>
          <ScrollView style={styles.container}>
            <View style={styles.valoracionesHeader}>
              <TouchableOpacity onPress={() => cambiarVista('detalle')}>
                <Text style={styles.volverTexto}>← Receta</Text>
              </TouchableOpacity>
              <Text style={styles.valoracionesTitulo}>
                Valoraciones {receta.media_valoracion ? `· ★ ${receta.media_valoracion}` : ''}
              </Text>
            </View>

            {/* Formulario de valoración */}
            <View style={styles.formCard}>
              <Text style={styles.formTitulo}>Tu valoración</Text>
              <View style={styles.estrellasRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setMiPuntuacion(i)}>
                    <Text style={[styles.estrellaInput, { color: i <= miPuntuacion ? '#f4b942' : '#ccc' }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.comentarioInput}
                placeholder="Escribe un comentario (opcional)..."
                placeholderTextColor="#aaa"
                value={miComentario}
                onChangeText={setMiComentario}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.enviarBtn, enviando && { opacity: 0.6 }]}
                onPress={enviarValoracion}
                disabled={enviando}
              >
                <Text style={styles.enviarBtnTexto}>
                  {enviando ? 'Guardando...' : 'Guardar valoración'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de valoraciones */}
            {valoraciones.length === 0 ? (
              <Text style={[styles.vacio, { marginTop: 20 }]}>Sé el primero en valorar esta receta</Text>
            ) : (
              valoraciones.map((v: any) => (
                <View key={v.id} style={styles.valoracionCard}>
                  <View style={styles.valoracionCabecera}>
                    <Text style={styles.valoracionUsuario}>{v.username}</Text>
                    <View style={styles.estrellasRow}>
                      {estrellas(v.puntuacion, 14)}
                    </View>
                  </View>
                  {v.comentario ? (
                    <Text style={styles.valoracionComentario}>{v.comentario}</Text>
                  ) : null}
                  <Text style={styles.valoracionFecha}>
                    {new Date(v.fecha).toLocaleDateString('es-ES')}
                  </Text>
                </View>
              ))
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffaf7' },
  imagen: { width: '100%', height: 220 },
  volver: { marginBottom: 12, paddingHorizontal: 16, paddingTop: 48 },
  volverTexto: { color: '#e07a5f', fontSize: 16 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 10 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#c1553a', flex: 1, marginRight: 8 },
  cabeceraAcciones: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  mediaTexto: { fontSize: 14, color: '#f4b942', fontWeight: 'bold' },
  botonEditar: { backgroundColor: '#fde3d5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  botonEditarTexto: { color: '#e07a5f', fontSize: 13, fontWeight: 'bold' },
  botonEliminar: { backgroundColor: '#fde3d5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  botonEliminarTexto: { fontSize: 15 },
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
  vacio: { color: '#999', fontStyle: 'italic', marginBottom: 12, paddingHorizontal: 16 },
  valoracionesBtn: {
    marginHorizontal: 16, marginTop: 24, marginBottom: 8,
    backgroundColor: '#fde3d5', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  valoracionesBtnTexto: { color: '#e07a5f', fontWeight: 'bold', fontSize: 15 },
  // Panel valoraciones
  valoracionesHeader: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12 },
  valoracionesTitulo: { fontSize: 20, fontWeight: 'bold', color: '#c1553a', marginTop: 8 },
  formCard: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 24,
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  formTitulo: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  estrellasRow: { flexDirection: 'row', marginBottom: 12 },
  estrella: { color: '#f4b942' },
  estrellaInput: { fontSize: 36, marginRight: 4 },
  comentarioInput: {
    borderWidth: 1, borderColor: '#e8ddd9', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#333',
    textAlignVertical: 'top', marginBottom: 12, minHeight: 70,
  },
  enviarBtn: {
    backgroundColor: '#e07a5f', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  enviarBtnTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  valoracionCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  valoracionCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  valoracionUsuario: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  valoracionComentario: { color: '#555', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  valoracionFecha: { color: '#aaa', fontSize: 12 },
});
