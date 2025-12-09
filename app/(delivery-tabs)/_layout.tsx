import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import React from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export default function DeliveryTabsLayout() {
  const ICONS: Record<string, MaterialIconName> = {
    'd-home': 'home',
    'd-campaign': 'favorite',
    'd-news': 'article',
    'd-staff': 'group',
    'd-organization': 'group',
    'd-profile': 'person',
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const name: MaterialIconName = ICONS[route.name] ?? 'circle';
          return <MaterialIcons name={name} color={color} size={size} />;
        },
        tabBarActiveTintColor: '#ad4e28',
        tabBarInactiveTintColor: '#8e8e93',
      })}
    >
      <Tabs.Screen name="d-home" options={{ title: 'Home' }} />
      <Tabs.Screen name="d-campaign" options={{ title: 'Campaign' }} />
      {/* <Tabs.Screen name="d-news" options={{ title: 'News' }} /> */}
      <Tabs.Screen name="d-organization" options={{ title: 'Organization' }} />
      <Tabs.Screen name="d-profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
