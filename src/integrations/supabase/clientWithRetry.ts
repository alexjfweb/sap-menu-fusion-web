
import { supabase } from './client';
import { AuthError } from '@supabase/supabase-js';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const { maxRetries, baseDelay, maxDelay } = { ...defaultRetryConfig, ...config };
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors
      if (error instanceof AuthError && error.message.includes('Invalid login credentials')) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms. Error:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export const signInWithRetry = async (email: string, password: string) => {
  return withRetry(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  });
};

export const signUpWithRetry = async (email: string, password: string, options?: any) => {
  return withRetry(async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options,
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  });
};
