export const MARK_ALL_AS_READ_MUTATION = `
mutation MarkAllAsRead {
  markAllNotificationsAsRead {
    success
    count
    message
  }
}
`;

export const DELETE_NOTIFICATION_MUTATION = `
mutation DeleteNotification($notificationId: String!) {
  deleteNotification(notificationId: $notificationId) {
    success
    message
  }
}
`;
