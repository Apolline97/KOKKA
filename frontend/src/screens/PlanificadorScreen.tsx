import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { getPlanes, getRecetas, crearPlan, getFavoritos } from '../services/api';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const TIPOS = ['Almuerzo', 'Cena'];

const getLunes = (fecha: Date) => {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d;
};

const formatFecha = (fecha: Date) => fecha.toISOString().split('T')[0];

const añadirDias = (fecha: Date, dias: number) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
};

export default function PlanificadorScreen({ navigation }: any) {
  const [semanaBase, setSemanaBase] = useState(getLunes(new Date()));
  const [planes, setPlanes] = useState<any[]>([]);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Almuerzo');
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [idsFavoritos, setIdsFavoritos] = useState<number[]>([]);

  const cargarSemana = async () => {
    setCargando(true);
    const todos: any[] = [];
    for (let i = 0; i < 7; i++) {
      const fecha = formatFecha(añadirDias(semanaBase, i));
      const data = await getPlanes(fecha);
      if (Array.isArray(data)) todos.push(...data);
    }
    setPlanes(todos);
    setCargando(false);
  };

  useEffect(() => { cargarSemana(); }, [semanaBase]);

  const abrirModal = async (fecha: string, tipo: string) => {
    setDiaSeleccionado(fecha);
    setTipoSeleccionado(tipo);
    const [dataRecetas, dataFavs] = await Promise.all([getRecetas(), getFavoritos()]);
    if (Array.isArray(dataRecetas)) setRecetas(dataRecetas);
    if (Array.isArray(dataFavs)) setIdsFavoritos(dataFavs.map((f: any) => f.receta.id));
    setModalVisible(true);
  };

  const recetasModal = soloFavoritas
    ? recetas.filter((r: any) => idsFavoritos.includes(r.id))
    : recetas;

  const asignarReceta = async (recetaId: number) => {
    setModalVisible(false);
    await crearPlan(recetaId, diaSeleccionado, tipoSeleccionado);
    cargarSemana();
  };

  const getPlan = (fecha: string, tipo: string) =>
    planes.find(p => p.fecha === fecha && p.tipo_comida === tipo);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
        <Text style={styles.volverTexto}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Planificador</Text>

      <View style={styles.navegacion}>
        <TouchableOpacity onPress={() => setSemanaBase(añadirDias(semanaBase, -7))}>
          <Text style={styles.navBoton}>‹ Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.semanaTexto}>
          {formatFecha(semanaBase)} — {formatFecha(añadirDias(semanaBase, 6))}
        </Text>
        <TouchableOpacity onPress={() => setSemanaBase(añadirDias(semanaBase, 7))}>
          <Text style={styles.navBoton}>Siguiente ›</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#e07a5f" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={DIAS_SEMANA}
          keyExtractor={item => item}
          renderItem={({ item, index }) => {
            const fecha = formatFecha(añadirDias(semanaBase, index));
            return (
              <View style={styles.dia}>
                <Text style={styles.diaNombre}>{item} {fecha.slice(8)}</Text>
                {TIPOS.map(tipo => {
                  const plan = getPlan(fecha, tipo);
                  return (
                    <TouchableOpacity
                      key={tipo}
                      style={styles.slot}
                      onPress={() => abrirModal(fecha, tipo)}
                    >
                      <Text style={styles.slotTipo}>{tipo}</Text>
                      <Text style={styles.slotReceta}>
                        {plan ? plan.receta.titulo : '+ Añadir receta'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>Elige una receta</Text>
            <View style={styles.modalFiltro}>
              <TouchableOpacity
                style={[styles.modalFiltroBtn, !soloFavoritas && styles.modalFiltroBtnActivo]}
                onPress={() => setSoloFavoritas(false)}
              >
                <Text style={[styles.modalFiltroBtnTexto, !soloFavoritas && styles.modalFiltroBtnTextoActivo]}>Todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalFiltroBtn, soloFavoritas && styles.modalFiltroBtnActivo]}
                onPress={() => setSoloFavoritas(true)}
              >
                <Text style={[styles.modalFiltroBtnTexto, soloFavoritas && styles.modalFiltroBtnTextoActivo]}>♥ Favoritas</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recetasModal}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }: any) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => asignarReceta(item.id)}>
                  <Text style={styles.modalItemTexto}>{item.titulo}</Text>
                  <Text style={styles.modalItemInfo}>{item.categoria} · {item.tiempo_prep} min</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', padding: 16 }}>No hay favoritas aún</Text>}
            />
            <TouchableOpacity style={styles.modalCerrar} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCerrarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#fffaf7' },
  volver: { marginBottom: 12 },
  volverTexto: { color: '#e07a5f', fontSize: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#c1553a', marginBottom: 12 },
  navegacion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBoton: { color: '#e07a5f', fontWeight: 'bold', fontSize: 15 },
  semanaTexto: { fontSize: 12, color: '#555' },
  dia: { marginBottom: 12, borderRadius: 8, backgroundColor: '#fef0eb', padding: 10 },
  diaNombre: { fontWeight: 'bold', color: '#c1553a', marginBottom: 6, fontSize: 15 },
  slot: { backgroundColor: '#fffaf7', borderRadius: 6, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#fde3d5' },
  slotTipo: { fontSize: 11, color: '#888', marginBottom: 2 },
  slotReceta: { fontSize: 14, color: '#e07a5f', fontWeight: 'bold' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCaja: { backgroundColor: '#fffaf7', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '70%' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#c1553a', marginBottom: 8 },
  modalFiltro: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  modalFiltroBtn: { flex: 1, padding: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e07a5f', alignItems: 'center' },
  modalFiltroBtnActivo: { backgroundColor: '#e07a5f' },
  modalFiltroBtnTexto: { color: '#e07a5f', fontWeight: 'bold' },
  modalFiltroBtnTextoActivo: { color: '#fff' },
  modalItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemTexto: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  modalItemInfo: { fontSize: 12, color: '#888', marginTop: 2 },
  modalCerrar: { marginTop: 12, padding: 12, alignItems: 'center' },
  modalCerrarTexto: { color: '#e63946', fontWeight: 'bold', fontSize: 15 },
});
