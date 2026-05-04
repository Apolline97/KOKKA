import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Rellena todos los campos');
      return;
    }
    setCargando(true);
    try {
      const data = await login(username, password);
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user_id', String(data.user_id));
        await AsyncStorage.setItem('username', data.username);
        navigation.replace('Main');
      } else {
        Alert.alert('Error', data.error || 'Credenciales incorrectas');
      }
    } catch (_) {
      Alert.alert('Error', 'No se pudo conectar al servidor. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>KOKKA</Text>
      <Text style={styles.subtitulo}>Inicia sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={cargando}>
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botonTexto}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.enlace}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fffaf7',
  },
  titulo: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#e07a5f',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 18,
    textAlign: 'center',
    color: '#555',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  boton: {
    backgroundColor: '#e07a5f',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  enlace: {
    textAlign: 'center',
    color: '#e07a5f',
    fontSize: 14,
  },
});
