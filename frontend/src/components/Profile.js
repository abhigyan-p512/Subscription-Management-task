import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './Profile.css';

const API_URL = 'https://subscription-management-task.onrender.com';
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
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  const handleAvatarSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be under 2MB');
      return;
    }

    setAvatarUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setAvatarDataUrl(dataUrl);
      try {
        localStorage.setItem(`${AVATAR_STORAGE_PREFIX}${user.id}`, dataUrl);
      } catch {
        // ignore storage issues
      }
      setAvatarUploading(false);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setAvatarUploading(false);
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

  const getStatusClass = (status) => {
    if (!status) return 'status-none';
    const isActive = status === 'active' || status === 'trialing';
    return isActive ? 'status-active' : 'status-inactive';
  };

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-hero">
        <div className="hero-content">
          <div className="hero-avatar-section">
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                {avatarUploading ? (
                  <div className="avatar-loading">
                    <div className="loading-spinner" />
                  </div>
                ) : avatarDataUrl ? (
                  <img
                    className="avatar-image"
                    src={avatarDataUrl}
                    alt="Profile"
                  />
                ) : (
                  <div
                    className="avatar-fallback"
                    style={{
                      background: `linear-gradient(135deg, hsl(${avatarHue}, 70%, 50%), hsl(${avatarHue + 30}, 70%, 45%))`
                    }}
                  >
                    <span className="avatar-initials">{initials}</span>
                  </div>
                )}
              </div>

              <div className="avatar-actions">
                <label className="avatar-upload-btn">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
                    disabled={loading || avatarUploading}
                  />
                </label>
                {avatarDataUrl && (
                  <button
                    className="avatar-remove-btn"
                    onClick={handleAvatarRemove}
                    disabled={loading || avatarUploading}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="hero-info">
            <h1 className="profile-title">Welcome back, {displayName}!</h1>
            <p className="profile-subtitle">Manage your account settings and preferences</p>
            <div className="profile-meta">
              <div className="meta-item">
                <span className="meta-label">Member since</span>
                <span className="meta-value">
                  {user.createdAt ? formatDate(user.createdAt) : 'Recently'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Account ID</span>
                <span className="meta-value">{maskId(user.id)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="profile-grid">
        {/* Account Overview Card */}
        <div className="profile-card overview-card">
          <div className="card-header">
            <div>
              <h3>Account Overview</h3>
              <p>Your subscription and payment details</p>
            </div>
          </div>

          <div className="card-content">
            <div className="overview-grid">
              {/* Subscription Status */}
              <div className="overview-item">
                <div className="item-content">
                  <span className="item-label">Subscription</span>
                  <span className={`item-value ${getStatusClass(subscriptionSummary?.status)}`}>
                    {summaryLoading ? (
                      <div className="skeleton-text" />
                    ) : (
                      subscriptionSummary ? normalizeSubscriptionStatusLabel(subscriptionSummary.status) : 'None'
                    )}
                  </span>
                </div>
              </div>

              {/* Current Plan */}
              <div className="overview-item">
                <div className="item-content">
                  <span className="item-label">Current Plan</span>
                  <span className="item-value">
                    {summaryLoading ? (
                      <div className="skeleton-text" />
                    ) : (
                      subscriptionSummary ? getPlanNameByPriceId(subscriptionSummary.priceId) : 'Free'
                    )}
                  </span>
                </div>
              </div>

              {/* Next Billing */}
              <div className="overview-item">
                <div className="item-content">
                  <span className="item-label">Next Billing</span>
                  <span className="item-value">
                    {summaryLoading ? (
                      <div className="skeleton-text" />
                    ) : (
                      subscriptionSummary?.currentPeriodEnd ? formatDate(subscriptionSummary.currentPeriodEnd) : 'N/A'
                    )}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="overview-item">
                <div className="item-content">
                  <span className="item-label">Payment Methods</span>
                  <span className="item-value">
                    {summaryLoading ? (
                      <div className="skeleton-text" />
                    ) : (
                      `${paymentSummary?.count || 0} saved`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings Card */}
        <div className="profile-card settings-card">
          <div className="card-header">
            <div>
              <h3>Account Settings</h3>
              <p>Update your profile information</p>
            </div>
          </div>

          <div className="card-content">
            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-section">
                <h4>Profile Information</h4>
                <div className="form-row">
                  <div className="form-group">
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
                      placeholder="Enter your username"
                    />
                    <span className="form-help">3-30 characters, letters, numbers, and underscores only</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Change Password</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">New Password</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Leave blank to keep current"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">!</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <span className="alert-icon">✓</span>
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
