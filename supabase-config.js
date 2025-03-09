// Supabase configuration
// Replace these with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://rpkzrdgnrisqgddfoagt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwa3pyZGducmlzcWdkZGZvYWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTMyNDcsImV4cCI6MjA1NzAyOTI0N30.FqeNfcRysd36FeYm-Ru1PIBjQ5K8ACn7wN5CsfcbSJs';

// Initialize the Supabase client properly
let supabaseClient;

// Wait for the Supabase library to load
document.addEventListener('DOMContentLoaded', () => {
  // Check if the supabase library is loaded
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client initialized successfully');
  } else {
    console.error('Supabase library not loaded');
  }
});

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

// Hash email for display purposes (to protect privacy)
function hashEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'anonymous';
  }
  
  // Get username part (before @)
  const parts = email.split('@');
  const username = parts[0];
  const domain = parts[1];
  
  // Show exactly first 3 characters followed by 3 stars
  let maskedUsername = '';
  if (username.length <= 3) {
    // If username is 3 chars or less, show what we have and fill the rest with stars
    maskedUsername = username + '*'.repeat(3 - username.length);
  } else {
    // If longer than 3 chars, take first 3 and add 3 stars
    maskedUsername = username.substring(0, 3) + '***';
  }
  
  // Mask domain as well, only show the domain extension
  let maskedDomain = '';
  if (domain) {
    const domainParts = domain.split('.');
    if (domainParts.length > 1) {
      // Only show the domain extension (e.g., .com, .org)
      const extension = domainParts[domainParts.length - 1];
      maskedDomain = '*****.' + extension;
    } else {
      maskedDomain = '*****';
    }
  }
  
  return maskedUsername + '@' + maskedDomain;
}

// Leaderboard functions
async function saveScore(email, score, level) {
  try {
    // Make sure supabase is initialized
    if (!supabaseClient) {
      return { 
        success: false, 
        error: 'Supabase client not initialized. Please try again.' 
      };
    }
    
    // Validate email
    if (!isValidEmail(email)) {
      return { 
        success: false, 
        error: 'Please enter a valid email address' 
      };
    }
    
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .insert([
        { 
          email: email,
          score: score,
          level: level,
          created_at: new Date()
        }
      ]);
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving score:', error);
    return { success: false, error: error.message };
  }
}

async function getTopScores(limit = 10) {
  try {
    // Make sure supabase is initialized
    if (!supabaseClient) {
      return { 
        success: false, 
        error: 'Supabase client not initialized. Please try again.' 
      };
    }
    
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    // Mask emails for privacy before returning
    const maskedData = data.map(entry => ({
      ...entry,
      displayEmail: hashEmail(entry.email)
    }));
    
    return { success: true, data: maskedData };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, error: error.message };
  }
} 