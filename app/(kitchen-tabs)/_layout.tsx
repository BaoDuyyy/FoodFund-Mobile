// app/(kitchen-tabs)/_layout.tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import React from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export default function KitchenTabsLayout() {
  const ICONS: Record<string, MaterialIconName> = {
    'k-home': 'home',
    'k-campaign': 'favorite',
    'k-news': 'article',
    staff: 'group',
    'k-profile': 'person',
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
      <Tabs.Screen name="k-home" options={{ title: 'Home' }} />
      <Tabs.Screen name="k-campaign" options={{ title: 'Campaign' }} />
      <Tabs.Screen name="k-news" options={{ title: 'News' }} />
      <Tabs.Screen name="k-staff" options={{ title: 'Staff' }} />
      <Tabs.Screen name="k-profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
