// frontend/src/pages/Learns.js - Updated to hide public courses display
// Courses only visible via recommendations and personal learnings

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BookMarked, ExternalLink, Clock, TrendingUp, 
  PlayCircle, CheckCircle, Lock, Award, Code, Globe, 
  BookOpen, Laptop, Users, Star, ChevronRight
} from 'lucide-react';
import PersonalLearnings from '../pages/PersonalLearnings';
import { useAuth } from '../contexts/AuthContext';

const Learns = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resources'); // Changed default from 'courses' to 'resources'
  
  // External resources
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch Dev.to articles for external resources
  useEffect(() => {
    const fetchArticles = async () => {
      if (activeTab === 'resources') {
        setLoadingArticles(true);
        try {
          const response = await fetch('https://dev.to/api/articles?per_page=12&top=7');
          const data = await response.json();
          setArticles(data);
        } catch (error) {
          console.error('Error fetching articles:', error);
        } finally {
          setLoadingArticles(false);
        }
      }
    };
    fetchArticles();
  }, [activeTab]);

  const toggleBookmark = (article) => {
    const isBookmarked = bookmarkedArticles.some(b => b.id === article.id);
    setBookmarkedArticles(isBookmarked 
      ? bookmarkedArticles.filter(b => b.id !== article.id)
      : [...bookmarkedArticles, article]
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1116',
      color: '#fff',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Learning Hub
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
            Master new skills with curated resources and personalized recommendations
          </p>
        </div>

        {/* Tab Navigation - REMOVED Interactive Courses Tab */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #2d3748'
        }}>
          {[
            { id: 'resources', label: 'External Resources', icon: ExternalLink },
            { id: 'my-learnings', label: 'My Learnings', icon: BookMarked }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? '#60a5fa' : '#9ca3af',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #60a5fa' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* External Resources Tab */}
        {activeTab === 'resources' && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#fff',
                margin: 0
              }}>
                Trending Developer Articles
              </h2>
            </div>

            {loadingArticles ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  display: 'inline-block',
                  width: '50px',
                  height: '50px',
                  border: '4px solid #2d3748',
                  borderTop: '4px solid #60a5fa',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {articles.map((article) => {
                  const isBookmarked = bookmarkedArticles.some(b => b.id === article.id);
                  
                  return (
                    <div
                      key={article.id}
                      style={{
                        backgroundColor: '#1a1d24',
                        borderRadius: '12px',
                        border: '1px solid #2d3748',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
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
                      {article.cover_image && (
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginBottom: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          {article.tag_list.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#60a5fa20',
                                color: '#60a5fa',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          marginBottom: '0.75rem',
                          color: '#fff',
                          lineHeight: '1.4'
                        }}>
                          {article.title}
                        </h3>

                        <p style={{
                          fontSize: '0.875rem',
                          color: '#9ca3af',
                          marginBottom: '1rem',
                          lineHeight: '1.5'
                        }}>
                          {article.description}
                        </p>

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
                            gap: '1rem',
                            fontSize: '0.875rem',
                            color: '#6b7280'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={14} />
                              {article.reading_time_minutes} min
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Star size={14} />
                              {article.positive_reactions_count}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(article);
                              }}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: isBookmarked ? '#8b5cf6' : '#2d3748',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#fff'
                              }}
                            >
                              <BookMarked size={16} fill={isBookmarked ? '#fff' : 'none'} />
                            </button>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#60a5fa',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#fff',
                                display: 'flex',
                                textDecoration: 'none'
                              }}
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* My Learnings Tab */}
        {activeTab === 'my-learnings' && (
          <>
            {isAuthenticated && user && user.id ? (
              <PersonalLearnings userId={user.id} />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#1a1d24',
                borderRadius: '12px',
                border: '1px solid #2d3748'
              }}>
                <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
                  Please log in to view your personal learnings.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Learns;