import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Price plans (should match Subscribe.js)
const PRICE_PLANS = [
  {
    id: process.env.REACT_APP_STRIPE_PRICE_MONTHLY || 'price_monthly',
    name: 'Monthly Plan',
    price: '$29.99',
    period: 'per month',
    description: 'Perfect for getting started'
  },
  {
    id: process.env.REACT_APP_STRIPE_PRICE_QUARTERLY || 'price_quarterly',
    name: 'Quarterly Plan',
    price: '$79.99',
    period: 'per 3 months',
    description: 'More savings, still flexible'
  },
  {
    id: process.env.REACT_APP_STRIPE_PRICE_YEARLY || 'price_yearly',
    name: 'Yearly Plan',
    price: '$299.99',
    period: 'per year',
    description: 'Save 17% with annual billing'
  }
];

function Dashboard({ user }) {
  const [subscription, setSubscription] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeDowngrade, setShowUpgradeDowngrade] = useState(false);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subscriptionRes, invoiceRes] = await Promise.all([
        axios.get(`${API_URL}/subscriptions/${user.stripeCustomerId}`).catch(() => null),
        axios.get(`${API_URL}/invoices/upcoming/${user.stripeCustomerId}`).catch(() => null)
      ]);

      if (subscriptionRes) {
        const data = subscriptionRes.data || {};
        // Support both legacy shape ({subscription}) and new shape ({subscriptions, subscription})
        if (Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
          setSubscriptions(data.subscriptions);
          setSubscription(data.subscription || data.subscriptions[0]);
        } else if (data.subscription) {
          setSubscription(data.subscription);
          setSubscriptions([data.subscription]);
        }
      }

      if (invoiceRes) {
        setUpcomingInvoice(invoiceRes.data.upcomingInvoice);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err.response?.data?.error || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/subscriptions/cancel/${subscription.id}`);
      alert('Subscription will be canceled at the end of the billing period');
      fetchSubscriptionData();
    } catch (err) {
      console.error('Error canceling subscription:', err);
      alert(err.response?.data?.error || 'Failed to cancel subscription');
    }
  };

  const handleResumeSubscription = async () => {
    if (!window.confirm('Are you sure you want to resume your subscription?')) {
      return;
    }

    try {
      setUpdating(true);
      await axios.post(`${API_URL}/subscriptions/resume/${subscription.id}`);
      alert('Subscription has been resumed successfully!');
      fetchSubscriptionData();
    } catch (err) {
      console.error('Error resuming subscription:', err);
      alert(err.response?.data?.error || 'Failed to resume subscription');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpgradeDowngrade = async (newPriceId) => {
    if (newPriceId === subscription.priceId) {
      alert('You are already on this plan');
      return;
    }

    const selectedPlan = PRICE_PLANS.find(p => p.id === newPriceId);
    if (!window.confirm(`Are you sure you want to change to ${selectedPlan?.name}? This will update your subscription immediately with prorated billing.`)) {
      return;
    }

    try {
      setUpdating(true);
      await axios.post(`${API_URL}/subscriptions/update/${subscription.id}`, {
        priceId: newPriceId,
        prorationBehavior: 'create_prorations'
      });
      alert('Subscription updated successfully!');
      setShowUpgradeDowngrade(false);
      fetchSubscriptionData();
    } catch (err) {
      console.error('Error updating subscription:', err);
      alert(err.response?.data?.error || 'Failed to update subscription');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Loading subscription data...</p>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Welcome back, {user.email}</p>
        </div>
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="error-message">{error}</div>
          <motion.button
            onClick={() => navigate('/subscribe')}
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Subscribe Now
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const getEffectiveStatus = (sub) => sub?.stripeData?.status || sub?.status;
  const getEffectiveCancelAtPeriodEnd = (sub) =>
    typeof sub?.stripeData?.cancel_at_period_end === 'boolean'
      ? sub.stripeData.cancel_at_period_end
      : sub?.cancelAtPeriodEnd;
  const getEffectivePriceId = (sub) =>
    sub?.stripeData?.items?.data?.[0]?.price?.id || sub?.priceId;

  const getPlanNameByPriceId = (priceId) =>
    PRICE_PLANS.find((p) => p.id === priceId)?.name || priceId || 'N/A';

  const normalizeSubscriptionStatus = (status) => {
    // Stripe can return many statuses; dashboard should show only Active/Inactive.
    // Treat trialing as active; everything else as inactive.
    const isActive = status === 'active' || status === 'trialing';
    return isActive ? 'active' : 'inactive';
  };

  const StatusBadge = ({ status }) => {
    const normalized = normalizeSubscriptionStatus(status);
    const label = normalized === 'active' ? 'Active' : 'Inactive';
    const cls = normalized === 'active' ? 'status-active' : 'status-canceled';
    return (
      <span className={`status-badge ${cls}`} aria-label={`Subscription status: ${label}`}>
        <span className="status-dot" aria-hidden="true" />
        {label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  return (
    <motion.div 
      className="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {user.username || user.email}!</p>
      </div>

      {subscription ? (
        <>
          <motion.div 
            className="subscription-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {[
              { label: 'Subscription Status', value: <StatusBadge status={getEffectiveStatus(subscription)} /> },
              { label: 'Current Plan', value: getPlanNameByPriceId(getEffectivePriceId(subscription)) },
              { label: 'Current Period End', value: formatDate(subscription.currentPeriodEnd) },
              ...(upcomingInvoice ? [{ label: 'Next Payment', value: formatCurrency(upcomingInvoice.amountDue, upcomingInvoice.currency) }] : []),
              ...(upcomingInvoice && upcomingInvoice.nextPaymentAttempt ? [{ label: 'Next Billing Date', value: formatDate(upcomingInvoice.nextPaymentAttempt) }] : [])
            ].map((info, index) => (
              <motion.div 
                key={index}
                className="info-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <div className="info-card-label">{info.label}</div>
                <div className="info-card-value">{info.value}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="card dashboard-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="dashboard-details-header">
              <h3>Subscription Details</h3>
              <div className="dashboard-details-actions">
                {getEffectiveStatus(subscription) === 'active' && !getEffectiveCancelAtPeriodEnd(subscription) && (
                  <>
                    <button
                      onClick={() => setShowUpgradeDowngrade(!showUpgradeDowngrade)}
                      className="btn btn-secondary"
                      disabled={updating}
                    >
                      {showUpgradeDowngrade ? 'Cancel' : 'Change Plan'}
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="btn btn-danger"
                      disabled={updating}
                    >
                      Cancel Subscription
                    </button>
                  </>
                )}
                {getEffectiveStatus(subscription) === 'active' && getEffectiveCancelAtPeriodEnd(subscription) && (
                  <button
                    onClick={handleResumeSubscription}
                    className="btn btn-primary"
                    disabled={updating}
                  >
                    {updating ? 'Resuming...' : 'Resume Subscription'}
                  </button>
                )}
              </div>
            </div>

            {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

            <dl className="details-list">
              <div className="details-row">
                <dt>Current plan</dt>
                <dd>{getPlanNameByPriceId(getEffectivePriceId(subscription))}</dd>
              </div>
              <div className="details-row">
                <dt>Current period start</dt>
                <dd>{formatDate(subscription.currentPeriodStart)}</dd>
              </div>
              <div className="details-row">
                <dt>Cancel at period end</dt>
                <dd>{getEffectiveCancelAtPeriodEnd(subscription) ? 'Yes' : 'No'}</dd>
              </div>
            </dl>

            {showUpgradeDowngrade && getEffectiveStatus(subscription) === 'active' && !getEffectiveCancelAtPeriodEnd(subscription) && (
              <motion.div 
                className="plan-switcher"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h4>Select a Plan</h4>
                <div className="plan-options">
                  {PRICE_PLANS.map((plan) => (
                    <motion.div
                      key={plan.id}
                      className={`plan-option ${subscription.priceId === plan.id ? 'current' : ''}`}
                      onClick={() => handleUpgradeDowngrade(plan.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="plan-option-title">
                        <h5>{plan.name}</h5>
                        <div className="plan-option-price">{plan.price}</div>
                      </div>
                      <div className="plan-option-period">{plan.period}</div>
                      <div className="plan-option-meta">
                        <div className="plan-option-description">{plan.description}</div>
                        {subscription.priceId === plan.id && <div className="plan-current-tag">Current</div>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {subscriptions.length > 1 && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Subscription History</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Period Start</th>
                    <th>Period End</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDate(s.createdAt)}</td>
                      <td>{getPlanNameByPriceId(s.priceId)}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>{formatDate(s.currentPeriodStart)}</td>
                      <td>{formatDate(s.currentPeriodEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 style={{ color: 'var(--text-primary)' }}>No Active Subscription</h3>
          <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
            You don't have an active subscription. Subscribe to a plan to get started.
          </p>
          <motion.button
            onClick={() => navigate('/subscribe')}
            className="btn btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Subscribe Now
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Dashboard;

