import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';
import './Subscribe.css';

const API_URL = 'https://subscription-management-task-1.onrender.com/api';

// Stripe Price IDs — set in .env:
// REACT_APP_STRIPE_PRICE_MONTHLY, REACT_APP_STRIPE_PRICE_QUARTERLY, REACT_APP_STRIPE_PRICE_YEARLY
// Get them from: https://dashboard.stripe.com/test/products → create products/prices → copy Price ID (price_xxx...)
const PRICE_PLANS = [
  {
    id: process.env.REACT_APP_STRIPE_PRICE_MONTHLY || 'price_monthly',
    name: 'Monthly Plan',
    price: '$29.99',
    period: 'per month',
    description: 'Perfect for getting started',
    features: ['Full access', 'Cancel anytime', 'Email support']
  },
  {
    id: process.env.REACT_APP_STRIPE_PRICE_QUARTERLY || 'price_quarterly',
    name: 'Quarterly Plan',
    price: '$79.99',
    period: 'per 3 months',
    description: 'More savings, still flexible',
    tag: 'Save more',
    features: ['Full access', 'Save vs monthly', 'Priority email support']
  },
  {
    id: process.env.REACT_APP_STRIPE_PRICE_YEARLY || 'price_yearly',
    name: 'Yearly Plan',
    price: '$299.99',
    period: 'per year',
    description: 'Best value for long-term users',
    tag: 'Recommended',
    recommended: true,
    features: ['Full access', 'Best savings', 'Priority support']
  }
];

const PLACEHOLDER_IDS = ['price_monthly', 'price_quarterly', 'price_yearly'];
const isPriceIdConfigured = (priceId) => priceId && !PLACEHOLDER_IDS.includes(priceId);
const arePriceIdsConfigured = () => PRICE_PLANS.every((p) => isPriceIdConfigured(p.id));

