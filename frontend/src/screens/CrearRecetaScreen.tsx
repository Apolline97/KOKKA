import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { crearReceta } from '../services/api';

const CATEGORIAS = ['Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Postre'];

export default function CrearRecetaScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tiempoPrep, setTiempoPrep] = useState('');
  const [calorias, setCalorias] = useState('');
  const [categoria, setCategoria] = useState('Almuerzo');
  const [pasos, setPasos] = useState(['']);
  const [imagen, setImagen] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const añadirPaso = () => setPasos([...pasos, '']);

  const editarPaso = (texto: string, index: number) => {
    const nuevos = [...pasos];
    nuevos[index] = texto;
    setPasos(nuevos);
  };

  const eliminarPaso = (index: number) => {
    setPasos(pasos.filter((_, i) => i !== index));
  };

  const seleccionarImagen = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, maxWidth: 1200, maxHeight: 1200 },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) {
          setImagen({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'foto.jpg',
          });
        }
      }
    );
  };

  const guardar = async () => {
    if (!titulo || !descripcion || !tiempoPrep || !calorias) {
      Alert.alert('Error', 'Rellena todos los campos obligatorios');
      return;
    }

    const pasosValidos = pasos
      .map((p, i) => ({ numero: i + 1, descripcion: p.trim() }))
      .filter(p => p.descripcion.length > 0);

    setGuardando(true);
    const data = await crearReceta(
      {
        titulo,
        descripcion,
        tiempo_prep: parseInt(tiempoPrep),
        calorias: parseInt(calorias),
        categoria,
        pasos_nuevos: pasosValidos,
      },
      imagen || undefined
    );
    setGuardando(false);

    if (data.id) {
      Alert.alert('¡Listo!', 'Receta creada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo crear la receta');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
        <Text style={styles.volverTexto}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Nueva receta</Text>

      <Text style={styles.label}>Foto de la receta</Text>
      <TouchableOpacity style={styles.imagenSelector} onPress={seleccionarImagen}>
        {imagen ? (
          <Image source={{ uri: imagen.uri }} style={styles.imagenPreview} />
        ) : (
          <View style={styles.imagenPlaceholder}>
            <Text style={styles.imagenPlaceholderIcono}>📷</Text>
            <Text style={styles.imagenPlaceholderTexto}>Toca para añadir foto</Text>
          </View>
        )}
      </TouchableOpacity>
      {imagen && (
        <TouchableOpacity onPress={() => setImagen(null)} style={styles.quitarFoto}>
          <Text style={styles.quitarFotoTexto}>✕ Quitar foto</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de la receta"
        placeholderTextColor="#aaa"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.inputMultilinea]}
        placeholder="Describe brevemente la receta"
        placeholderTextColor="#aaa"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      <View style={styles.fila}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Tiempo (min) *</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            placeholderTextColor="#aaa"
            value={tiempoPrep}
            onChangeText={setTiempoPrep}
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Calorías *</Text>
          <TextInput
            style={styles.input}
            placeholder="400"
            placeholderTextColor="#aaa"
            value={calorias}
            onChangeText={setCalorias}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.categorias}>
        {CATEGORIAS.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoriaBtn, categoria === cat && styles.categoriaBtnActivo]}
            onPress={() => setCategoria(cat)}
          >
            <Text style={[styles.categoriaBtnTexto, categoria === cat && styles.categoriaBtnTextoActivo]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Pasos de elaboración</Text>
      {pasos.map((paso, index) => (
        <View key={index} style={styles.pasoFila}>
          <Text style={styles.pasoNumero}>{index + 1}</Text>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder={`Paso ${index + 1}...`}
            placeholderTextColor="#aaa"
            value={paso}
            onChangeText={texto => editarPaso(texto, index)}
            multiline
          />
          {pasos.length > 1 && (
            <TouchableOpacity style={styles.eliminarPaso} onPress={() => eliminarPaso(index)}>
              <Text style={styles.eliminarPasoTexto}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.botonAñadir} onPress={añadirPaso}>
        <Text style={styles.botonAñadirTexto}>+ Añadir paso</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonGuardar} onPress={guardar} disabled={guardando}>
        {guardando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botonGuardarTexto}>Guardar receta</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#fffaf7' },
  volver: { marginBottom: 12 },
  volverTexto: { color: '#e07a5f', fontSize: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#c1553a', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, marginBottom: 14, fontSize: 15,
    backgroundColor: '#fff', color: '#333',
  },
  inputMultilinea: { minHeight: 80, textAlignVertical: 'top' },
  fila: { flexDirection: 'row' },
  imagenSelector: {
    borderRadius: 12, overflow: 'hidden', marginBottom: 8,
    borderWidth: 1, borderColor: '#e0c9bf', borderStyle: 'dashed',
  },
  imagenPreview: { width: '100%', height: 200 },
  imagenPlaceholder: {
    height: 140, backgroundColor: '#fef0eb',
    justifyContent: 'center', alignItems: 'center',
  },
  imagenPlaceholderIcono: { fontSize: 36, marginBottom: 8 },
  imagenPlaceholderTexto: { color: '#e07a5f', fontSize: 14 },
  quitarFoto: { alignSelf: 'flex-end', marginBottom: 14 },
  quitarFotoTexto: { color: '#e63946', fontSize: 13 },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoriaBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#e07a5f',
  },
  categoriaBtnActivo: { backgroundColor: '#e07a5f' },
  categoriaBtnTexto: { color: '#e07a5f', fontSize: 13 },
  categoriaBtnTextoActivo: { color: '#fff' },
  pasoFila: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  pasoNumero: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e07a5f', color: '#fff',
    textAlign: 'center', lineHeight: 28,
    fontWeight: 'bold', fontSize: 13, marginTop: 10,
  },
  eliminarPaso: { padding: 10, marginTop: 6 },
  eliminarPasoTexto: { color: '#e63946', fontWeight: 'bold', fontSize: 16 },
  botonAñadir: {
    borderWidth: 1, borderColor: '#e07a5f', borderRadius: 8,
    padding: 12, alignItems: 'center', marginBottom: 16,
  },
  botonAñadirTexto: { color: '#e07a5f', fontWeight: 'bold' },
  botonGuardar: {
    backgroundColor: '#e07a5f', padding: 14,
    borderRadius: 8, alignItems: 'center',
  },
  botonGuardarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
