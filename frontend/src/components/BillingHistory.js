import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './BillingHistory.css';

const API_URL = ' https://subscription-management-task.onrender.com';

function BillingHistory({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.stripeCustomerId) {
      fetchBillingData();
    } else {
      setLoading(false);
    }
  }, [user?.stripeCustomerId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      };

      const [historyRes, upcomingRes] = await Promise.all([
        axios.get(`${API_URL}/invoices/history/${user.stripeCustomerId}`, { headers }),
        axios.get(`${API_URL}/invoices/upcoming/${user.stripeCustomerId}`, { headers }).catch((err) => {
          console.warn('Could not fetch upcoming invoice:', err.response?.data?.error || err.message);
          return null;
        })
      ]);

      setInvoices(historyRes.data.invoices || []);

      if (upcomingRes?.data?.upcomingInvoice) {
        setUpcomingInvoice(upcomingRes.data.upcomingInvoice);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err.response?.data?.error || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'paid' ? 'status-active' : 'status-past_due';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Loading billing history...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="billing-history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h2>Billing History</h2>
        <p>View your invoices and upcoming payments</p>
      </div>

      {upcomingInvoice && (
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3 style={{ marginBottom: '20px' }}>Upcoming Invoice</h3>
          <div className="subscription-info">
            <div className="info-card">
              <div className="info-card-label">Amount Due</div>
              <div className="info-card-value">
                {formatCurrency(upcomingInvoice.amountDue, upcomingInvoice.currency)}
              </div>
            </div>
            {upcomingInvoice.nextPaymentAttempt && (
              <div className="info-card">
                <div className="info-card-label">Next Payment Date</div>
                <div className="info-card-value">
                  {formatDate(upcomingInvoice.nextPaymentAttempt)}
                </div>
              </div>
            )}
            <div className="info-card">
              <div className="info-card-label">Period End</div>
              <div className="info-card-value">
                {formatDate(upcomingInvoice.periodEnd)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!upcomingInvoice && (
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ backgroundColor: 'var(--card-background)', padding: '20px', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>No active subscription found</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Subscribe to a plan to see upcoming invoices
          </p>
        </motion.div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Invoice History</h3>
        {error && <div className="error-message">{error}</div>}

        {invoices.length === 0 ? (
          <div className="empty-state">
            <p>No invoices found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{formatDate(invoice.paidAt || invoice.createdAt)}</td>
                  <td>{formatCurrency(invoice.amountPaid, invoice.currency)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>
                    {invoice.hostedInvoiceUrl && (
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '14px', textDecoration: 'none' }}
                      >
                        View Invoice
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

export default BillingHistory;