function Subscribe({ user }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const handlePriceSelect = (priceId) => {
    setSelectedPriceId(priceId);
    setError(null);
  };

  useEffect(() => {
    if (showPaymentForm && user) {
      fetchSavedPaymentMethods();
    }
  }, [showPaymentForm, user]);

  const fetchSavedPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      const response = await axios.get(`${API_URL}/payment-methods/${user.stripeCustomerId}`);
      setSavedPaymentMethods(response.data.paymentMethods);
      // Auto-select default payment method if available
      if (response.data.defaultPaymentMethodId) {
        setSelectedPaymentMethodId(response.data.defaultPaymentMethodId);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      // Don't show error - just proceed with new card option
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const handleContinue = () => {
    if (!selectedPriceId) {
      setError('Please select a plan');
      return;
    }
    setShowPaymentForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPriceId) {
      setError('Please select a plan');
      return;
    }

    // If using saved payment method
    if (selectedPaymentMethodId && !showNewCardForm) {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.post(`${API_URL}/subscriptions/create`, {
          customerId: user.stripeCustomerId,
          paymentMethodId: selectedPaymentMethodId,
          priceId: selectedPriceId
        });

        if (response.data.subscription.clientSecret) {
          const { error: confirmError } = await stripe.confirmCardPayment(
            response.data.subscription.clientSecret,
            {
              payment_method: selectedPaymentMethodId
            }
          );

          if (confirmError) {
            setError(confirmError.message);
          } else {
            alert('Subscription created successfully!');
            navigate('/dashboard');
          }
        } else {
          alert('Subscription created successfully!');
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error creating subscription:', err);
        setError(err.response?.data?.error || 'Failed to create subscription');
      } finally {
        setLoading(false);
      }
      return;
    }

    // If adding new card
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement('card'),
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        setLoading(false);
        return;
      }

      if (!paymentMethod) {
        setError('Failed to create payment method. Please try again.');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/subscriptions/create`, {
        customerId: user.stripeCustomerId,
        paymentMethodId: paymentMethod.id,
        priceId: selectedPriceId
      });

      if (response.data.subscription.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          response.data.subscription.clientSecret,
          {
            payment_method: paymentMethod.id
          }
        );

        if (confirmError) {
          setError(confirmError.message);
        } else {
          alert('Subscription created successfully!');
          navigate('/dashboard');
        }
      } else {
        alert('Subscription created successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error creating subscription:', err);
      console.error('Full error response:', err.response?.data);
      console.error('Error code:', err.code);
      console.error('API URL:', `${API_URL}/subscriptions/create`);
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to create subscription';
      
      // Network errors (backend not running or unreachable)
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || !err.response) {
        errorMessage = `Cannot connect to backend server. Please make sure:
        1. Backend server is running on port 5000
        2. Backend URL is correct: ${API_URL}
        3. No firewall is blocking the connection`;
      }
      // HTTP errors from backend
      else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        // Check if it's a price ID error
        if (errorMessage.includes('price') || errorMessage.includes('Price ID')) {
          errorMessage += '. Please make sure you have created the prices in Stripe Dashboard and updated the Price IDs in Subscribe.js';
        }
      } 
      // Other axios errors
      else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const allPriceIdsOk = arePriceIdsConfigured();
  const anyPriceIdsOk = PRICE_PLANS.some((p) => isPriceIdConfigured(p.id));
  const selectedPriceOk = isPriceIdConfigured(selectedPriceId);

  return (
    <div className="subscribe">
      <div className="page-header">
        <h2>Subscribe to a Plan</h2>
        <p>Choose a plan that works best for you</p>
      </div>

      {!allPriceIdsOk && (
        <motion.div
          className="setup-required-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h4>Stripe Price IDs not configured</h4>
          <p>Create prices in Stripe and add them to <code>frontend/.env</code>:</p>
          <ol>
            <li>Go to <a href="https://dashboard.stripe.com/test/products" target="_blank" rel="noopener noreferrer">Stripe Dashboard → Products</a> (test mode).</li>
            <li>Create a product (e.g. &quot;Monthly Plan&quot;) and add a recurring price ($29.99/month). Copy the Price ID (<code>price_...</code>).</li>
            <li>Create a product (e.g. &quot;Quarterly Plan&quot;) and add a recurring price ($79.99/3 months). Copy that Price ID.</li>
            <li>Create another product (e.g. &quot;Yearly Plan&quot;) and add a recurring price ($299.99/year). Copy that Price ID.</li>
            <li>In <code>frontend/.env</code>, set:<br />
              <code>REACT_APP_STRIPE_PRICE_MONTHLY=price_xxxxx</code><br />
              <code>REACT_APP_STRIPE_PRICE_QUARTERLY=price_xxxxx</code><br />
              <code>REACT_APP_STRIPE_PRICE_YEARLY=price_xxxxx</code>
            </li>
            <li>Restart the frontend dev server.</li>
          </ol>
          <p style={{ marginTop: '8px', marginBottom: 0 }}>
            Plans that are not configured will be shown as unavailable.
          </p>
        </motion.div>
      )}

      {!showPaymentForm ? (
        <>
          <div className={`price-selector ${!anyPriceIdsOk ? 'disabled' : ''}`}>
            {PRICE_PLANS.map((plan, index) => (
              (() => {
                const planOk = isPriceIdConfigured(plan.id);
                const isSelected = selectedPriceId === plan.id;
                return (
              <motion.div
                key={plan.id}
                className={[
                  'price-card',
                  isSelected ? 'selected' : '',
                  plan.recommended ? 'recommended' : '',
                  !planOk ? 'unavailable' : ''
                ].filter(Boolean).join(' ')}
                onClick={() => planOk && handlePriceSelect(plan.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={planOk ? { scale: 1.02, y: -4 } : undefined}
                whileTap={planOk ? { scale: 0.98 } : undefined}
              >
                <div className="price-card-header">
                  <div className="price-card-badges">
                    {plan.tag && (
                      <span className={`plan-badge ${plan.recommended ? 'plan-badge-recommended' : ''}`}>
                        {plan.tag}
                      </span>
                    )}
                    {!planOk && <span className="plan-badge plan-badge-warning">Not configured</span>}
                  </div>
                  {isSelected && <span className="plan-check" aria-hidden="true">✓</span>}
                </div>
                <h3>{plan.name}</h3>
                <div className="price-row">
                  <div className="price">{plan.price}</div>
                  <div className="price-period">{plan.period}</div>
                </div>
                <p className="plan-description">{plan.description}</p>
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <ul className="plan-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
                );
              })()
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleContinue}
            className="btn btn-primary"
            disabled={!selectedPriceId || !selectedPriceOk}
          >
            Continue to Payment
          </button>
        </>
      ) : (
        <div className="card stripe-form">
          <h3>Payment Information</h3>
          
          {loadingPaymentMethods ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading payment methods...</div>
          ) : (
            <>
              {savedPaymentMethods.length > 0 && !showNewCardForm && (
                <div className="saved-payment-methods">
                  <div className="saved-payment-header">
                    <label className="saved-payment-label">Select a saved payment method</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCardForm(true);
                        setSelectedPaymentMethodId('');
                      }}
                      className="btn btn-secondary saved-add-btn"
                    >
                      + Add New Card
                    </button>
                  </div>

                  <div className="saved-payment-list">
                    {savedPaymentMethods.map((pm) => {
                      const selected = selectedPaymentMethodId === pm.id;
                      return (
                        <button
                          type="button"
                          key={pm.id}
                          onClick={() => setSelectedPaymentMethodId(pm.id)}
                          className={`saved-payment-card ${selected ? 'selected' : ''}`}
                        >
                          <div className="pm-left">
                            <div className="pm-icon" aria-hidden="true">💳</div>
                            <div className="pm-text">
                              <div className="pm-title">
                                {pm.card.brand.toUpperCase()} •••• {pm.card.last4}
                              </div>
                              <div className="pm-subtitle">
                                Expires {pm.card.expMonth}/{pm.card.expYear}
                                {pm.isDefault && <span className="pm-default">Default</span>}
                              </div>
                            </div>
                          </div>
                          {selected && <div className="pm-selected">Selected</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(showNewCardForm || savedPaymentMethods.length === 0) && (
                <>
                  {savedPaymentMethods.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCardForm(false);
                          if (savedPaymentMethods.length > 0) {
                            const defaultMethod = savedPaymentMethods.find(pm => pm.isDefault) || savedPaymentMethods[0];
                            setSelectedPaymentMethodId(defaultMethod.id);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '14px' }}
                      >
                        ← Use Saved Card
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} id="payment-form">
                    <div className="input-group card-details-section">
                      <div className="card-details-header">
                        <label className="card-details-label">💳 Card Details</label>
                        <span className="card-details-badge">Secure Payment</span>
                      </div>
                      <p className="card-details-description">
                        Enter your card information below. Your payment is encrypted and secure.
                      </p>
                      <div className="stripe-element-wrapper">
                        <CardElement
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#e5e7eb',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                lineHeight: '1.8',
                                '::placeholder': {
                                  color: '#6b7280',
                                  fontSize: '16px',
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
                            hidePostalCode: true, // Hide ZIP/Postal code field
                            iconStyle: 'solid'
                          }}
                        />
                      </div>
                      <div className="card-details-footer">
                      </div>
                    </div>
                  </form>
                </>
              )}

              {error && <div className="error-message" style={{ marginTop: '15px' }}>{error}</div>}

              <div className="button-group" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setShowNewCardForm(false);
                    setSelectedPaymentMethodId('');
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Back
                </button>
                {showNewCardForm || savedPaymentMethods.length === 0 ? (
                  <button
                    type="submit"
                    form="payment-form"
                    className="btn btn-primary"
                    disabled={!stripe || loading}
                  >
                    {loading ? 'Processing...' : 'Subscribe'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (selectedPaymentMethodId) {
                        handleSubmit(e);
                      }
                    }}
                    className="btn btn-primary"
                    disabled={loading || !selectedPaymentMethodId}
                  >
                    {loading ? 'Processing...' : 'Subscribe'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Subscribe;

