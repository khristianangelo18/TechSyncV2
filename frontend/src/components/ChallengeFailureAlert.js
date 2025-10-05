// frontend/src/components/ChallengeFailureAlert.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight, Target, Lightbulb, Youtube, Github, Star, TrendingUp, Clock, Save, Check } from 'lucide-react';

const ChallengeFailureAlert = ({ 
  alertData, 
  onClose, 
  onContinue, 
  projectTitle,
  challengeId,
  userId,
  challengeLanguage = 'javascript',
  programmingLanguageId,
  difficultyLevel = 'beginner'
}) => {
  // Use alertData fields as fallback if provided
  const effectiveChallengeId = challengeId || alertData?.challengeId;
  const effectiveLanguageId = programmingLanguageId || alertData?.programmingLanguageId;
  const effectiveDifficulty = difficultyLevel || alertData?.difficultyLevel || 'beginner';

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [recommendationIds, setRecommendationIds] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [savedResources, setSavedResources] = useState({});
  const [savingStates, setSavingStates] = useState({});
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    console.log('🎯 ChallengeFailureAlert useEffect triggered:', {
      'alertData?.shouldShow': alertData?.shouldShow,
      effectiveChallengeId,
      effectiveLanguageId,
      'alertData?.attemptCount': alertData?.attemptCount
    });

    if (alertData?.shouldShow && effectiveChallengeId && effectiveLanguageId) {
      console.log('✅ All conditions met, calling fetchRecommendations...');
      fetchRecommendations();
    } else {
      console.log('❌ Conditions NOT met, skipping fetch');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertData?.shouldShow, effectiveChallengeId, effectiveLanguageId]);

  const fetchRecommendations = async () => {
    // ✅ FIX: Validate required fields before making request
    // Don't validate userId - it comes from auth token
    if (!effectiveChallengeId || !effectiveLanguageId || !alertData?.attemptCount) {
      console.error('❌ Missing required fields for recommendations:', {
        effectiveChallengeId,
        effectiveLanguageId,
        attemptCount: alertData?.attemptCount
      });
      setLoadingRecs(false);
      return;
    }

    setLoadingRecs(true);
    setFetchError(null);
    try {
      console.log('📤 Sending recommendation request:', {
        challengeId: effectiveChallengeId,
        attemptCount: alertData.attemptCount,
        programmingLanguageId: effectiveLanguageId,
        difficultyLevel: effectiveDifficulty
      });

      // Add timeout to prevent endless loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Use full URL to ensure request reaches backend
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/recommendations/challenge-failure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          // ✅ FIX: Don't send userId - backend gets it from auth token
          challengeId: effectiveChallengeId,
          attemptCount: alertData.attemptCount,
          programmingLanguageId: effectiveLanguageId,
          difficultyLevel: effectiveDifficulty
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('❌ API error:', errorData);
        setFetchError(errorData.error || 'Failed to load recommendations');
        setRecommendations([]);
        setLoadingRecs(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Received recommendations:', data);
      
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations);
        setRecommendationIds(data.metadata?.recommendationIds || []);
        setMetadata(data.metadata);
      } else {
        console.warn('No recommendations returned');
        setRecommendations([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout: Recommendations took too long to load');
        setFetchError('Request timed out. Please try again.');
      } else {
        console.error('❌ Error fetching recommendations:', error);
        setFetchError(error.message || 'Failed to load recommendations');
      }
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const saveResource = async (resource, recommendationId) => {
    setSavingStates(prev => ({ ...prev, [recommendationId]: true }));
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    try {
      // Track as clicked first
      await fetch(`${API_URL}/api/recommendations/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recommendationId,
          action: 'clicked'
        })
      });

      // Save to personal learnings
      const saveResponse = await fetch(`${API_URL}/api/recommendations/save-learning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recommendationId,
          resource,
          languageId: effectiveLanguageId,
          difficulty: metadata?.recommendedDifficulty || effectiveDifficulty
        })
      });

      if (saveResponse.ok) {
        setSavedResources(prev => ({ ...prev, [recommendationId]: true }));
      }
    } catch (error) {
      console.error('Error saving resource:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [recommendationId]: false }));
    }
  };

  if (!alertData || !alertData.shouldShow) {
    return null;
  }

  const { attemptCount, message } = alertData;

  const getProviderIcon = (provider) => {
    switch(provider) {
      case 'youtube': return <Youtube size={14} />;
      case 'github': return <Github size={14} />;
      case 'dev.to': return <BookOpen size={14} />;
      case 'freecodecamp': return <BookOpen size={14} />;
      default: return <BookOpen size={14} />;
    }
  };

  const getProviderStyle = (provider) => {
    const styles = {
      'youtube': { backgroundColor: '#ff000015', color: '#ff0000' },
      'github': { backgroundColor: '#23272915', color: '#f0f6fc' },
      'dev.to': { backgroundColor: '#0a0a2315', color: '#60a5fa' },
      'freecodecamp': { backgroundColor: '#0a0a2315', color: '#0a0a23' },
      'medium': { backgroundColor: '#00000015', color: '#ffffff' }
    };
    return styles[provider] || { backgroundColor: '#2d3748', color: '#60a5fa' };
  };

  const getSuggestions = (count) => {
    if (count >= 15) {
      return [
        { icon: Target, text: "Start with the fundamentals - review basic syntax and concepts" },
        { icon: BookOpen, text: "Follow a structured course or tutorial series" },
        { icon: Lightbulb, text: "Practice with simpler problems before returning to this challenge" },
        { icon: Target, text: "Join coding communities for peer support and guidance" }
      ];
    } else if (count >= 10) {
      return [
        { icon: Target, text: "Break the problem into smaller, manageable steps" },
        { icon: BookOpen, text: "Review documentation and examples in the same language" },
        { icon: Lightbulb, text: "Try solving similar but easier problems first" },
        { icon: Target, text: "Take notes on what's confusing you" }
      ];
    } else {
      return [
        { icon: Target, text: "Double-check your logic and edge cases" },
        { icon: BookOpen, text: "Review the challenge requirements carefully" },
        { icon: Lightbulb, text: "Test your code with simple inputs first" }
      ];
    }
  };

  const suggestions = getSuggestions(attemptCount);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '1rem'
      }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '20px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'slideIn 0.3s ease-out',
          border: '1px solid #334155'
        }}>
          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>💪</div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#fff',
                  margin: 0,
                  marginBottom: '0.5rem'
                }}>
                  Keep Going!
                </h2>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#94a3b8',
                  margin: 0
                }}>
                  Every expert was once a beginner
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1e293b';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#94a3b8';
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '0.75rem 1.25rem',
                borderRadius: '24px',
                fontSize: '0.95rem',
                fontWeight: '600',
                gap: '0.5rem'
              }}>
                <TrendingUp size={16} />
                {attemptCount} attempts - You're learning!
              </div>
              {metadata && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '24px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  gap: '0.5rem'
                }}>
                  <Target size={16} />
                  Recommended: {metadata.recommendedDifficulty}
                </div>
              )}
            </div>
            
            <div style={{
              fontSize: '1.05rem',
              lineHeight: '1.7',
              color: '#d1d5db',
              marginBottom: '2rem'
            }}>
              {message}
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Lightbulb size={24} color="#fbbf24" />
                Quick Tips
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '0.75rem'
              }}>
                {suggestions.map((suggestion, idx) => {
                  const IconComponent = suggestion.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#0f1116',
                        border: '1px solid #2d3748',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                      }}
                    >
                      <IconComponent size={20} color="#60a5fa" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                      <span style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {suggestion.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <BookOpen size={24} color="#a78bfa" />
                Recommended for You
              </h3>
              
              {loadingRecs ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '3rem 2rem',
                  gap: '1rem'
                }}>
                  <div style={{
                    border: '3px solid #2d3748',
                    borderTop: '3px solid #60a5fa',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    Finding the best resources for you...
                  </p>
                </div>
              ) : fetchError ? (
                <div style={{
                  backgroundColor: '#7f1d1d',
                  border: '1px solid #dc2626',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#fca5a5', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Couldn't load recommendations
                  </p>
                  <p style={{ color: '#fecaca', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {fetchError}
                  </p>
                  <button
                    onClick={() => {
                      setFetchError(null);
                      fetchRecommendations();
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                  >
                    Try Again
                  </button>
                </div>
              ) : recommendations.length > 0 ? (
                <div>
                  {recommendations.map((resource, idx) => {
                    const recId = recommendationIds[idx];
                    const isSaved = savedResources[recId];
                    const isSaving = savingStates[recId];
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#0f1116',
                          border: '1px solid #2d3748',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          marginBottom: '1rem',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2d3748'}
                      >
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          marginBottom: '0.75rem',
                          ...getProviderStyle(resource.provider)
                        }}>
                          {getProviderIcon(resource.provider)}
                          {resource.provider}
                        </div>

                        <h4 style={{
                          fontSize: '1.05rem',
                          fontWeight: '600',
                          color: '#fff',
                          margin: '0 0 0.75rem 0',
                          lineHeight: '1.4'
                        }}>
                          {resource.title}
                        </h4>

                        {resource.description && (
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#9ca3af',
                            margin: '0 0 1rem 0',
                            lineHeight: '1.5'
                          }}>
                            {resource.description.substring(0, 150)}
                            {resource.description.length > 150 ? '...' : ''}
                          </p>
                        )}

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          marginBottom: '1rem'
                        }}>
                          {resource.author && (
                            <span style={{
                              fontSize: '0.85rem',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              👤 {resource.author}
                            </span>
                          )}
                          {resource.readTime && (
                            <span style={{
                              fontSize: '0.85rem',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Clock size={14} />
                              {resource.readTime} min read
                            </span>
                          )}
                          {resource.reactions && (
                            <span style={{
                              fontSize: '0.85rem',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              ❤️ {resource.reactions}
                            </span>
                          )}
                          {resource.stars && (
                            <span style={{
                              fontSize: '0.85rem',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Star size={14} />
                              {resource.stars.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center'
                        }}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              padding: '0.75rem 1.25rem',
                              backgroundColor: '#3b82f6',
                              color: '#fff',
                              textDecoration: 'none',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              textAlign: 'center',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                          >
                            View Resource
                            <ChevronRight size={16} />
                          </a>
                          
                          <button
                            onClick={() => saveResource(resource, recId)}
                            disabled={isSaved || isSaving}
                            style={{
                              padding: '0.75rem',
                              backgroundColor: isSaved ? '#10b981' : '#1e293b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: isSaved ? 'default' : 'pointer',
                              transition: 'all 0.2s',
                              opacity: isSaving ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!isSaved) e.target.style.backgroundColor = '#334155';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSaved) e.target.style.backgroundColor = '#1e293b';
                            }}
                          >
                            {isSaving ? (
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid #fff',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.6s linear infinite'
                              }} />
                            ) : isSaved ? (
                              <Check size={16} />
                            ) : (
                              <Save size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#0f1116',
                  border: '1px solid #2d3748',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <BookOpen size={48} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '0.5rem' }}>
                    No recommendations available right now
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Try the tips above and keep practicing!
                  </p>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid #2d3748'
            }}>
              <button 
                onClick={onClose}
                style={{
                  padding: '0.875rem 1.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  backgroundColor: '#2d3748',
                  color: '#fff'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2d3748'}
              >
                Take a Break
              </button>
              <button 
                onClick={onContinue}
                style={{
                  padding: '0.875rem 1.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  backgroundColor: '#3b82f6',
                  color: '#fff'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Try Again
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChallengeFailureAlert;