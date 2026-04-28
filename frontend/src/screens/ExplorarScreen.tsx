import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Modal, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRecomendadas, getFavoritos, addFavorito, removeFavorito } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 2 - 12) / 2;

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIA_LETRAS = ['L','M','X','J','V','S','D'];

const SORT_OPTIONS = [
  { label: 'Mejor valoradas', value: 'rating_desc' },
  { label: 'Alfabético (A-Z)', value: 'az' },
  { label: 'Calorías ↑ (menor primero)', value: 'cal_asc' },
  { label: 'Calorías ↓ (mayor primero)', value: 'cal_desc' },
  { label: 'Tiempo ↑ (más rápido)', value: 'tiempo_asc' },
  { label: 'Tiempo ↓ (más lento)', value: 'tiempo_desc' },
];

function getWeekDays() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dayNum: d.getDate(),
      dayLetter: DIA_LETRAS[i],
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

function sortLista(lista: any[], orden: string) {
  const s = [...lista];
  switch (orden) {
    case 'rating_desc': return s.sort((a, b) => (b.media_valoracion ?? 0) - (a.media_valoracion ?? 0));
    case 'az': return s.sort((a, b) => a.titulo.localeCompare(b.titulo));
    case 'cal_asc': return s.sort((a, b) => a.calorias - b.calorias);
    case 'cal_desc': return s.sort((a, b) => b.calorias - a.calorias);
    case 'tiempo_asc': return s.sort((a, b) => a.tiempo_prep - b.tiempo_prep);
    case 'tiempo_desc': return s.sort((a, b) => b.tiempo_prep - a.tiempo_prep);
    default: return s;
  }
}

export default function ExplorarScreen({ navigation }: any) {
  const [recomendadas, setRecomendadas] = useState<any[]>([]);
  const [favoritosData, setFavoritosData] = useState<any[]>([]);
  const [favoritosIds, setFavoritosIds] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState('');
  const [orden, setOrden] = useState('az');
  const [sortVisible, setSortVisible] = useState(false);

  const weekDays = getWeekDays();
  const today = new Date();

  const cargar = async () => {
    setCargando(true);
    const [dataRec, dataFav] = await Promise.all([getRecomendadas(), getFavoritos()]);
    if (Array.isArray(dataRec)) setRecomendadas(dataRec);
    if (Array.isArray(dataFav)) {
      setFavoritosData(dataFav.map((f: any) => f.receta));
      setFavoritosIds(new Set(dataFav.map((f: any) => f.receta.id)));
    }
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const toggleFavorito = async (receta: any) => {
    if (favoritosIds.has(receta.id)) {
      await removeFavorito(receta.id);
      setFavoritosIds(prev => { const s = new Set(prev); s.delete(receta.id); return s; });
      setFavoritosData(prev => prev.filter(r => r.id !== receta.id));
    } else {
      await addFavorito(receta.id);
      setFavoritosIds(prev => new Set([...prev, receta.id]));
      setFavoritosData(prev => [...prev, receta]);
    }
  };

  const filtrar = (lista: any[]) => {
    const base = search
      ? lista.filter(r => r.titulo.toLowerCase().includes(search.toLowerCase()))
      : lista;
    return sortLista(base, orden);
  };

  const RecetaCard = ({ receta }: { receta: any }) => (
    <TouchableOpacity
      style={styles.tarjeta}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('DetalleReceta', { receta })}
    >
      <View style={styles.imagenWrapper}>
        {receta.imagen_url ? (
          <Image source={{ uri: receta.imagen_url }} style={styles.imagen} />
        ) : (
          <View style={[styles.imagen, styles.sinImagen]} />
        )}
        <TouchableOpacity style={styles.corazon} onPress={() => toggleFavorito(receta)}>
          <Text style={[styles.corazonTexto, favoritosIds.has(receta.id) && styles.corazonActivo]}>
            {favoritosIds.has(receta.id) ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.tarjetaTitulo} numberOfLines={2}>{receta.titulo}</Text>
        <Text style={styles.ratingBadge}>★ {receta.media_valoracion ?? '–'}</Text>
      </View>
      <View style={styles.tagsRow}>
        <View style={styles.tiempoTag}>
          <Text style={styles.tiempoTagTexto}>{'<'}{receta.tiempo_prep}min</Text>
        </View>
        <Text style={styles.calTexto}>{receta.calorias} kcal</Text>
      </View>
    </TouchableOpacity>
  );

  const renderGrid = (lista: any[]) => {
    const items = filtrar(lista);
    if (items.length === 0) return <Text style={styles.vacio}>Sin resultados</Text>;
    const rows = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(
        <View key={i} style={styles.fila}>
          <RecetaCard receta={items[i]} />
          {items[i + 1]
            ? <RecetaCard receta={items[i + 1]} />
            : <View style={{ width: CARD_WIDTH }} />}
        </View>
      );
    }
    return rows;
  };

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

      {/* Week strip */}
      <View style={styles.semana}>
        <Text style={styles.mesTexto}>{MESES[today.getMonth()]}</Text>
        <View style={styles.diasRow}>
          {weekDays.map((dia, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.diaBtn, dia.isToday && styles.diaBtnHoy]}
              onPress={() => navigation.navigate('Calendario')}
            >
              <Text style={[styles.diaLetra, dia.isToday && styles.diaLetraHoy]}>{dia.dayLetter}</Text>
              <Text style={[styles.diaNum, dia.isToday && styles.diaNumHoy]}>{dia.dayNum}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {cargando ? (
          <ActivityIndicator size="large" color="#e07a5f" style={{ marginTop: 48 }} />
        ) : (
          <>
            <Text style={styles.seccion}>Recomendaciones para ti</Text>
            {renderGrid(recomendadas)}
            <Text style={styles.seccion}>Mis favoritos</Text>
            {favoritosData.length === 0
              ? <Text style={styles.vacio}>Aún no tienes favoritos ♡</Text>
              : renderGrid(favoritosData)}
          </>
        )}
      </ScrollView>

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
  semana: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0e8e3',
  },
  mesTexto: { fontSize: 14, fontWeight: 'bold', color: '#e07a5f', width: 32 },
  diasRow: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  diaBtn: { alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 20 },
  diaBtnHoy: { backgroundColor: '#c1553a' },
  diaLetra: { fontSize: 10, color: '#999', marginBottom: 2 },
  diaLetraHoy: { color: '#fff' },
  diaNum: { fontSize: 13, fontWeight: 'bold', color: '#444' },
  diaNumHoy: { color: '#fff' },
  seccion: { fontSize: 17, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  fila: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 8, marginBottom: 4 },
  tarjetaTitulo: { fontSize: 13, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 4 },
  ratingBadge: { fontSize: 11, color: '#f4b942', fontWeight: 'bold', marginTop: 1 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, gap: 6 },
  tiempoTag: { backgroundColor: '#4caf50', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tiempoTagTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  calTexto: { fontSize: 10, color: '#888' },
  vacio: { textAlign: 'center', color: '#bbb', marginTop: 12, marginBottom: 8, fontStyle: 'italic' },
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
