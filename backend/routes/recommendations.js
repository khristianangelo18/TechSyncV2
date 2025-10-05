// backend/routes/recommendations.js - SUPABASE VERSION
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

// Multiple resource providers
const RESOURCE_PROVIDERS = {
  DEVTO: 'dev.to',
  YOUTUBE: 'youtube',
  FREECODECAMP: 'freecodecamp',
  GITHUB: 'github'
};

// Language-specific resource mapping
const LANGUAGE_RESOURCES = {
  javascript: {
    tags: ['javascript', 'webdev', 'react', 'nodejs'],
    youtube_queries: ['javascript tutorial', 'javascript fundamentals'],
    github_repos: ['javascript', 'awesome-javascript']
  },
  python: {
    tags: ['python', 'programming', 'datascience'],
    youtube_queries: ['python tutorial', 'python basics'],
    github_repos: ['python', 'awesome-python']
  },
  java: {
    tags: ['java', 'programming', 'springboot'],
    youtube_queries: ['java tutorial', 'java programming'],
    github_repos: ['java', 'awesome-java']
  },
  cpp: {
    tags: ['cpp', 'c++', 'programming'],
    youtube_queries: ['c++ tutorial', 'c++ programming'],
    github_repos: ['cpp', 'awesome-cpp']
  },
  react: {
    tags: ['react', 'javascript', 'frontend'],
    youtube_queries: ['react tutorial', 'react hooks'],
    github_repos: ['react', 'awesome-react']
  }
};

/**
 * Fetch resources from Dev.to
 */
async function fetchDevToResources(language, difficulty, limit = 3) {
  try {
    const tags = LANGUAGE_RESOURCES[language.toLowerCase()]?.tags || ['programming'];
    const tag = difficulty === 'beginner' ? 'beginners' : tags[0];
    
    const response = await axios.get(`https://dev.to/api/articles`, {
      params: {
        tag,
        per_page: limit * 2,
        top: 7
      }
    });

    return response.data.slice(0, limit).map(article => ({
      provider: RESOURCE_PROVIDERS.DEVTO,
      title: article.title,
      description: article.description,
      url: article.url,
      author: article.user.name,
      readTime: article.reading_time_minutes,
      reactions: article.positive_reactions_count,
      publishedAt: article.published_at,
      tags: article.tag_list,
      coverImage: article.cover_image,
      difficulty: difficulty
    }));
  } catch (error) {
    console.error('Error fetching Dev.to resources:', error.message);
    return [];
  }
}

/**
 * Fetch YouTube resources (requires YouTube API key)
 */
async function fetchYouTubeResources(language, difficulty, limit = 3) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const queries = LANGUAGE_RESOURCES[language.toLowerCase()]?.youtube_queries || ['programming tutorial'];
    const query = difficulty === 'beginner' 
      ? `${queries[0]} for beginners`
      : queries[0];

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: limit,
        order: 'relevance',
        key: apiKey,
        videoDuration: 'medium'
      }
    });

    return response.data.items.map(item => ({
      provider: RESOURCE_PROVIDERS.YOUTUBE,
      title: item.snippet.title,
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      author: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
      difficulty: difficulty
    }));
  } catch (error) {
    console.error('Error fetching YouTube resources:', error.message);
    return [];
  }
}

/**
 * Fetch FreeCodeCamp resources
 */
async function fetchFreeCodeCampResources(language, difficulty, limit = 2) {
  try {
    const response = await axios.get(`https://dev.to/api/articles`, {
      params: {
        username: 'freecodecamp',
        per_page: limit
      }
    });

    return response.data.map(article => ({
      provider: RESOURCE_PROVIDERS.FREECODECAMP,
      title: article.title,
      description: article.description,
      url: article.url,
      author: 'FreeCodeCamp',
      readTime: article.reading_time_minutes,
      publishedAt: article.published_at,
      difficulty: difficulty
    }));
  } catch (error) {
    console.error('Error fetching FreeCodeCamp resources:', error.message);
    return [];
  }
}

/**
 * Fetch GitHub repositories
 */
