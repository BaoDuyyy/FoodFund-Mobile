import Loading from '@/components/Loading';
import LoginRequire from '@/components/LoginRequire';
import UserService from '@/services/userService';
import type { UserProfile } from '@/types/api/user';
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#ad4e28';
const BG = '#fbefe6';

export default function ProfilePage() {
	const router = useRouter();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(false);
	const [loginRequire, setLoginRequire] = useState(false);
	const [activeTab, setActiveTab] = useState(0);

	useEffect(() => {
		let mounted = true;
		async function load() {
			setLoading(true);
			try {
				const data = await UserService.getMyProfile();
				if (mounted) setProfile(data);
			} catch (err: any) {
				// handle error if needed
			} finally {
				if (mounted) setLoading(false);
			}
		}
		load();
		return () => { mounted = false; };
	}, []);

	function checkLoginAndSetTab(idx: number) {
		const token = typeof window !== "undefined"
			? window.localStorage?.getItem("token")
			: null;
		if (!token) {
			setLoginRequire(true);
			return;
		}
		setActiveTab(idx);
	}

	return (
		<SafeAreaView style={styles.container}>
			<Loading visible={loading} message="Đang tải thông tin..." />
			<LoginRequire visible={loginRequire} onClose={() => setLoginRequire(false)} />
			{/* Cover image */}
			<View style={styles.coverWrap}>
				<Image
					source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }}
					style={styles.coverImg}
				/>
				{/* Avatar */}
				<View style={styles.avatarWrap}>
					<View style={styles.avatarCircle}>
						<Image
							source={{ uri: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=duy' }}
							style={styles.avatarImg}
						/>
						<View style={styles.avatarCamera}>
							<Feather name="camera" size={18} color="#ad4e28" />
						</View>
					</View>
				</View>
			</View>

			{/* Info */}
			<View style={styles.infoWrap}>
				<Text style={styles.email}>{profile?.email || ''}</Text>
				<Text style={styles.username}>{profile?.user_name || ''}</Text>
				<View style={styles.statsRow}>
					<FontAwesome name="rss" size={18} color="#ad4e28" />
					<Text style={styles.statsNum}>0</Text>
					<MaterialIcons name="article" size={18} color="#ad4e28" style={{ marginLeft: 16 }} />
					<Text style={styles.statsNum}>0</Text>
				</View>
				<View style={styles.actionRow}>
					<TouchableOpacity style={styles.editBtn}>
						<Feather name="edit" size={18} color="#ad4e28" />
						<Text style={styles.editBtnText}>Chỉnh sửa thông tin</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.shareBtn}>
						<Feather name="share-2" size={22} color="#43b46b" />
					</TouchableOpacity>
				</View>
				<View style={styles.socialRow}>
					<FontAwesome name="phone" size={20} color="#ad4e28" style={styles.socialIcon} />
					<MaterialIcons name="email" size={20} color="#ad4e28" style={styles.socialIcon} />
					<Feather name="globe" size={20} color="#ad4e28" style={styles.socialIcon} />
					<FontAwesome name="facebook" size={20} color="#ad4e28" style={styles.socialIcon} />
					<FontAwesome name="youtube-play" size={20} color="#ad4e28" style={styles.socialIcon} />
				</View>
			</View>

			{/* Tabs */}
			<View style={styles.tabRow}>
				<TouchableOpacity onPress={() => checkLoginAndSetTab(0)}>
					<Text style={[styles.tab, activeTab === 0 && styles.tabActive]}>Hoạt động</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => checkLoginAndSetTab(1)}>
					<Text style={[styles.tab, activeTab === 1 && styles.tabActive]}>Sự kiện quan tâm</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => checkLoginAndSetTab(2)}>
					<Text style={[styles.tab, activeTab === 2 && styles.tabActive]}>Danh sách theo dõi</Text>
				</TouchableOpacity>
			</View>

			{/* Nổi bật */}
			<View style={styles.highlightWrap}>
				<Text style={styles.highlightTitle}>Nổi bật</Text>
				<View style={styles.highlightBox}>
					<Text style={styles.highlightLabel}>Đã ủng hộ và đồng hành</Text>
					<Text style={styles.highlightValue}>0 đ</Text>
				</View>
				<View style={styles.highlightStatsRow}>
					<View style={styles.highlightStatBox}>
						<MaterialIcons name="celebration" size={24} color={PRIMARY} />
						<Text style={styles.highlightStatNum}>0</Text>
						<Text style={styles.highlightStatLabel}>Chiến dịch</Text>
					</View>
					<View style={styles.highlightStatBox}>
						<Feather name="heart" size={24} color={PRIMARY} />
						<Text style={styles.highlightStatNum}>0</Text>
						<Text style={styles.highlightStatLabel}>Lượt ủng hộ</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: BG },
	coverWrap: {
		width: '100%',
		height: 140,
		position: 'relative',
		backgroundColor: PRIMARY,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		overflow: 'hidden',
	},
	coverImg: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
		opacity: 0.95,
	},
	avatarWrap: {
		position: 'absolute',
		left: 24,
		bottom: -32,
		zIndex: 10,
	},
	avatarCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 6,
		elevation: 4,
	},
	avatarImg: {
		width: 72,
		height: 72,
		borderRadius: 36,
		resizeMode: 'cover',
	},
	avatarCamera: {
		position: 'absolute',
		right: 2,
		bottom: 2,
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 2,
		borderWidth: 1,
		borderColor: '#eee',
	},
	infoWrap: {
		marginTop: 48,
		alignItems: 'center',
		marginBottom: 12,
	},
	email: {
		fontSize: 20,
		fontWeight: '700',
		color: '#222',
		marginBottom: 2,
	},
	username: {
		fontSize: 15,
		color: '#888',
		marginBottom: 8,
	},
	statsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	statsNum: {
		fontSize: 15,
		color: PRIMARY,
		fontWeight: '700',
		marginLeft: 4,
	},
	actionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
		marginTop: 4,
	},
	editBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: PRIMARY,
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderRadius: 12,
		marginRight: 8,
	},
	editBtnText: {
		color: '#fff',
		fontWeight: '700',
		marginLeft: 8,
		fontSize: 15,
	},
	shareBtn: {
		backgroundColor: '#e6f7ee',
		padding: 10,
		borderRadius: 12,
	},
	socialRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 8,
		marginBottom: 4,
	},
	socialIcon: {
		marginHorizontal: 6,
	},
	tabRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
		marginBottom: 8,
		marginTop: 8,
	},
	tab: {
		fontSize: 15,
		color: '#888',
		paddingVertical: 8,
		fontWeight: '700',
	},
	tabActive: {
		color: PRIMARY,
		borderBottomWidth: 2,
		borderBottomColor: PRIMARY,
	},
	highlightWrap: {
		paddingHorizontal: 18,
		marginTop: 8,
	},
	highlightTitle: {
		fontSize: 17,
		fontWeight: '700',
		color: '#222',
		marginBottom: 8,
	},
	highlightBox: {
		backgroundColor: PRIMARY,
		borderRadius: 16,
		padding: 18,
		marginBottom: 12,
		alignItems: 'flex-start',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	highlightLabel: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 6,
	},
	highlightValue: {
		color: '#fff',
		fontSize: 28,
		fontWeight: '800',
	},
	highlightStatsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 2,
	},
	highlightStatBox: {
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 16,
		alignItems: 'center',
		flex: 1,
		marginHorizontal: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 2,
		elevation: 1,
	},
	highlightStatNum: {
		color: PRIMARY,
		fontWeight: '800',
		fontSize: 18,
		marginTop: 4,
	},
	highlightStatLabel: {
		color: '#888',
		fontSize: 13,
		marginTop: 2,
		fontWeight: '600',
	},
});
