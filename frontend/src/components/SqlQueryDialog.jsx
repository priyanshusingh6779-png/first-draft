import React from 'react';

const SqlQueryDialog = ({ isOpen, onClose, query, working }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Database Operation (SQL)</h2>
          <button onClick={onClose} style={styles.closeButton}>&times;</button>
        </div>
        <div style={styles.content}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Executed Query:</h3>
            <pre style={styles.code}>
              <code>{query}</code>
            </pre>
          </div>
          {working && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Working / Context:</h3>
              <p style={styles.text}>{working}</p>
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.doneButton}>Close</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
    border: '1px solid #333',
    color: '#fff',
    animation: 'slideUp 0.3s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #333',
    paddingBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#60a5fa',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '4px',
  },
  content: {
    marginBottom: '24px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  code: {
    backgroundColor: '#000',
    padding: '16px',
    borderRadius: '8px',
    overflowX: 'auto',
    border: '1px solid #444',
    fontFamily: '"Fira Code", monospace',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    color: '#34d399',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  text: {
    color: '#d1d5db',
    lineHeight: '1.6',
    fontSize: '0.95rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  doneButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default SqlQueryDialog;
