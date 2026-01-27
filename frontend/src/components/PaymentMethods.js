import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';
import './PaymentMethods.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function PaymentMethods({ user }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [settingDefault, setSettingDefault] = useState(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/payment-methods/${user.stripeCustomerId}`);
      setPaymentMethods(response.data.paymentMethods);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err.response?.data?.error || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement('card'),
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        setAdding(false);
        return;
      }

      // Add payment method to customer
      await axios.post(`${API_URL}/payment-methods/add`, {
        customerId: user.stripeCustomerId,
        paymentMethodId: paymentMethod.id,
        setAsDefault: paymentMethods.length === 0 // Set as default if it's the first card
      });

      alert('Payment method added successfully!');
      setShowAddForm(false);
      elements.getElement('card').clear();
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err.response?.data?.error || 'Failed to add payment method');
    } finally {
      setAdding(false);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      setSettingDefault(paymentMethodId);
      await axios.post(`${API_URL}/payment-methods/set-default`, {
        customerId: user.stripeCustomerId,
        paymentMethodId
      });
      alert('Default payment method updated!');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error setting default payment method:', err);
      alert(err.response?.data?.error || 'Failed to set default payment method');
    } finally {
      setSettingDefault(null);
    }
  };

  const handleRemove = async (paymentMethodId) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/payment-methods/${paymentMethodId}`);
      alert('Payment method removed successfully!');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error removing payment method:', err);
      alert(err.response?.data?.error || 'Failed to remove payment method');
    }
  };

  const getCardBrandIcon = (brand) => {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      jcb: '💳',
      diners: '💳',
      unionpay: '💳'
    };
    return icons[brand] || '💳';
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Loading payment methods...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="payment-methods"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h2>Payment Methods</h2>
        <p>Manage your payment methods</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pm-header">
          <h3>Your Payment Methods</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`btn ${showAddForm ? 'btn-secondary' : 'btn-primary'}`}
          >
            {showAddForm ? 'Cancel' : 'Add New Card'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-card-panel">
            <h4>Add New Payment Method</h4>
            <form onSubmit={handleAddPaymentMethod}>
              <div className="input-group">
                <label>Card Details</label>
                <div className="stripe-element-wrapper">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#f8fafc',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          '::placeholder': {
                            color: '#94a3b8',
                          },
                        },
                        invalid: {
                          color: '#f87171',
                          iconColor: '#f87171',
                        },
                        complete: {
                          color: '#4ade80',
                          iconColor: '#4ade80',
                        },
                      },
                      hidePostalCode: false,
                    }}
                  />
                </div>
                <p className="pm-hint">Test card: 4242 4242 4242 4242 • Any future expiry • Any CVC • Any ZIP</p>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!stripe || adding}
              >
                {adding ? 'Adding...' : 'Add Payment Method'}
              </button>
            </form>
          </div>
        )}

        {paymentMethods.length === 0 ? (
          <div className="empty-state">
            <p>No payment methods found. Add a payment method to get started.</p>
          </div>
        ) : (
          <div className="payment-methods-list">
            <AnimatePresence>
              {paymentMethods.map((pm, index) => (
                <motion.div 
                  key={pm.id} 
                  className="payment-method-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <div className="pm-card-left">
                    <div className="pm-card-icon" aria-hidden="true">{getCardBrandIcon(pm.card.brand)}</div>
                    <div className="pm-card-text">
                      <div className="pm-card-title">
                        {pm.card.brand.toUpperCase()} •••• {pm.card.last4}
                      </div>
                      <div className="pm-card-subtitle">
                        Expires {pm.card.expMonth}/{pm.card.expYear}
                        {pm.isDefault && <span className="pm-default-pill">Default</span>}
                      </div>
                    </div>
                  </div>
                  <div className="pm-card-actions">
                    {!pm.isDefault && (
                      <button
                        onClick={() => handleSetDefault(pm.id)}
                        className="btn btn-secondary pm-action-btn"
                        disabled={settingDefault === pm.id}
                      >
                        {settingDefault === pm.id ? 'Setting...' : 'Set as Default'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(pm.id)}
                      className="btn btn-danger pm-action-btn"
                    >
                      Remove
                    </button>
                  </div>
              </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default PaymentMethods;