async function fetchGitHubResources(language, limit = 2) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];

  try {
    const repos = LANGUAGE_RESOURCES[language.toLowerCase()]?.github_repos || ['programming'];
    const query = `${repos[0]} tutorial stars:>1000`;

    const response = await axios.get('https://api.github.com/search/repositories', {
      params: {
        q: query,
        sort: 'stars',
        per_page: limit
      },
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return response.data.items.map(repo => ({
      provider: RESOURCE_PROVIDERS.GITHUB,
      title: repo.name,
      description: repo.description,
      url: repo.html_url,
      author: repo.owner.login,
      stars: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics
    }));
  } catch (error) {
    console.error('Error fetching GitHub resources:', error.message);
    return [];
  }
}

/**
 * Get aggregated resources from all providers
 */
async function getAggregatedResources(language, difficulty, attemptCount) {
  const resources = await Promise.all([
    fetchDevToResources(language, difficulty, 3),
    fetchYouTubeResources(language, difficulty, 2),
    fetchFreeCodeCampResources(language, difficulty, 1),
    fetchGitHubResources(language, 1)
  ]);

  const allResources = resources.flat();

  // Prioritize based on attempt count
  if (attemptCount >= 15) {
    return allResources
      .filter(r => r.provider === RESOURCE_PROVIDERS.YOUTUBE || r.provider === RESOURCE_PROVIDERS.FREECODECAMP)
      .slice(0, 6);
  } else if (attemptCount >= 10) {
    return allResources.slice(0, 6);
  } else {
    return allResources
      .filter(r => r.provider === RESOURCE_PROVIDERS.DEVTO || r.provider === RESOURCE_PROVIDERS.FREECODECAMP)
      .slice(0, 5);
  }
}

/**
 * POST /api/recommendations/challenge-failure
 * Generate and log recommendations for failed challenge attempts
 * 
 * FIX: Use req.user.id from authMiddleware instead of userId from body
 */
router.post('/challenge-failure', authMiddleware, async (req, res) => {
  try {
    // ✅ FIX: Get userId from authenticated user, not from request body
    const userId = req.user.id;
    
    const { 
      challengeId, 
      attemptCount, 
      programmingLanguageId,
      difficultyLevel 
    } = req.body;

    console.log('📊 Challenge failure request:', {
      userId,
      challengeId,
      attemptCount,
      programmingLanguageId,
      difficultyLevel
    });

    // Validate input
    if (!challengeId || !attemptCount || !programmingLanguageId) {
      console.error('❌ Missing required fields:', {
        challengeId: !!challengeId,
        attemptCount: !!attemptCount,
        programmingLanguageId: !!programmingLanguageId
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: challengeId, attemptCount, or programmingLanguageId'
      });
    }

    // 1. Get programming language details
    const { data: languageData, error: langError } = await supabase
      .from('programming_languages')
      .select('name')
      .eq('id', programmingLanguageId)
      .single();

    if (langError) {
      console.error('❌ Error fetching language:', langError);
      return res.status(500).json({ success: false, error: 'Failed to fetch language' });
    }

    const languageName = languageData?.name || 'javascript';
    console.log('✅ Language found:', languageName);

    // 2. Get user's proficiency level
    const { data: proficiencyData } = await supabase
      .from('user_skill_ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('programming_language_id', programmingLanguageId)
      .single();

    const userRating = proficiencyData?.rating || 1200;
    console.log('📈 User rating:', userRating);

    // 3. Determine recommended difficulty
    let recommendedDifficulty = 'beginner';
    if (attemptCount >= 15 || userRating < 1100) {
      recommendedDifficulty = 'beginner';
    } else if (attemptCount >= 10 || userRating < 1300) {
      recommendedDifficulty = 'intermediate';
    } else if (userRating >= 1500) {
      recommendedDifficulty = 'advanced';
    }

    console.log('🎯 Recommended difficulty:', recommendedDifficulty);

    // 4. Fetch resources from multiple providers
    const resources = await getAggregatedResources(
      languageName, 
      recommendedDifficulty, 
      attemptCount
    );

    console.log(`📚 Found ${resources.length} resources`);

    // 5. Log each recommendation
    const recommendationIds = [];
    for (const resource of resources) {
      const { data, error } = await supabase
        .from('learning_recommendations')
        .insert({
          user_id: userId,
          language_id: programmingLanguageId,
          tutorial_url: resource.url,
          tutorial_title: resource.title,
          difficulty_level: recommendedDifficulty,
          recommended_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (!error && data) {
        recommendationIds.push(data.id);
      }
    }

    console.log(`✅ Logged ${recommendationIds.length} recommendations`);

    // 6. Log user activity
    const { data: challengeData } = await supabase
      .from('coding_challenges')
      .select('project_id')
      .eq('id', challengeId)
      .single();

    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        project_id: challengeData?.project_id,
        activity_type: 'recommendation_received',
        activity_data: {
          challengeId,
          attemptCount,
          recommendationCount: resources.length,
          difficulty: recommendedDifficulty
        },
        created_at: new Date().toISOString()
      });

    console.log('✅ Recommendations generated successfully');

    res.json({
      success: true,
      recommendations: resources,
      metadata: {
        userRating,
        recommendedDifficulty,
        attemptCount,
        totalRecommendations: resources.length,
        recommendationIds
      }
    });

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate recommendations',
      message: error.message 
    });
  }
});

