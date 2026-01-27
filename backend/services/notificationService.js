const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a user
 * @param {String} userId - User ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} metadata - Additional metadata
 */
async function createNotification(userId, type, title, message, metadata = {}) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      metadata
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notification for a user by Stripe customer ID
 * @param {String} stripeCustomerId - Stripe customer ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} metadata - Additional metadata
 */
async function createNotificationByCustomerId(stripeCustomerId, type, title, message, metadata = {}) {
  try {
    const user = await User.findOne({ stripeCustomerId });
    if (!user) {
      console.error('User not found for customer ID:', stripeCustomerId);
      return null;
    }
    return await createNotification(user._id, type, title, message, metadata);
  } catch (error) {
    console.error('Error creating notification by customer ID:', error);
    throw error;
  }
}

/**
 * Get notifications for a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options (limit, unreadOnly, etc.)
 */
async function getUserNotifications(userId, options = {}) {
  try {
    const { limit = 50, unreadOnly = false } = options;
    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }
    return await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {String} notificationId - Notification ID
 * @param {String} userId - User ID (for security)
 */
async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.read = true;
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {String} userId - User ID
 */
async function markAllAsRead(userId) {
  try {
    await Notification.updateMany({ userId, read: false }, { read: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @param {String} userId - User ID
 */
async function getUnreadCount(userId) {
  try {
    return await Notification.countDocuments({ userId, read: false });
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
}

module.exports = {
  createNotification,
  createNotificationByCustomerId,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
