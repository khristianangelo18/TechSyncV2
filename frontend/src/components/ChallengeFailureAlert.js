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

  useEffect(() => {
    if (alertData?.shouldShow && effectiveChallengeId && effectiveLanguageId) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertData?.shouldShow, effectiveChallengeId, effectiveLanguageId]);

  const fetchRecommendations = async () => {
    // Validate required fields before making request
    if (!userId || !effectiveChallengeId || !effectiveLanguageId || !alertData?.attemptCount) {
      console.error('Missing required fields for recommendations:', {
        userId,
        effectiveChallengeId,
        effectiveLanguageId,
        attemptCount: alertData?.attemptCount
      });
      setLoadingRecs(false);
      return;
    }

    setLoadingRecs(true);
    try {
      const response = await fetch('/api/recommendations/challenge-failure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          challengeId: effectiveChallengeId,
          attemptCount: alertData.attemptCount,
          programmingLanguageId: effectiveLanguageId,
          difficultyLevel: effectiveDifficulty
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
        setRecommendationIds(data.metadata.recommendationIds);
        setMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const saveResource = async (resource, recommendationId) => {
    setSavingStates(prev => ({ ...prev, [recommendationId]: true }));
    
    try {
      // Track as clicked first
      await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          recommendationId,
          actionType: 'saved',
          timestamp: new Date().toISOString()
        })
      });

      // Save to personal learnings
      const response = await fetch('/api/recommendations/save-to-personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          recommendationId,
          resource: {
            title: resource.title,
            url: resource.url,
            description: resource.description,
            provider: resource.provider,
            author: resource.author,
            readTime: resource.readTime,
            reactions: resource.reactions,
            stars: resource.stars,
            tags: resource.tags,
            coverImage: resource.coverImage,
            thumbnail: resource.thumbnail
          },
          languageId: effectiveLanguageId,
          difficulty: resource.difficulty || metadata?.recommendedDifficulty
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSavedResources(prev => ({ ...prev, [recommendationId]: true }));
        console.log('Resource saved successfully!');
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
          backgroundColor: '#1a1d24',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideIn 0.3s ease-out',
          border: '1px solid #2d3748'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem',
            borderRadius: '16px 16px 0 0',
            position: 'relative',
            textAlign: 'center'
          }}>
            <button 
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            >
              <X size={20} />
            </button>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💪</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: '0 0 0.5rem 0' }}>
              Keep Going!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', margin: 0 }}>
              Every expert was once a beginner
            </p>
          </div>
          
          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
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
                <span style={{ fontSize: '1.25rem' }}>📊</span>
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
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2rem'
                }}>
                  <div style={{
                    border: '3px solid #2d3748',
                    borderTop: '3px solid #60a5fa',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite'
                  }} />
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
                            color: '#9ca3af',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            margin: '0 0 0.75rem 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {resource.description}
                          </p>
                        )}
                        
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
                          {resource.author && (
                            <div style={{ marginLeft: 'auto', color: '#9ca3af' }}>
                              by {resource.author}
                            </div>
                          )}
                        </div>

                        {resource.tags && resource.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {resource.tags.slice(0, 3).map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
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

                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid #2d3748'
                        }}>
                          <button
                            onClick={() => saveResource(resource, recId)}
                            disabled={isSaved || isSaving}
                            style={{
                              flex: 1,
                              padding: '0.625rem 1.25rem',
                              backgroundColor: isSaved ? '#10b981' : '#3b82f6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: isSaved || isSaving ? 'default' : 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s',
                              opacity: isSaving ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!isSaved && !isSaving) e.target.style.backgroundColor = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSaved && !isSaving) e.target.style.backgroundColor = '#3b82f6';
                            }}
                          >
                            {isSaving ? (
                              <>Saving...</>
                            ) : isSaved ? (
                              <>
                                <Check size={16} />
                                Saved to My Learnings
                              </>
                            ) : (
                              <>
                                <Save size={16} />
                                Save to My Learnings
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  <BookOpen size={32} style={{ margin: '0 auto 0.5rem' }} />
                  <p>Check out our Learning Resources page for tutorials and guides</p>
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