/**
 * POST /api/recommendations/feedback
 * Track user interaction with recommendations
 */
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { 
      userId, 
      recommendationId, 
      actionType,
      timeSpent,
      effectivenessScore
    } = req.body;

    // Update recommendation with feedback
    if (actionType === 'completed' && effectivenessScore) {
      await supabase
        .from('learning_recommendations')
        .update({
          completed_at: new Date().toISOString(),
          effectiveness_score: effectivenessScore
        })
        .eq('id', recommendationId);
    }

    // Log the feedback activity
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: 'recommendation_feedback',
        activity_data: {
          recommendationId,
          actionType,
          timeSpent,
          effectivenessScore
        },
        created_at: new Date().toISOString()
      });

    res.json({ success: true, message: 'Feedback recorded' });

  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record feedback' 
    });
  }
});

/**
 * POST /api/recommendations/save-learning
 * Save a resource to personal learnings
 */
router.post('/save-learning', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      recommendationId, 
      resource,
      languageId,
      difficulty 
    } = req.body;

    if (!recommendationId || !resource) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: recommendationId and resource'
      });
    }

    // Save to personal learnings table (using user_activity)
    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: 'saved_learning_resource',
        activity_data: {
          recommendationId,
          resource,
          languageId,
          difficulty,
          savedAt: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update the recommendation as viewed/clicked
    await supabase
      .from('learning_recommendations')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('id', recommendationId);

    res.json({
      success: true,
      message: 'Resource saved to personal learnings',
      savedResource: data
    });

  } catch (error) {
    console.error('Error saving to personal learnings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save resource' 
    });
  }
});

/**
 * GET /api/recommendations/analytics/:userId
 * Get recommendation analytics for a user
 */
router.get('/analytics/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { languageId, timeRange = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get recommendation statistics
    let query = supabase
      .from('learning_recommendations')
      .select(`
        *,
        programming_languages(name)
      `)
      .eq('user_id', userId)
      .gte('recommended_at', startDate.toISOString());

    if (languageId) {
      query = query.eq('language_id', languageId);
    }

    const { data: recommendations, error } = await query;

    if (error) throw error;

    // Process statistics
    const stats = {};
    recommendations.forEach(rec => {
      const key = `${rec.programming_languages.name}-${rec.difficulty_level}`;
      if (!stats[key]) {
        stats[key] = {
          language_name: rec.programming_languages.name,
          difficulty_level: rec.difficulty_level,
          total_recommendations: 0,
          completed_count: 0,
          effectiveness_scores: []
        };
      }
      stats[key].total_recommendations++;
      if (rec.completed_at) stats[key].completed_count++;
      if (rec.effectiveness_score) stats[key].effectiveness_scores.push(rec.effectiveness_score);
    });

    const statistics = Object.values(stats).map(stat => ({
      ...stat,
      avg_effectiveness: stat.effectiveness_scores.length > 0
        ? stat.effectiveness_scores.reduce((a, b) => a + b, 0) / stat.effectiveness_scores.length
        : null
    }));

    // Get most effective resources
    const mostEffective = recommendations
      .filter(r => r.effectiveness_score)
      .sort((a, b) => b.effectiveness_score - a.effectiveness_score)
      .slice(0, 10)
      .map(r => ({
        tutorial_title: r.tutorial_title,
        tutorial_url: r.tutorial_url,
        difficulty_level: r.difficulty_level,
        effectiveness_score: r.effectiveness_score,
        completed_at: r.completed_at,
        language_name: r.programming_languages.name
      }));

    // Get patterns (simplified)
    const patterns = [];
    const last7Days = 7;
    for (let i = 0; i < last7Days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayRecs = recommendations.filter(r => {
        const recDate = new Date(r.recommended_at);
        return recDate >= dayStart && recDate <= dayEnd;
      });

      patterns.push({
        date: dayStart.toISOString(),
        recommendation_count: dayRecs.length,
        completion_count: dayRecs.filter(r => r.completed_at).length
      });
    }

    res.json({
      success: true,
      analytics: {
        statistics,
        mostEffective,
        patterns: patterns.reverse()
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics' 
    });
  }
});

