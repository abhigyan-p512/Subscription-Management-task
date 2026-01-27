import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LandingPage.css';

/* Use local images from public/images/ when available, or themed placeholders */
const IMAGES = {
  heroPreview: `${process.env.PUBLIC_URL || ''}/images/hero-preview.png`,
  previewDashboard: `${process.env.PUBLIC_URL || ''}/images/preview-dashboard.png`,
  previewBilling: `${process.env.PUBLIC_URL || ''}/images/preview-billing.png`,
  previewPlans: `${process.env.PUBLIC_URL || ''}/images/preview-plans.png`,
};
const FALLBACK_IMAGES = {
  heroPreview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
  previewDashboard: 'https://images.unsplash.com/photo-1460925895917-afdab827c67f?w=800&q=80',
  previewBilling: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  previewPlans: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
};

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
    icon: '◆',
    title: 'Track Everything',
    desc: "Monitor all your subscriptions in one centralized dashboard. Never lose track of what you're paying for.",
  },
  {
    icon: '◇',
    title: 'Secure Payments',
    desc: 'Powered by Stripe, your payment information is always secure and encrypted. We never store your card details.',
  },
  {
    icon: '◈',
    title: 'Billing History',
    desc: 'Access your complete billing history anytime. Download invoices and track your spending patterns.',
  },
  {
    icon: '▷',
    title: 'Easy Management',
    desc: 'Subscribe, cancel, or update your plans with just a few clicks. No complicated processes.',
  },
  {
    icon: '◎',
    title: 'Stay Informed',
    desc: 'Get notified about upcoming renewals and payment status. Never miss an important update.',
  },
  {
    icon: '⬡',
    title: 'Reliable Service',
    desc: 'Built with modern technology and best practices. Your data is safe and your service is always available.',
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
  const [hoveredFeature, setHoveredFeature] = useState(null);

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
        <div className="lp-grid" aria-hidden="true" />
        <div className="lp-orbs">
          <motion.div
            className="lp-orb lp-orb-1"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="lp-orb lp-orb-2"
            animate={{
              x: [0, -25, 0],
              y: [0, 15, 0],
              scale: [1.1, 1, 1.1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="lp-orb lp-orb-3"
            animate={{
              x: [0, 20, 0],
              y: [0, 25, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="lp-glow-line lp-glow-line-1" />
        <div className="lp-glow-line lp-glow-line-2" />
      </div>

      <section className="hero-section">
        <div className={`container hero-container ${!showAuthForm ? 'hero-container--with-image' : ''}`}>
          <motion.div
            className="hero-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="hero-badge" variants={itemVariants}>
              <span className="hero-badge-dot" />
              <span className="hero-badge-text">Next‑gen subscription control</span>
            </motion.div>
            <motion.h1 className="hero-title" variants={itemVariants}>
              Manage Subscriptions
              <span className="gradient-text"> Effortlessly</span>
            </motion.h1>
            <motion.p className="hero-subtitle" variants={itemVariants}>
              One place to track, manage, and optimize recurring payments. <br className="hero-subtitle-break" />
              <span className="hero-subtitle-highlight">Secure, fast, built for the future.</span>
            </motion.p>

            <AnimatePresence mode="wait">
              {!showAuthForm ? (
                <>
                  <motion.div
                    className="hero-cta-wrap"
                    key="cta"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.button
                      type="button"
                      className="btn btn-primary btn-large lp-cta-btn"
                      onClick={handleGetStarted}
                      whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="lp-cta-text">Get Started Free</span>
                      <span className="lp-cta-arrow">→</span>
                    </motion.button>
                  </motion.div>
                  <motion.div
                    className="hero-visual"
                    key="hero-img"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="hero-image-wrap">
                      <div className="hero-image-glow" />
                      <img
                        src={IMAGES.heroPreview}
                        alt="Subscription dashboard overview"
                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGES.heroPreview; }}
                      />
                    </div>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  key="auth"
                  className="auth-form-container"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
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
        </div>
      </section>

      {!showAuthForm && (
        <section className="lp-preview-section">
          <div className="container">
            <motion.h2
              className="section-title lp-preview-title"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-title-accent">//</span> See It In Action
            </motion.h2>
            <div className="lp-preview-grid">
              {[
                { key: 'dashboard', src: IMAGES.previewDashboard, fallback: FALLBACK_IMAGES.previewDashboard, alt: 'Dashboard view', caption: 'Unified dashboard' },
                { key: 'billing', src: IMAGES.previewBilling, fallback: FALLBACK_IMAGES.previewBilling, alt: 'Billing & invoices', caption: 'Billing history' },
                { key: 'plans', src: IMAGES.previewPlans, fallback: FALLBACK_IMAGES.previewPlans, alt: 'Plans & pricing', caption: 'Plans & upgrades' },
              ].map((item, index) => (
                <motion.div
                  key={item.key}
                  className="lp-preview-card"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                >
                  <div className="lp-preview-card-img">
                    <img
                      src={item.src}
                      alt={item.alt}
                      onError={(e) => { e.target.onerror = null; e.target.src = item.fallback; }}
                    />
                  </div>
                  <p className="lp-preview-card-caption">{item.caption}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="features-section">
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-title-accent">//</span> Why Choose Us
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
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <motion.div
                  className="feature-icon"
                  animate={{
                    scale: hoveredFeature === index ? 1.2 : 1,
                    rotate: hoveredFeature === index ? 180 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {feature.icon}
                </motion.div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <div className="feature-card-edge" />
                <div className="feature-card-shine" />
              </motion.div>
            ))}
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
            <p>Join thousands managing subscriptions with clarity and control.</p>
            {!showAuthForm && (
              <motion.button
                type="button"
                className="btn btn-primary btn-large lp-cta-btn"
                onClick={handleGetStarted}
                whileHover={{ scale: 1.04, boxShadow: '0 0 48px rgba(59, 130, 246, 0.45)' }}
                whileTap={{ scale: 0.98 }}
              >
                Start Managing Now
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2026 Subscription Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;