import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LandingPage.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 * i },
  }),
  exit: { opacity: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const features = [
  {
    title: 'Secure Payments',
    desc: 'Powered by Stripe with bank-level security. Your payment information is always protected.',
  },
  {
    title: 'Track Everything',
    desc: 'Monitor all your subscriptions in one centralized dashboard. Never lose track of your payments.',
  },
  {
    title: 'Billing History',
    desc: 'Access complete billing history with downloadable invoices and spending analytics.',
  },
  {
    title: 'Easy Management',
    desc: 'Subscribe, cancel, or update plans with just a few clicks. No complicated processes.',
  },
  {
    title: 'Smart Notifications',
    desc: 'Get notified about upcoming renewals and payment status. Stay on top of your subscriptions.',
  },
  {
    title: 'Lightning Fast',
    desc: 'Built with modern technology for reliable performance and instant updates.',
  },
];

function LandingPage({ onLogin, onSignup }) {
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthForm, setShowAuthForm] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await onLogin(emailOrUsername, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await onSignup(username, email, password);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    setShowAuthForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAuth = () => {
    setShowAuthForm(false);
    setError('');
    setUsername('');
    setEmail('');
    setEmailOrUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="landing-page">
      <div className="lp-bg">
        <div className="lp-grid" />
        <div className="lp-orbs">
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
          <div className="lp-orb lp-orb-4" />
          <div className="lp-orb lp-orb-5" />
        </div>
      </div>

      <section className="hero-section">
        <div className="container">
          <div className="hero-wrapper">
            {/* Left Column */}
            <motion.div
              className="hero-left"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="hero-badge" variants={itemVariants}>
                <span className="hero-badge-dot" />
                <span className="hero-badge-text">Subscription Management Made Simple</span>
              </motion.div>

              <motion.h1 className="hero-title" variants={itemVariants}>
                Take Control of Your <span className="gradient-text">Subscriptions</span>
              </motion.h1>

              <AnimatePresence mode="wait">
                {!showAuthForm ? (
                  <motion.button
                    type="button"
                    className="hero-cta-btn"
                    onClick={handleGetStarted}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Get Started Free</span>
                    <span className="arrow">→</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="auth"
                    className="auth-form-container"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                  <div className="auth-tabs">
                    <button
                      type="button"
                      className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab('login');
                        setError('');
                      }}
                    >
                      Login
                      {activeTab === 'login' && (
                        <motion.div
                          className="auth-tab-indicator"
                          layoutId="authTabIndicator"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab('signup');
                        setError('');
                      }}
                    >
                      Sign Up
                      {activeTab === 'signup' && (
                        <motion.div
                          className="auth-tab-indicator"
                          layoutId="authTabIndicator"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        className="auth-error"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {activeTab === 'login' ? (
                      <motion.form
                        key="login-form"
                        onSubmit={handleLogin}
                        className="auth-form"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="input-group">
                          <input
                            type="text"
                            value={emailOrUsername}
                            onChange={(e) => setEmailOrUsername(e.target.value)}
                            placeholder="Email or Username"
                            className="auth-input"
                            required
                            autoFocus
                          />
                        </div>
                        <div className="input-group">
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="auth-input"
                            required
                          />
                        </div>
                        <motion.button
                          type="submit"
                          className="btn btn-primary btn-large btn-full lp-submit-btn"
                          disabled={loading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </motion.button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="signup-form"
                        onSubmit={handleSignup}
                        className="auth-form"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="input-group">
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username (3–30 characters)"
                            className="auth-input"
                            required
                            minLength={3}
                            maxLength={30}
                            pattern="[a-zA-Z0-9_]+"
                            autoFocus
                          />
                        </div>
                        <div className="input-group">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="auth-input"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password (min. 6 characters)"
                            className="auth-input"
                            required
                            minLength={6}
                          />
                        </div>
                        <div className="input-group">
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="auth-input"
                            required
                          />
                        </div>
                        <motion.button
                          type="submit"
                          className="btn btn-primary btn-large btn-full lp-submit-btn"
                          disabled={loading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {loading ? 'Creating account...' : 'Sign Up'}
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <button type="button" className="back-link" onClick={resetAuth}>
                    ← Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </motion.div>

            {/* Right Column */}
            <motion.div
              className="hero-right"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="feature-list">
                <p className="hero-subtitle">
                  Track, manage, and optimize all your recurring payments in one place.
                </p>
                <div className="highlights">
                  <span className="highlight">Secure</span>
                  <span className="dot">•</span>
                  <span className="highlight">Simple</span>
                  <span className="dot">•</span>
                  <span className="highlight">Smart</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {!showAuthForm && (
        <>
          <section className="features-section">
            <div className="container">
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6 }}
              >
                Why Choose Our Platform
              </motion.h2>
              <div className="features-grid">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="feature-card"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  >
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="how-it-works-section">
            <div className="container">
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6 }}
              >
                How It Works
              </motion.h2>
              <div className="steps-grid">
                <motion.div
                  className="step-card"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <div className="step-number">1</div>
                  <h3>Sign Up</h3>
                  <p>Create your account in seconds with secure authentication.</p>
                </motion.div>
                <motion.div
                  className="step-card"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <div className="step-number">2</div>
                  <h3>Add Subscriptions</h3>
                  <p>Connect your payment methods and import existing subscriptions.</p>
                </motion.div>
                <motion.div
                  className="step-card"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <div className="step-number">3</div>
                  <h3>Manage & Track</h3>
                  <p>Monitor renewals, cancel plans, and optimize your spending.</p>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <div className="container">
              <motion.div
                className="cta-content"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2>Ready to Get Started?</h2>
                <p>Join thousands managing their subscriptions with confidence.</p>
                <motion.button
                  type="button"
                  className="btn btn-primary btn-large lp-cta-btn"
                  onClick={handleGetStarted}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Managing Now
                </motion.button>
              </motion.div>
            </div>
          </section>
        </>
      )}

      
    </div>
  );
}

export default LandingPage;
