import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import ExplorarScreen from './src/screens/ExplorarScreen';
import RecetasScreen from './src/screens/RecetasScreen';
import DetalleRecetaScreen from './src/screens/DetalleRecetaScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import PlanificadorScreen from './src/screens/PlanificadorScreen';
import CrearRecetaScreen from './src/screens/CrearRecetaScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === '#e07a5f' ? 1 : 0.4 }}>{emoji}</Text>;
}

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0e8e3',
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#e07a5f',
        tabBarInactiveTintColor: '#bbb',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Explorar"
        component={ExplorarScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tab.Screen
        name="Calendario"
        component={PlanificadorScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} />,
        }}
      />
      <Tab.Screen
        name="Crear"
        component={CrearRecetaScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: '#e07a5f',
              justifyContent: 'center', alignItems: 'center',
              marginBottom: 16,
              shadowColor: '#e07a5f', shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 4 }, elevation: 6,
            }}>
              <Text style={{ color: '#fff', fontSize: 28, lineHeight: 30, marginTop: -2 }}>+</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Recetas"
        component={RecetasScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon emoji="🍽" color={color} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen name="DetalleReceta" component={DetalleRecetaScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [hayToken, setHayToken] = useState(false);

  useEffect(() => {
    const comprobarToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setHayToken(!!token);
      setCargando(false);
    };
    comprobarToken();
  }, []);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffaf7' }}>
        <ActivityIndicator size="large" color="#e07a5f" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hayToken ? 'Main' : 'Login'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
          <Stack.Screen name="Main" component={MainStack} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
