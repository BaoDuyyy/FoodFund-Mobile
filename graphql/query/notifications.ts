export const MY_NOTIFICATIONS_QUERY = `
query MyNotifications($limit: Int, $cursor: String, $isRead: Boolean) {
  myNotifications(limit: $limit, cursor: $cursor, isRead: $isRead) {
    notifications {
      id
      type
      data
      isRead
      created_at
    }
    hasMore
    nextCursor
  }
}
`;

export const UNREAD_COUNT_QUERY = `
query UnreadCount {
  unreadNotificationCount
}
`;
