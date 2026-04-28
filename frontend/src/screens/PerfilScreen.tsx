import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getMiPerfil, getMisRecetas, getMisValoraciones, updatePerfil } from '../services/api';

export default function PerfilScreen({ navigation }: any) {
  const [perfil, setPerfil] = useState<any>(null);
  const [misRecetas, setMisRecetas] = useState<any[]>([]);
  const [misValoraciones, setMisValoraciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [preferencias, setPreferencias] = useState('');
  const [alergias, setAlergias] = useState('');
  const [fotoLocal, setFotoLocal] = useState<{ uri: string; type: string; name: string } | null>(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const [dataPerfil, dataRecetas, dataVals] = await Promise.all([
        getMiPerfil(), getMisRecetas(), getMisValoraciones(),
      ]);
      setPerfil(dataPerfil);
      setUsername(dataPerfil.user?.username || '');
      setEmail(dataPerfil.user?.email || '');
      setPreferencias(dataPerfil.preferencias || '');
      setAlergias(dataPerfil.alergias || '');
      if (Array.isArray(dataRecetas)) setMisRecetas(dataRecetas);
      if (Array.isArray(dataVals)) setMisValoraciones(dataVals);
    } catch (_) {}
    finally { setCargando(false); }
  };

  const seleccionarFoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setFotoLocal({ uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'foto.jpg' });
      }
    });
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const data = await updatePerfil({ username, email, preferencias, alergias }, fotoLocal || undefined);
      if (data.id) {
        await AsyncStorage.setItem('username', username);
        setPerfil(data);
        setFotoLocal(null);
        setEditando(false);
        Alert.alert('¡Guardado!', 'Perfil actualizado correctamente');
      } else {
        Alert.alert('Error', data.error || 'No se pudo guardar');
      }
    } catch (_) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
    setGuardando(false);
  };

  const cerrarSesion = async () => {
    await AsyncStorage.multiRemove(['token', 'user_id', 'username']);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  if (cargando) {
    return <View style={styles.centrado}><ActivityIndicator size="large" color="#e07a5f" /></View>;
  }

  const fotoUri = fotoLocal?.uri || perfil?.foto_url;
  const inicialNombre = (perfil?.user?.username || 'U')[0].toUpperCase();
  const estrellas = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.headerBg}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={seleccionarFoto} activeOpacity={0.85}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetra}>{inicialNombre}</Text>
            </View>
          )}
          <View style={styles.camaraOverlay}>
            <Text style={styles.camaraIcono}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerNombre}>{perfil?.user?.username}</Text>
        <Text style={styles.headerEmail}>{perfil?.user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{misRecetas.length}</Text>
            <Text style={styles.statLabel}>Recetas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{misValoraciones.length}</Text>
            <Text style={styles.statLabel}>Valoraciones</Text>
          </View>
        </View>
      </View>

      {/* ── Editar perfil ── */}
      <TouchableOpacity style={styles.editarBtn} onPress={() => setEditando(!editando)} activeOpacity={0.8}>
        <Text style={styles.editarBtnTexto}>✏️ Editar perfil</Text>
        <Text style={styles.chevron}>{editando ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {editando && (
        <View style={styles.editarBody}>
          <Text style={styles.fieldLabel}>Nombre de usuario</Text>
          <TextInput
            style={styles.input} value={username} onChangeText={setUsername}
            autoCapitalize="none" placeholderTextColor="#bbb"
          />
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#bbb"
          />
          <Text style={styles.fieldLabel}>Preferencias alimenticias</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]} value={preferencias}
            onChangeText={setPreferencias} placeholder="Ej: Vegano, sin gluten..."
            placeholderTextColor="#bbb" multiline
          />
          <Text style={styles.fieldLabel}>Alergias</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]} value={alergias}
            onChangeText={setAlergias} placeholder="Ej: Frutos secos, lactosa..."
            placeholderTextColor="#bbb" multiline
          />
          <TouchableOpacity
            style={[styles.guardarBtn, guardando && { opacity: 0.6 }]}
            onPress={guardar} disabled={guardando}
          >
            {guardando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.guardarBtnTexto}>Guardar cambios</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Mis valoraciones ── */}
      <Text style={styles.seccion}>Mis valoraciones ({misValoraciones.length})</Text>
      {misValoraciones.length === 0 ? (
        <Text style={styles.vacio}>Aún no has valorado ninguna receta</Text>
      ) : (
        misValoraciones.map((v: any) => (
          <TouchableOpacity
            key={v.id}
            style={styles.valoracionCard}
            onPress={() => navigation.navigate('DetalleReceta', {
              receta: { id: v.receta_id, titulo: v.receta_titulo, imagen_url: v.receta_imagen },
            })}
          >
            {v.receta_imagen
              ? <Image source={{ uri: v.receta_imagen }} style={styles.valoracionImagen} />
              : <View style={[styles.valoracionImagen, styles.sinImagen]} />}
            <View style={styles.valoracionInfo}>
              <Text style={styles.valoracionTitulo} numberOfLines={1}>{v.receta_titulo}</Text>
              <Text style={styles.valoracionEstrellas}>{estrellas(v.puntuacion)}</Text>
              {v.comentario ? (
                <Text style={styles.valoracionComentario} numberOfLines={2}>{v.comentario}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* ── Mis recetas ── */}
      <Text style={styles.seccion}>Mis recetas ({misRecetas.length})</Text>
      {misRecetas.length === 0 ? (
        <Text style={styles.vacio}>No has creado ninguna receta aún</Text>
      ) : (
        misRecetas.map((receta: any) => (
          <TouchableOpacity
            key={receta.id}
            style={styles.recetaCard}
            onPress={() => navigation.navigate('DetalleReceta', { receta })}
          >
            {receta.imagen_url
              ? <Image source={{ uri: receta.imagen_url }} style={styles.recetaImagen} />
              : <View style={[styles.recetaImagen, styles.sinImagen]} />}
            <View style={styles.recetaInfo}>
              <Text style={styles.recetaTitulo} numberOfLines={2}>{receta.titulo}</Text>
              <Text style={styles.recetaMeta}>{receta.categoria} · {receta.tiempo_prep} min · {receta.calorias} kcal</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.cerrarBtn} onPress={cerrarSesion}>
        <Text style={styles.cerrarBtnTexto}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf7' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffaf7' },

  // Header
  headerBg: {
    backgroundColor: '#c1553a', paddingTop: 60, paddingBottom: 28, alignItems: 'center',
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#e07a5f',
    borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  avatarLetra: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  camaraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 14, width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
  camaraIcono: { fontSize: 14 },
  headerNombre: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  headerEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 36 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Edit section
  editarBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  editarBtnTexto: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  chevron: { fontSize: 12, color: '#888' },
  editarBody: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#e8ddd9', borderRadius: 8,
    padding: 10, fontSize: 14, color: '#333', backgroundColor: '#faf5f2',
  },
  inputMulti: { minHeight: 60, textAlignVertical: 'top' },
  guardarBtn: {
    backgroundColor: '#e07a5f', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 16,
  },
  guardarBtnTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Sections
  seccion: { fontSize: 16, fontWeight: 'bold', color: '#c1553a', marginHorizontal: 16, marginTop: 22, marginBottom: 10 },
  vacio: { color: '#bbb', fontStyle: 'italic', marginHorizontal: 16, marginBottom: 8 },
  sinImagen: { backgroundColor: '#fde8df' },

  // Valoraciones
  valoracionCard: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  valoracionImagen: { width: 72, height: 72 },
  valoracionInfo: { flex: 1, padding: 10 },
  valoracionTitulo: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 3 },
  valoracionEstrellas: { fontSize: 13, color: '#f4b942', marginBottom: 3 },
  valoracionComentario: { fontSize: 12, color: '#777', fontStyle: 'italic' },

  // Recetas
  recetaCard: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  recetaImagen: { width: 80, height: 80 },
  recetaInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  recetaTitulo: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  recetaMeta: { fontSize: 12, color: '#888' },

  // Cerrar sesión
  cerrarBtn: {
    margin: 16, marginTop: 20, padding: 14,
    borderRadius: 10, borderWidth: 1, borderColor: '#e63946', alignItems: 'center',
  },
  cerrarBtnTexto: { color: '#e63946', fontWeight: 'bold', fontSize: 15 },
});
