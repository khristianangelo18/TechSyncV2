//frontend/src/pages/learns.js

import React, { useState, useEffect } from 'react';
import { Search, BookMarked, ExternalLink, Clock, TrendingUp, Filter, X, Globe, Zap, Atom, Code, Monitor, GraduationCap, BookOpen, Laptop } from 'lucide-react';
import PersonalLearnings from '../pages/PersonalLearnings';

const Learns = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showPersonalLearnings, setShowPersonalLearnings] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const popularTags = [
    { id: 'all', name: 'All Topics', icon: Globe },
    { id: 'javascript', name: 'JavaScript', icon: Zap },
    { id: 'react', name: 'React', icon: Atom },
    { id: 'python', name: 'Python', icon: Code },
    { id: 'webdev', name: 'Web Dev', icon: Monitor },
    { id: 'beginners', name: 'Beginners', icon: GraduationCap },
    { id: 'tutorial', name: 'Tutorials', icon: BookOpen },
    { id: 'programming', name: 'Programming', icon: Laptop }
  ];

  useEffect(() => {
    // Get current user from localStorage or your auth context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tag = selectedTag === 'all' ? '' : `&tag=${selectedTag}`;
        const response = await fetch(`https://dev.to/api/articles?per_page=20${tag}&top=7`);
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!showPersonalLearnings) {
      fetchData();
    }
  }, [selectedTag, showPersonalLearnings]);

  const toggleBookmark = (article) => {
    const isBookmarked = bookmarkedArticles.some(b => b.id === article.id);
    let updated;
    
    if (isBookmarked) {
      updated = bookmarkedArticles.filter(b => b.id !== article.id);
    } else {
      updated = [...bookmarkedArticles, article];
    }
    
    setBookmarkedArticles(updated);
  };

  const filteredArticles = (showBookmarked ? bookmarkedArticles : articles).filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatReadTime = (minutes) => {
    return `${minutes} min read`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1116',
      color: '#fff',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {showPersonalLearnings ? (
        // Personal Learnings Page
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#fff'
              }}>
                My Personal Learnings
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
                Your saved learning resources from challenges
              </p>
            </div>
            <button
              onClick={() => setShowPersonalLearnings(false)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#60a5fa',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#60a5fa';
              }}
            >
              ← Back to Resources
            </button>
          </div>

          {/* Personal Learnings Component */}
          {currentUser && currentUser.id && (
            <PersonalLearnings userId={currentUser.id} />
          )}
        </div>
      ) : (
        // Original Learning Resources Page
        <>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Learning Resources
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
              Discover tutorials, articles, and guides to level up your skills
            </p>
          </div>
          <button
            onClick={() => setShowPersonalLearnings(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#a78bfa',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#8b5cf6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a78bfa';
            }}
          >
            My personal learnings →
          </button>
        </div>

        {/* Search and Filter Section */}
        <div style={{
          backgroundColor: '#1a1d24',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #2d3748'
        }}>
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: '1.5rem',
            width: '100%'
          }}>
            <Search style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              width: '20px',
              height: '20px',
              pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 3rem 0.75rem 3rem',
                backgroundColor: '#0F1116',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Tags */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: '0.9rem'
            }}>
              <Filter size={16} />
              <span>Filter by:</span>
            </div>
            {popularTags.map(tag => {
              const IconComponent = tag.icon;
              return (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedTag === tag.id ? '#3b82f6' : '#2d3748',
                  color: selectedTag === tag.id ? '#fff' : '#d1d5db',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedTag !== tag.id) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTag !== tag.id) {
                    e.currentTarget.style.backgroundColor = '#2d3748';
                  }
                }}
              >
                <IconComponent size={16} />
                {tag.name}
              </button>
            )})}
          </div>

          {/* View Toggle */}
          <button
            onClick={() => setShowBookmarked(!showBookmarked)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: showBookmarked ? '#8b5cf6' : '#2d3748',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <BookMarked size={16} />
            {showBookmarked ? 'Show All Articles' : `Bookmarked (${bookmarkedArticles.length})`}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
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
        )}

        {/* Articles Grid */}
        {!loading && (
          <>
            {filteredArticles.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#6b7280'
              }}>
                <BookMarked size={48} style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {showBookmarked ? 'No bookmarked articles yet' : 'No articles found'}
                </h3>
                <p>
                  {showBookmarked 
                    ? 'Start bookmarking articles to save them for later'
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredArticles.map(article => {
                  const isBookmarked = bookmarkedArticles.some(b => b.id === article.id);
                  
                  return (
                    <div
                      key={article.id}
                      style={{
                        backgroundColor: '#1a1d24',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid #2d3748',
                        transition: 'all 0.3s',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#2d3748';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Cover Image */}
                      {article.cover_image && (
                        <div style={{
                          width: '100%',
                          height: '200px',
                          backgroundColor: '#2d3748',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={article.cover_image}
                            alt={article.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Tags */}
                        {article.tag_list && article.tag_list.length > 0 && (
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            marginBottom: '1rem'
                          }}>
                            {article.tag_list.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  backgroundColor: '#2d3748',
                                  color: '#60a5fa',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Title */}
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          marginBottom: '0.75rem',
                          color: '#fff',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {article.title}
                        </h3>

                        {/* Description */}
                        {article.description && (
                          <p style={{
                            color: '#9ca3af',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            marginBottom: '1rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flex: 1
                          }}>
                            {article.description}
                          </p>
                        )}

                        {/* Meta Information */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '1rem',
                          borderTop: '1px solid #2d3748',
                          marginTop: 'auto'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={14} />
                              {formatReadTime(article.reading_time_minutes)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <TrendingUp size={14} />
                              {article.positive_reactions_count}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {/* Bookmark Button */}
                            <button
                              onClick={() => toggleBookmark(article)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: isBookmarked ? '#8b5cf6' : '#2d3748',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <BookMarked size={16} fill={isBookmarked ? '#fff' : 'none'} />
                            </button>

                            {/* Read Button */}
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563eb';
                                e.currentTarget.style.transform = 'translateX(2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#3b82f6';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              Read
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>

                        {/* Author & Date */}
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid #2d3748',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <img
                            src={article.user.profile_image_90}
                            alt={article.user.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%'
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#fff' }}>
                              {article.user.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {formatDate(article.published_at)}
                            </div>
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
      </div>
        </>
      )}
    </div>
  );
};

export default Learns;