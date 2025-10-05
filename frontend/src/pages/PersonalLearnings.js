// frontend/src/pages/PersonalLearnings.js
import React, { useState, useEffect } from 'react';
import { BookOpen, Youtube, Github, ExternalLink, Trash2, Clock, Star, GraduationCap } from 'lucide-react';

const PersonalLearnings = ({ userId }) => {
  const [learnings, setLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState(new Set());

  useEffect(() => {
    if (userId) {
      fetchLearnings();
      fetchEnrollments();
    }
  }, [userId]);

  const fetchEnrollments = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/courses/my-courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.enrollments) {
        // Create a Set of enrolled course IDs
        const enrolledCourseIds = new Set(
          data.enrollments.map(enrollment => enrollment.course_id)
        );
        setEnrollments(enrolledCourseIds);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  };

  const fetchLearnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
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

  const handleCourseClick = (resource) => {
    const courseId = getCourseId(resource);
    if (courseId && isInternalCourse(resource)) {
      // Navigate to course learn page
      window.location.href = `/courses/${courseId}/learn`;
    } else if (resource?.url) {
      // Open external resource in new tab
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getProviderIcon = (provider) => {
    switch(provider?.toLowerCase()) {
      case 'youtube': return <Youtube size={16} />;
      case 'github': return <Github size={16} />;
      case 'internal_course': return <GraduationCap size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  const getProviderColor = (provider) => {
    const colors = {
      'youtube': '#ff0000',
      'github': '#333',
      'dev.to': '#0a0a23',
      'freecodecamp': '#0a0a23',
      'internal_course': '#3b82f6'
    };
    return colors[provider?.toLowerCase()] || '#3b82f6';
  };

  const getProviderBadgeStyle = (provider) => {
    if (provider?.toLowerCase() === 'internal_course') {
      return {
        backgroundColor: '#3b82f615',
        color: '#3b82f6',
        border: '1px solid #3b82f6'
      };
    }
    return {
      backgroundColor: `${getProviderColor(provider)}15`,
      color: getProviderColor(provider)
    };
  };

  const isInternalCourse = (resource) => {
    return resource?.provider?.toLowerCase() === 'internal_course';
  };

  const getCourseId = (resource) => {
    // Extract course ID from URL like "/courses/abc-123/learn"
    if (resource?.url && isInternalCourse(resource)) {
      const match = resource.url.match(/\/courses\/([^\/]+)/);
      return match ? match[1] : null;
    }
    return resource?.courseId || null;
  };

  const isEnrolled = (resource) => {
    const courseId = getCourseId(resource);
    return courseId && enrollments.has(courseId);
  };

  const getButtonText = (resource) => {
    if (isInternalCourse(resource)) {
      return isEnrolled(resource) ? 'Go to Course' : 'View Resource';
    }
    return 'View Resource';
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
            const isCourse = isInternalCourse(resource);
            const enrolled = isEnrolled(resource);
            
            return (
              <div 
                key={learning.id} 
                style={{
                  ...styles.card,
                  ...(isCourse ? styles.courseCard : {})
                }}
              >
                <div style={{
                  ...styles.providerBadge,
                  ...getProviderBadgeStyle(provider)
                }}>
                  {getProviderIcon(provider)}
                  <span style={{ textTransform: 'uppercase' }}>
                    {isCourse ? 'COURSE' : provider}
                  </span>
                </div>

                {learning.difficulty && (
                  <div style={styles.difficultyBadge}>
                    {learning.difficulty}
                  </div>
                )}

                {/* Course Icon for internal courses */}
                {isCourse && resource.icon && (
                  <div style={styles.courseIcon}>
                    {resource.icon}
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

                {/* Course metadata */}
                {isCourse && (
                  <div style={styles.courseMeta}>
                    {resource.duration && (
                      <span style={styles.metaItem}>
                        <Clock size={14} />
                        {resource.duration}
                      </span>
                    )}
                    {resource.lessonCount && (
                      <span style={styles.metaItem}>
                        <BookOpen size={14} />
                        {resource.lessonCount} lessons
                      </span>
                    )}
                  </div>
                )}

                {/* Regular resource metadata */}
                {!isCourse && (
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
                )}

                <div style={styles.savedInfo}>
                  Saved {new Date(learning.savedAt).toLocaleDateString()}
                </div>

                <div style={styles.cardActions}>
                  {isCourse ? (
                    <button
                      onClick={() => handleCourseClick(resource)}
                      style={{
                        ...styles.viewButton,
                        ...(enrolled ? styles.enrolledButton : {})
                      }}
                    >
                      {enrolled ? (
                        <GraduationCap size={16} />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      {getButtonText(resource)}
                    </button>
                  ) : (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewButton}
                    >
                      <ExternalLink size={16} />
                      View Resource
                    </a>
                  )}
                  <button
                    onClick={() => handleRemove(learning.id)}
                    style={styles.removeButton}
                    title="Remove from saved resources"
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
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    gap: '2rem',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#9ca3af',
    margin: 0
  },
  statsContainer: {
    display: 'flex',
    gap: '1rem'
  },
  statBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    backgroundColor: '#1a1d24',
    borderRadius: '12px',
    border: '1px solid #2d3748'
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
    minHeight: '400px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #2d3748',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '1rem',
    color: '#9ca3af'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#1a1d24',
    borderRadius: '12px',
    border: '1px solid #dc2626'
  },
  errorText: {
    color: '#dc2626',
    marginBottom: '1rem'
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#1a1d24',
    borderRadius: '12px',
    border: '1px solid #2d3748'
  },
  emptyTitle: {
    fontSize: '1.5rem',
    color: 'white',
    margin: '1rem 0'
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '1rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: '#1a1d24',
    borderRadius: '12px',
    border: '1px solid #2d3748',
    padding: '1.5rem',
    transition: 'all 0.2s'
  },
  courseCard: {
    border: '2px solid #3b82f6',
    backgroundColor: '#1a1d24'
  },
  providerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '1rem'
  },
  difficultyBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: '#3b82f615',
    color: '#3b82f6',
    textTransform: 'capitalize',
    marginLeft: '0.5rem',
    marginBottom: '1rem'
  },
  courseIcon: {
    fontSize: '2.5rem',
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
  courseMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #334155'
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
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  enrolledButton: {
    backgroundColor: '#10b981'
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