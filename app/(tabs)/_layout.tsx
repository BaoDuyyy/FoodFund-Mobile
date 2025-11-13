import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import React from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export default function TabsLayout() {
	const ICONS: Record<string, MaterialIconName> = {
		index: 'home',
		donation: 'favorite',
		news: 'article',
		discover: 'explore',
		profile: 'person',
	};

	return (
		<Tabs
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarIcon: ({ color, size }) => {
					const name: MaterialIconName = ICONS[route.name] ?? 'circle';
					return <MaterialIcons name={name} color={color} size={size} />;
				},
				tabBarActiveTintColor: '#007AFF',
				tabBarInactiveTintColor: '#8e8e93',
			})}
		>
			{/* Home is index so it shows first */}
			<Tabs.Screen name="index" options={{ title: 'Home' }} />
			<Tabs.Screen name="donation" options={{ title: 'Donation' }} />
			<Tabs.Screen name="news" options={{ title: 'News' }} />
			<Tabs.Screen name="discover" options={{ title: 'Discover' }} />
			<Tabs.Screen name="profile" options={{ title: 'Profile' }} />
		</Tabs>
	);
}
