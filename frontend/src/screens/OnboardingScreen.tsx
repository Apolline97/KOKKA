import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { guardarOnboarding } from '../services/api';

const { width } = Dimensions.get('window');

const PREGUNTAS = [
  {
    emoji: '⏱️',
    titulo: '¿Cuánto tiempo sueles tener para cocinar?',
    campo: 'tiempo_cocina',
    opciones: [
      { label: 'Rápido', descripcion: 'Menos de 20 minutos', valor: 'rapido', emoji: '⚡' },
      { label: 'Moderado', descripcion: '20 a 45 minutos', valor: 'medio', emoji: '🍳' },
      { label: 'Sin prisa', descripcion: 'Más de 45 minutos', valor: 'largo', emoji: '👨‍🍳' },
    ],
  },
  {
    emoji: '🍽️',
    titulo: '¿Qué tipo de plato preparas más a menudo?',
    campo: 'categoria_favorita',
    opciones: [
      { label: 'Desayuno', descripcion: 'Empezar el día con energía', valor: 'Desayuno', emoji: '🌅' },
      { label: 'Almuerzo', descripcion: 'El plato fuerte del día', valor: 'Almuerzo', emoji: '☀️' },
      { label: 'Cena', descripcion: 'Terminar bien el día', valor: 'Cena', emoji: '🌙' },
      { label: 'Merienda', descripcion: 'Un snack entre horas', valor: 'Merienda', emoji: '🍎' },
      { label: 'Postre', descripcion: 'El final dulce', valor: 'Postre', emoji: '🍰' },
    ],
  },
  {
    emoji: '🥗',
    titulo: '¿Cuál es tu objetivo con la alimentación?',
    campo: 'objetivo_calorias',
    opciones: [
      { label: 'Comer ligero', descripcion: 'Recetas bajas en calorías', valor: 'ligero', emoji: '🥗' },
      { label: 'Equilibrado', descripcion: 'Una dieta variada y sana', valor: 'equilibrado', emoji: '⚖️' },
      { label: 'Sin restricciones', descripcion: 'Disfrutar sin límites', valor: 'normal', emoji: '🍕' },
    ],
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({
    tiempo_cocina: '',
    categoria_favorita: '',
    objetivo_calorias: '',
  });
  const [guardando, setGuardando] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const preguntaActual = PREGUNTAS[paso];
  const seleccion = respuestas[preguntaActual.campo];
  const esUltimo = paso === PREGUNTAS.length - 1;

  const irAlMain = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
  };

  const animarCambio = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const seleccionar = (valor: string) => {
    setRespuestas(prev => ({ ...prev, [preguntaActual.campo]: valor }));
  };

  const siguiente = async () => {
    if (!seleccion) return;

    if (!esUltimo) {
      animarCambio(() => setPaso(p => p + 1));
      return;
    }

    setGuardando(true);
    try {
      await guardarOnboarding({
        tiempo_cocina: respuestas.tiempo_cocina,
        categoria_favorita: respuestas.categoria_favorita,
        objetivo_calorias: respuestas.objetivo_calorias,
      });
    } catch (_) {}
    setGuardando(false);
    irAlMain();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={irAlMain}>
          <Text style={styles.saltarTexto}>Saltar</Text>
        </TouchableOpacity>
        <View style={styles.pasos}>
          {PREGUNTAS.map((_, i) => (
            <View
              key={i}
              style={[styles.pasoDot, i === paso && styles.pasoDotActivo, i < paso && styles.pasoDotHecho]}
            />
          ))}
        </View>
      </View>

      {/* Contenido animado */}
      <Animated.View style={[styles.contenido, { opacity: fadeAnim }]}>
        <Text style={styles.preguntaEmoji}>{preguntaActual.emoji}</Text>
        <Text style={styles.preguntaTitulo}>{preguntaActual.titulo}</Text>

        <View style={styles.opciones}>
          {preguntaActual.opciones.map(opcion => (
            <TouchableOpacity
              key={opcion.valor}
              style={[styles.opcionBtn, seleccion === opcion.valor && styles.opcionBtnActivo]}
              onPress={() => seleccionar(opcion.valor)}
              activeOpacity={0.8}
            >
              <Text style={styles.opcionEmoji}>{opcion.emoji}</Text>
              <View style={styles.opcionTextos}>
                <Text style={[styles.opcionLabel, seleccion === opcion.valor && styles.opcionLabelActivo]}>
                  {opcion.label}
                </Text>
                <Text style={[styles.opcionDescripcion, seleccion === opcion.valor && styles.opcionDescripcionActiva]}>
                  {opcion.descripcion}
                </Text>
              </View>
              {seleccion === opcion.valor && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkTexto}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Botón siguiente */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.siguienteBtn, !seleccion && styles.siguienteBtnDesactivado]}
          onPress={siguiente}
          disabled={!seleccion || guardando}
          activeOpacity={0.85}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.siguienteBtnTexto}>
              {esUltimo ? '¡Listo! Ver mis recetas' : 'Siguiente →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf7' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16,
  },
  saltarTexto: { color: '#aaa', fontSize: 15 },
  pasos: { flexDirection: 'row', gap: 6 },
  pasoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e8ddd9' },
  pasoDotActivo: { width: 24, backgroundColor: '#e07a5f' },
  pasoDotHecho: { backgroundColor: '#c1553a' },

  contenido: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  preguntaEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  preguntaTitulo: {
    fontSize: 22, fontWeight: 'bold', color: '#1a1a1a',
    textAlign: 'center', lineHeight: 30, marginBottom: 28,
  },

  opciones: { gap: 12 },
  opcionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: '#f0e8e3',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  opcionBtnActivo: { borderColor: '#e07a5f', backgroundColor: '#fff8f6' },
  opcionEmoji: { fontSize: 28, marginRight: 14 },
  opcionTextos: { flex: 1 },
  opcionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  opcionLabelActivo: { color: '#c1553a' },
  opcionDescripcion: { fontSize: 13, color: '#aaa' },
  opcionDescripcionActiva: { color: '#e07a5f' },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#e07a5f', justifyContent: 'center', alignItems: 'center',
  },
  checkTexto: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  footer: { padding: 24, paddingBottom: 40 },
  siguienteBtn: {
    backgroundColor: '#e07a5f', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  siguienteBtnDesactivado: { backgroundColor: '#f0c8bc' },
  siguienteBtnTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
