import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilePage() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Profile</Text>
				<Text style={styles.subtitle}>User profile and settings go here.</Text>

				{/* optional quick action to demonstrate navigation */}
				<TouchableOpacity style={styles.action} onPress={() => router.push('/welcome')}>
					<Text style={styles.actionText}>Go to Welcome</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff' },
	content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
	title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
	subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
	action: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#333', borderRadius: 8 },
	actionText: { color: '#fff', fontWeight: '600' },
});
