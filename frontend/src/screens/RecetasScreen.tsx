import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Image, Modal, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRecetas, getFavoritos, addFavorito, removeFavorito } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 2 - 12) / 2;

const CATEGORIAS = ['', 'Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Postre'];

const SORT_OPTIONS = [
  { label: 'Alfabético (A-Z)', value: 'az' },
  { label: 'Calorías ↑ (menor primero)', value: 'cal_asc' },
  { label: 'Calorías ↓ (mayor primero)', value: 'cal_desc' },
  { label: 'Tiempo ↑ (más rápido)', value: 'tiempo_asc' },
  { label: 'Tiempo ↓ (más lento)', value: 'tiempo_desc' },
];

function sortLista(lista: any[], orden: string) {
  const s = [...lista];
  switch (orden) {
    case 'az': return s.sort((a, b) => a.titulo.localeCompare(b.titulo));
    case 'cal_asc': return s.sort((a, b) => a.calorias - b.calorias);
    case 'cal_desc': return s.sort((a, b) => b.calorias - a.calorias);
    case 'tiempo_asc': return s.sort((a, b) => a.tiempo_prep - b.tiempo_prep);
    case 'tiempo_desc': return s.sort((a, b) => b.tiempo_prep - a.tiempo_prep);
    default: return s;
  }
}

export default function RecetasScreen({ navigation }: any) {
  const [recetas, setRecetas] = useState<any[]>([]);
  const [favoritosIds, setFavoritosIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [orden, setOrden] = useState('az');
  const [cargando, setCargando] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const [dataRec, dataFav] = await Promise.all([
      getRecetas({ categoria }),
      getFavoritos(),
    ]);
    if (Array.isArray(dataRec)) setRecetas(dataRec);
    if (Array.isArray(dataFav)) {
      setFavoritosIds(new Set(dataFav.map((f: any) => f.receta.id)));
    }
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, [categoria]));
  useEffect(() => { cargar(); }, [categoria]);

  const toggleFavorito = async (receta: any) => {
    if (favoritosIds.has(receta.id)) {
      await removeFavorito(receta.id);
      setFavoritosIds(prev => { const s = new Set(prev); s.delete(receta.id); return s; });
    } else {
      await addFavorito(receta.id);
      setFavoritosIds(prev => new Set([...prev, receta.id]));
    }
  };

  const recetasMostrar = sortLista(
    search ? recetas.filter(r => r.titulo.toLowerCase().includes(search.toLowerCase())) : recetas,
    orden
  );

  const renderReceta = ({ item }: any) => (
    <TouchableOpacity
      style={styles.tarjeta}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('DetalleReceta', { receta: item })}
    >
      <View style={styles.imagenWrapper}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.imagen} />
        ) : (
          <View style={[styles.imagen, styles.sinImagen]} />
        )}
        <TouchableOpacity style={styles.corazon} onPress={() => toggleFavorito(item)}>
          <Text style={[styles.corazonTexto, favoritosIds.has(item.id) && styles.corazonActivo]}>
            {favoritosIds.has(item.id) ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.tarjetaTitulo} numberOfLines={2}>{item.titulo}</Text>
      <View style={styles.tagsRow}>
        <View style={styles.tiempoTag}>
          <Text style={styles.tiempoTagTexto}>{'<'}{item.tiempo_prep}min</Text>
        </View>
        <Text style={styles.calTexto}>{item.calorias} kcal</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setSortVisible(true)}>
          <Text style={styles.hamburger}>☰</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.buscador}
          placeholder="Buscar receta..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        <Image source={require('../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
      </View>

      {/* Category filters */}
      <View style={styles.filtrosWrapper}>
        <FlatList
          data={CATEGORIAS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={styles.filtros}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.filtro, categoria === cat && styles.filtroActivo]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={[styles.filtroTexto, categoria === cat && styles.filtroTextoActivo]}>
                {cat === '' ? 'Todas' : cat}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#e07a5f" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={recetasMostrar}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderReceta}
          numColumns={2}
          columnWrapperStyle={styles.columnas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={styles.vacio}>No hay recetas</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sort modal */}
      <Modal visible={sortVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSortVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Ordenar recetas</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortBtn, orden === opt.value && styles.sortBtnActivo]}
                onPress={() => { setOrden(opt.value); setSortVisible(false); }}
              >
                <Text style={[styles.sortBtnTexto, orden === opt.value && styles.sortBtnTextoActivo]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf7' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#fff', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerBtn: { padding: 4 },
  hamburger: { fontSize: 24, color: '#555' },
  buscador: {
    flex: 1, borderWidth: 1, borderColor: '#e8ddd9',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 14, backgroundColor: '#faf5f2', color: '#333',
  },
  logoImg: { width: 36, height: 36 },
  filtrosWrapper: { backgroundColor: '#fff', paddingBottom: 10 },
  filtros: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  filtro: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#e07a5f',
  },
  filtroActivo: { backgroundColor: '#e07a5f' },
  filtroTexto: { color: '#e07a5f', fontSize: 13 },
  filtroTextoActivo: { color: '#fff' },
  columnas: { gap: 12, marginBottom: 12 },
  tarjeta: {
    width: CARD_WIDTH, backgroundColor: '#fff',
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  imagenWrapper: { position: 'relative' },
  imagen: { width: '100%', height: 120 },
  sinImagen: { backgroundColor: '#fde8df' },
  corazon: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16, width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  corazonTexto: { fontSize: 16, color: '#ccc' },
  corazonActivo: { color: '#e63946' },
  tarjetaTitulo: { fontSize: 13, fontWeight: 'bold', color: '#333', paddingHorizontal: 10, paddingTop: 8, marginBottom: 6 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, gap: 6 },
  tiempoTag: { backgroundColor: '#4caf50', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tiempoTagTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  calTexto: { fontSize: 10, color: '#888' },
  vacio: { textAlign: 'center', color: '#bbb', marginTop: 40, fontStyle: 'italic' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  sortBtn: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 10, marginBottom: 8, backgroundColor: '#faf5f2',
  },
  sortBtnActivo: { backgroundColor: '#e07a5f' },
  sortBtnTexto: { fontSize: 15, color: '#555' },
  sortBtnTextoActivo: { color: '#fff', fontWeight: 'bold' },
});
