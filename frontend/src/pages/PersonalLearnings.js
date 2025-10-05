// frontend/src/pages/PersonalLearnings.js
import React, { useState, useEffect } from 'react';
import { BookOpen, Youtube, Github, ExternalLink, Trash2, Clock, Star } from 'lucide-react';

const PersonalLearnings = ({ userId }) => {
  const [learnings, setLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchLearnings();
    }
  }, [userId]);

  const fetchLearnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      // FIXED: Include userId in the URL path
      const response = await fetch(`${API_URL}/recommendations/personal-learnings/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setLearnings(data.learnings || []);
      } else {
        setError(data.error || 'Failed to load saved resources');
      }
    } catch (err) {
      console.error('Error fetching learnings:', err);
      setError('Failed to load saved resources');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (activityId) => {
    if (!window.confirm('Are you sure you want to remove this resource?'))
      return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/recommendations/personal-learnings/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setLearnings(learnings.filter(l => l.id !== activityId));
      }
    } catch (err) {
      console.error('Error removing learning:', err);
      alert('Failed to remove resource');
    }
  };

  const getProviderIcon = (provider) => {
    switch(provider?.toLowerCase()) {
      case 'youtube': return <Youtube size={16} />;
      case 'github': return <Github size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  const getProviderColor = (provider) => {
    const colors = {
      'youtube': '#ff0000',
      'github': '#333',
      'dev.to': '#0a0a23',
      'freecodecamp': '#0a0a23'
    };
    return colors[provider?.toLowerCase()] || '#3b82f6';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading your saved resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={fetchLearnings} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Personal Learnings</h1>
          <p style={styles.subtitle}>
            Resources you've saved to help improve your skills
          </p>
        </div>
        <div style={styles.statsContainer}>
          <div style={styles.statBox}>
            <BookOpen size={24} color="#3b82f6" />
            <div>
              <div style={styles.statNumber}>{learnings.length}</div>
              <div style={styles.statLabel}>Saved Resources</div>
            </div>
          </div>
        </div>
      </div>

      {learnings.length === 0 ? (
        <div style={styles.emptyState}>
          <BookOpen size={64} color="#6b7280" />
          <h2 style={styles.emptyTitle}>No saved resources yet</h2>
          <p style={styles.emptyText}>
            When you encounter challenge failures, you can save recommended resources to revisit later.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {learnings.map((learning) => {
            const resource = learning.resource || {};
            const provider = resource.provider || 'unknown';
            
            return (
              <div key={learning.id} style={styles.card}>
                <div style={{
                  ...styles.providerBadge,
                  backgroundColor: `${getProviderColor(provider)}15`,
                  color: getProviderColor(provider)
                }}>
                  {getProviderIcon(provider)}
                  <span>{provider}</span>
                </div>

                {learning.difficulty && (
                  <div style={styles.difficultyBadge}>
                    {learning.difficulty}
                  </div>
                )}

                <h3 style={styles.resourceTitle}>
                  {resource.title || 'Untitled Resource'}
                </h3>

                {resource.description && (
                  <p style={styles.resourceDescription}>
                    {resource.description.length > 150 
                      ? resource.description.substring(0, 150) + '...' 
                      : resource.description}
                  </p>
                )}

                <div style={styles.resourceMeta}>
                  {resource.author && (
                    <span style={styles.metaItem}>
                      By {resource.author}
                    </span>
                  )}
                  {resource.readTime && (
                    <span style={styles.metaItem}>
                      <Clock size={14} />
                      {resource.readTime} min
                    </span>
                  )}
                  {resource.reactions && (
                    <span style={styles.metaItem}>
                      <Star size={14} />
                      {resource.reactions}
                    </span>
                  )}
                </div>

                <div style={styles.savedInfo}>
                  Saved {new Date(learning.savedAt).toLocaleDateString()}
                </div>

                <div style={styles.cardActions}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.viewButton}
                  >
                    <ExternalLink size={16} />
                    View Resource
                  </a>
                  <button
                    onClick={() => handleRemove(learning.id)}
                    style={styles.removeButton}
                    title="Remove from saved"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0f1a',
    color: 'white'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#9ca3af'
  },
  statsContainer: {
    display: 'flex',
    gap: '1rem'
  },
  statBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#1e293b',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid #334155'
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #334155',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: '1rem'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '1rem',
    textAlign: 'center'
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
    textAlign: 'center'
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginTop: '1rem'
  },
  emptyText: {
    fontSize: '1rem',
    color: '#9ca3af',
    maxWidth: '500px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'all 0.2s'
  },
  providerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1rem'
  },
  difficultyBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: '#3b82f615',
    color: '#3b82f6',
    textTransform: 'capitalize',
    marginLeft: '0.5rem',
    marginBottom: '1rem'
  },
  resourceTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'white',
    margin: '0 0 0.75rem 0',
    lineHeight: '1.4'
  },
  resourceDescription: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    lineHeight: '1.5',
    marginBottom: '1rem'
  },
  resourceMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #334155'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  savedInfo: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '1rem'
  },
  cardActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  viewButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  removeButton: {
    padding: '0.75rem',
    backgroundColor: '#dc262615',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default PersonalLearnings;