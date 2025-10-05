// frontend/src/components/PersonalLearnings.js
import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, Clock, TrendingUp, Star, Trash2, Youtube, Github, Filter, Calendar } from 'lucide-react';

const PersonalLearnings = ({ userId }) => {
  const [learnings, setLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    fetchPersonalLearnings();
    fetchLanguages();
  }, [userId]);

  const fetchPersonalLearnings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendations/personal-learnings/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLearnings(data.learnings);
      }
    } catch (error) {
      console.error('Error fetching personal learnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/onboarding/languages');
      const data = await response.json();
      if (data.success) {
        setLanguages(data.languages);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const removeResource = async (activityId) => {
    if (!window.confirm('Are you sure you want to remove this resource from your learnings?')) {
      return;
    }

    try {
      const response = await fetch(`/api/recommendations/personal-learnings/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setLearnings(prev => prev.filter(l => l.id !== activityId));
      }
    } catch (error) {
      console.error('Error removing resource:', error);
    }
  };

  const getProviderIcon = (provider) => {
    switch(provider) {
      case 'youtube': return <Youtube size={16} color="#ff0000" />;
      case 'github': return <Github size={16} color="#f0f6fc" />;
      default: return <BookOpen size={16} color="#60a5fa" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredLearnings = selectedLanguage === 'all' 
    ? learnings 
    : learnings.filter(l => l.languageId === parseInt(selectedLanguage));

  const groupedByDifficulty = filteredLearnings.reduce((acc, learning) => {
    const difficulty = learning.difficulty || 'other';
    if (!acc[difficulty]) acc[difficulty] = [];
    acc[difficulty].push(learning);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          border: '4px solid #2d3748',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#1a1d24',
          border: '1px solid #2d3748',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Total Resources
          </div>
          <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
            {learnings.length}
          </div>
        </div>

        {Object.keys(groupedByDifficulty).map(difficulty => (
          <div
            key={difficulty}
            style={{
              backgroundColor: '#1a1d24',
              border: '1px solid #2d3748',
              borderRadius: '12px',
              padding: '1.5rem'
            }}
          >
            <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
              {difficulty}
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {groupedByDifficulty[difficulty].length}
            </div>
          </div>
        ))}
      </div>

      {/* Language Filter */}
      <div style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #2d3748',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#9ca3af',
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}>
          <Filter size={16} />
          <span>Filter by Language:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedLanguage('all')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedLanguage === 'all' ? '#3b82f6' : '#2d3748',
              color: selectedLanguage === 'all' ? '#fff' : '#d1d5db',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            All Languages
          </button>
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => setSelectedLanguage(lang.id.toString())}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedLanguage === lang.id.toString() ? '#3b82f6' : '#2d3748',
                color: selectedLanguage === lang.id.toString() ? '#fff' : '#d1d5db',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resources List */}
      {filteredLearnings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <BookOpen size={48} style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>
            No saved resources yet
          </h3>
          <p>
            When you encounter challenges, save recommended resources to build your personal learning library
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredLearnings.map(learning => {
            const resource = learning.resource;
            return (
              <div
                key={learning.id}
                style={{
                  backgroundColor: '#1a1d24',
                  border: '1px solid #2d3748',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2d3748';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Delete Button */}
                <button
                  onClick={() => removeResource(learning.id)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem',
                    backgroundColor: '#2d3748',
                    color: '#9ca3af',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d3748';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <Trash2 size={16} />
                </button>

                {/* Provider Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#2d3748',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  {getProviderIcon(resource.provider)}
                  {resource.provider}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '0.75rem',
                  lineHeight: '1.4',
                  paddingRight: '2rem'
                }}>
                  {resource.title}
                </h3>

                {/* Description */}
                {resource.description && (
                  <p style={{
                    color: '#9ca3af',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {resource.description}
                  </p>
                )}

                {/* Metadata */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {resource.readTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} />
                      {resource.readTime} min
                    </div>
                  )}
                  {resource.reactions && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingUp size={14} />
                      {resource.reactions}
                    </div>
                  )}
                  {resource.stars && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={14} />
                      {resource.stars.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {resource.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#2d3748',
                          color: '#60a5fa',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #2d3748'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#6b7280',
                    fontSize: '0.85rem'
                  }}>
                    <Calendar size={14} />
                    {formatDate(learning.savedAt)}
                  </div>

                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    Open
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonalLearnings;