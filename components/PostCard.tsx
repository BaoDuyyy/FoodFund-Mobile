import { PRIMARY } from "@/constants/colors";
import type { Post } from "@/types/api/post";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const POST_CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface PostCardProps {
    post: Post;
    onPress?: () => void;
    onLike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
}

/**
 * Single post card component - used in horizontal scroll
 */
export function PostCard({
    post,
    onPress,
    onLike,
    onComment,
    onShare,
}: PostCardProps) {
    const timeAgo = getTimeAgo(post.created_at);

    return (
        <TouchableOpacity
            style={styles.postCard}
            activeOpacity={0.9}
            onPress={onPress}
        >
            {/* Header: Creator info */}
            <View style={styles.postHeader}>
                <View style={styles.creatorAvatar}>
                    <Text style={styles.creatorAvatarText}>
                        {post.creator?.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                </View>
                <View style={styles.creatorInfo}>
                    <Text style={styles.creatorName}>{post.creator?.full_name || "Ẩn danh"}</Text>
                    <Text style={styles.postTime}>{timeAgo}</Text>
                </View>
            </View>

            {/* Post content */}
            {post.title && (
                <Text style={styles.postTitle} numberOfLines={2}>
                    {post.title}
                </Text>
            )}

            {post.content && (
                <Text style={styles.postContent} numberOfLines={3}>
                    {post.content}
                </Text>
            )}

            {/* Post image */}
            {post.media && post.media.length > 0 && (
                <Image
                    source={{ uri: post.media[0] }}
                    style={styles.postImage}
                    resizeMode="cover"
                />
            )}

            {/* Footer: Like, Comment, Share */}
            <View style={styles.postFooter}>
                <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
                    <Ionicons
                        name={post.isLikedByMe ? "heart" : "heart-outline"}
                        size={20}
                        color={post.isLikedByMe ? "#e74c3c" : "#666"}
                    />
                    <Text style={styles.actionText}>{post.likeCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
                    <Ionicons name="chatbubble-outline" size={18} color="#666" />
                    <Text style={styles.actionText}>{post.commentCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
                    <Ionicons name="share-social-outline" size={18} color="#666" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

interface PostsSectionProps {
    posts: Post[];
    onPostPress?: (post: Post) => void;
    onLike?: (post: Post) => void;
    onComment?: (post: Post) => void;
    onShare?: (post: Post) => void;
    onViewAll?: () => void;
}

/**
 * Horizontal scrollable posts section
 */
export function PostsSection({
    posts,
    onPostPress,
    onLike,
    onComment,
    onShare,
    onViewAll,
}: PostsSectionProps) {
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bài viết mới</Text>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll}>
                        <Text style={styles.sectionAction}>Xem tất cả &gt;</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={() => onPostPress?.(item)}
                        onLike={() => onLike?.(item)}
                        onComment={() => onComment?.(item)}
                        onShare={() => onShare?.(item)}
                    />
                )}
            />
        </View>
    );
}

/**
 * Divider component matching home page style
 */
export function SectionDivider() {
    return <View style={styles.divider} />;
}

// Helper function
function getTimeAgo(dateString: string): string {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return `${diffMonths} tháng trước`;
}

const styles = StyleSheet.create({
    // Section styles
    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
    },
    sectionAction: {
        color: PRIMARY,
        fontWeight: "700",
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },

    // Divider
    divider: {
        height: 5,
        backgroundColor: "#e5e5e5",
        marginHorizontal: 0,
        marginVertical: 12,
    },

    // Post card styles
    postCard: {
        width: POST_CARD_WIDTH,
        backgroundColor: "#fff",
        borderRadius: 16,
        marginRight: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#f0f0f0",
    },

    // Header
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    creatorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: PRIMARY,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    creatorAvatarText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    creatorInfo: {
        flex: 1,
    },
    creatorName: {
        fontWeight: "700",
        fontSize: 14,
        color: "#222",
    },
    postTime: {
        fontSize: 12,
        color: "#888",
        marginTop: 2,
    },

    // Content
    postTitle: {
        fontWeight: "700",
        fontSize: 15,
        color: "#222",
        marginBottom: 6,
        lineHeight: 20,
    },
    postContent: {
        fontSize: 14,
        color: "#555",
        lineHeight: 20,
        marginBottom: 10,
    },

    // Image
    postImage: {
        width: "100%",
        height: 180,
        borderRadius: 12,
        backgroundColor: "#f0f0f0",
        marginBottom: 10,
    },

    // Footer
    postFooter: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 20,
        paddingVertical: 4,
    },
    actionText: {
        marginLeft: 5,
        fontSize: 13,
        color: "#666",
        fontWeight: "600",
    },
});

export default PostCard;