/**
 * GET /api/recommendations/user-history/:userId
 * Get user's recommendation history
 */
router.get('/user-history/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('learning_recommendations')
      .select(`
        *,
        programming_languages(name)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('recommended_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    const recommendations = data.map(rec => ({
      id: rec.id,
      tutorial_title: rec.tutorial_title,
      tutorial_url: rec.tutorial_url,
      difficulty_level: rec.difficulty_level,
      recommended_at: rec.recommended_at,
      completed_at: rec.completed_at,
      effectiveness_score: rec.effectiveness_score,
      language_name: rec.programming_languages.name
    }));

    res.json({
      success: true,
      recommendations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      }
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch history' 
    });
  }
});

/**
 * POST /api/recommendations/save-to-personal
 * Save a recommendation to user's personal learnings
 */
router.post('/save-to-personal', authMiddleware, async (req, res) => {
  try {
    const { 
      userId, 
      recommendationId,
      resource,
      languageId,
      difficulty
    } = req.body;

    // Save to personal learnings table (we'll use user_activity for now or create a new table)
    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: 'saved_learning_resource',
        activity_data: {
          recommendationId,
          resource,
          languageId,
          difficulty,
          savedAt: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update the recommendation as viewed/clicked
    await supabase
      .from('learning_recommendations')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('id', recommendationId);

    res.json({
      success: true,
      message: 'Resource saved to personal learnings',
      savedResource: data
    });

  } catch (error) {
    console.error('Error saving to personal learnings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save resource' 
    });
  }
});

/**
 * GET /api/recommendations/personal-learnings/:userId
 * Get user's saved personal learning resources
 */
router.get('/personal-learnings/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { languageId, limit = 50 } = req.query;

    let query = supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', 'saved_learning_resource')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    const { data, error } = await query;

    if (error) throw error;

    // Filter by language if specified
    let learnings = data;
    if (languageId) {
      learnings = data.filter(item => 
        item.activity_data?.languageId === parseInt(languageId)
      );
    }

    // Format the response
    const formattedLearnings = learnings.map(item => ({
      id: item.id,
      savedAt: item.created_at,
      resource: item.activity_data.resource,
      difficulty: item.activity_data.difficulty,
      languageId: item.activity_data.languageId
    }));

    res.json({
      success: true,
      learnings: formattedLearnings,
      total: formattedLearnings.length
    });

  } catch (error) {
    console.error('Error fetching personal learnings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch personal learnings' 
    });
  }
});

/**
 * DELETE /api/recommendations/personal-learnings/:activityId
 * Remove a resource from personal learnings
 */
router.delete('/personal-learnings/:activityId', authMiddleware, async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    // Delete the saved learning
    const { error } = await supabase
      .from('user_activity')
      .delete()
      .eq('id', activityId)
      .eq('user_id', userId)
      .eq('activity_type', 'saved_learning_resource');

    if (error) throw error;

    res.json({
      success: true,
      message: 'Resource removed from personal learnings'
    });

  } catch (error) {
    console.error('Error removing from personal learnings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove resource' 
    });
  }
});

module.exports = router;