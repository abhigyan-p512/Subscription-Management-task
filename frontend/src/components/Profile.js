import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const AVATAR_STORAGE_PREFIX = 'sm:avatar:';

// Price plans (keep in sync with Subscribe/Dashboard)
const PRICE_PLANS = [
  { id: process.env.REACT_APP_STRIPE_PRICE_MONTHLY || 'price_monthly', name: 'Monthly Plan' },
  { id: process.env.REACT_APP_STRIPE_PRICE_QUARTERLY || 'price_quarterly', name: 'Quarterly Plan' },
  { id: process.env.REACT_APP_STRIPE_PRICE_YEARLY || 'price_yearly', name: 'Yearly Plan' },
];

function Profile({ user, onUpdate }) {
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [avatarDataUrl, setAvatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem(`${AVATAR_STORAGE_PREFIX}${user.id}`) || '';
    } catch {
      return '';
    }
  });

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);

  useEffect(() => {
    setUsername(user.username || '');
    setEmail(user.email || '');
  }, [user.username, user.email]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const [subRes, pmRes] = await Promise.all([
          axios.get(`${API_URL}/subscriptions/${user.stripeCustomerId}`).catch(() => null),
          axios.get(`${API_URL}/payment-methods/${user.stripeCustomerId}`).catch(() => null),
        ]);

        if (subRes?.data?.subscription) {
          const sub = subRes.data.subscription;
          const stripeStatus = sub?.stripeData?.status || sub?.status;
          const stripePriceId = sub?.stripeData?.items?.data?.[0]?.price?.id || sub?.priceId;
          setSubscriptionSummary({
            status: stripeStatus,
            priceId: stripePriceId,
            cancelAtPeriodEnd:
              typeof sub?.stripeData?.cancel_at_period_end === 'boolean'
                ? sub.stripeData.cancel_at_period_end
                : sub?.cancelAtPeriodEnd,
            currentPeriodEnd: sub?.currentPeriodEnd,
          });
        } else {
          setSubscriptionSummary(null);
        }

        if (pmRes?.data?.paymentMethods) {
          const methods = pmRes.data.paymentMethods;
          const defaultPm = methods.find((m) => m.isDefault) || null;
          setPaymentSummary({
            count: methods.length,
            defaultLast4: defaultPm?.card?.last4 || null,
            defaultBrand: defaultPm?.card?.brand || null,
          });
        } else {
          setPaymentSummary(null);
        }
      } finally {
        setSummaryLoading(false);
      }
    };

    if (user?.stripeCustomerId) fetchSummary();
  }, [user?.stripeCustomerId]);

  const displayName = useMemo(() => user.username || user.email || 'User', [user.username, user.email]);

  const initials = useMemo(() => {
    const source = user.username || user.email || '';
    const cleaned = source.split('@')[0] || source;
    const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
    const a = (parts[0] || '').slice(0, 1);
    const b = (parts[1] || '').slice(0, 1);
    return (a + b).toUpperCase() || 'U';
  }, [user.username, user.email]);

  const avatarHue = useMemo(() => {
    const str = user.id || user.email || 'user';
    let h = 0;
    for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  }, [user.id, user.email]);

  const getPlanNameByPriceId = (priceId) =>
    PRICE_PLANS.find((p) => p.id === priceId)?.name || priceId || 'N/A';

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const maskId = (value) => {
    if (!value || typeof value !== 'string') return 'N/A';
    if (value.length <= 10) return value;
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  };

  const normalizeSubscriptionStatusLabel = (status) => {
    const isActive = status === 'active' || status === 'trialing';
    return isActive ? 'Active' : 'Inactive';
  };

  const handleAvatarSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setAvatarDataUrl(dataUrl);
      try {
        localStorage.setItem(`${AVATAR_STORAGE_PREFIX}${user.id}`, dataUrl);
      } catch {
        // ignore storage issues
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarDataUrl('');
    try {
      localStorage.removeItem(`${AVATAR_STORAGE_PREFIX}${user.id}`);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (username !== user.username) {
      if (username.length < 3 || username.length > 30) {
        setError('Username must be between 3 and 30 characters');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }
    }

    if (password) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    if (username === user.username && email === user.email && !password) {
      setError('No changes to save');
      return;
    }

    setLoading(true);

    try {
      const updateData = {};
      if (username !== user.username) updateData.username = username;
      if (email !== user.email) updateData.email = email;
      if (password) updateData.password = password;

      const response = await axios.put(`${API_URL}/auth/profile`, updateData);
      setSuccess('Profile updated successfully!');

      setPassword('');
      setConfirmPassword('');

      if ((username !== user.username || email !== user.email) && onUpdate) {
        onUpdate(response.data.user);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="profile"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="page-header">
        <h2>Profile Settings</h2>
        <p>Manage your account information</p>
      </div>

      <div className="profile-layout">
        <motion.aside
          className="profile-sidebar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="card profile-identity">
            <div className="profile-identity-top">
              <div className="avatar">
                {avatarDataUrl ? (
                  <img className="avatar-image" src={avatarDataUrl} alt="Profile avatar" />
                ) : (
                  <div className="avatar-fallback" style={{ background: `hsl(${avatarHue} 75% 40%)` }}>
                    {initials}
                  </div>
                )}
              </div>
              <div className="profile-identity-text">
                <div className="profile-name">{displayName}</div>
                <div className="profile-email">{user.email}</div>
              </div>
            </div>

            <div className="profile-identity-actions">
              <label className="btn btn-secondary profile-upload-btn">
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
                  disabled={loading}
                />
              </label>
              {avatarDataUrl && (
                <button type="button" className="btn btn-danger" onClick={handleAvatarRemove} disabled={loading}>
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="card profile-overview">
            <h3>Account Overview</h3>

            <div className="profile-kv">
              <div className="kv-row">
                <div className="kv-key">User ID</div>
                <div className="kv-value" title={user.id}>{maskId(user.id)}</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Stripe Customer</div>
                <div className="kv-value" title={user.stripeCustomerId}>{maskId(user.stripeCustomerId)}</div>
              </div>
              {user.createdAt && (
                <div className="kv-row">
                  <div className="kv-key">Member since</div>
                  <div className="kv-value">{formatDate(user.createdAt)}</div>
                </div>
              )}
            </div>

            <div className="profile-divider" />

            <div className="profile-kv">
              <div className="kv-row">
                <div className="kv-key">Subscription</div>
                <div className="kv-value">
                  {summaryLoading
                    ? 'Loading…'
                    : subscriptionSummary
                      ? normalizeSubscriptionStatusLabel(subscriptionSummary.status)
                      : 'None'}
                </div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Plan</div>
                <div className="kv-value">
                  {summaryLoading ? 'Loading…' : subscriptionSummary ? getPlanNameByPriceId(subscriptionSummary.priceId) : 'N/A'}
                </div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Next renewal</div>
                <div className="kv-value">
                  {summaryLoading ? 'Loading…' : subscriptionSummary?.currentPeriodEnd ? formatDate(subscriptionSummary.currentPeriodEnd) : 'N/A'}
                </div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Payment methods</div>
                <div className="kv-value">{summaryLoading ? 'Loading…' : paymentSummary ? `${paymentSummary.count}` : '0'}</div>
              </div>
              {paymentSummary?.defaultLast4 && (
                <div className="kv-row">
                  <div className="kv-key">Default card</div>
                  <div className="kv-value">
                    {(paymentSummary.defaultBrand || 'CARD').toUpperCase()} •••• {paymentSummary.defaultLast4}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        <motion.section
          className="profile-main"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <div className="card">
            <h3 className="profile-section-title">Edit Profile</h3>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  disabled={loading}
                />
                <small className="profile-help">3-30 characters, letters, numbers, and underscores only</small>
              </div>

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="profile-divider" />

              <h4 className="profile-subtitle">Security</h4>

              <div className="input-group">
                <label htmlFor="password">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter new password"
                />
              </div>

              {password && (
                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Confirm new password"
                  />
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <motion.button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: '16px' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Updating...' : 'Save Changes'}
              </motion.button>
            </form>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

export default Profile;
