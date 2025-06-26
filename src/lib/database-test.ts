/**
 * Database Test Utilities
 * 
 * Purpose: Provides testing functions for database connectivity and basic operations.
 * This module contains functions to verify database setup and perform initial tests.
 * 
 * Changes made:
 * - Updated for Supabase connection
 * - Maintained all existing test functionality
 * - Updated test operations for Supabase syntax
 */

import { supabase, testDatabaseConnection, getDatabaseInfo, checkDatabaseHealth } from './database';

/**
 * Run comprehensive database tests
 * @returns Promise<void>
 */
export const runDatabaseTests = async (): Promise<void> => {
  console.log('🔍 Starting Supabase database tests...');
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing database connection...');
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Get database info
    console.log('📊 Getting database information...');
    const dbInfo = await getDatabaseInfo();
    console.log('✅ Database info retrieved:', dbInfo);
    
    // Test 3: Health check
    console.log('🏥 Running health check...');
    const health = await checkDatabaseHealth();
    console.log('✅ Health check completed:', {
      connected: health.connected,
      hasInfo: !!health.info
    });
    
    // Test 4: Table operations
    console.log('🔧 Testing table operations...');
    await testTableOperations();
    
    console.log('🎉 All Supabase database tests passed!');
    
  } catch (error) {
    console.error('❌ Database tests failed:', error);
    throw error;
  }
};

/**
 * Test basic table operations (select, insert)
 * @returns Promise<void>
 */
export const testTableOperations = async (): Promise<void> => {
  try {
    // Test 1: Check if form_sessions table exists and is accessible
    console.log('📋 Testing form_sessions table access...');
    const { data, error } = await supabase
      .from('form_sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Table access failed: ${error.message}`);
    }
    
    console.log('✅ form_sessions table is accessible');
    
    // Test 2: Insert test data
    console.log('📝 Testing data insertion...');
    const testData = {
      session_id: `test-${Date.now()}`,
      step_number: 0,
      step_type: 'connection_test',
      environment: 'test',
      user_agent: 'test-agent',
      step_completed: 0,
      created_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('form_sessions')
      .insert([testData])
      .select();
    
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    
    console.log('✅ Test data inserted successfully:', insertResult[0]);
    
    // Test 3: Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('form_sessions')
      .delete()
      .eq('session_id', testData.session_id);
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Table operations test failed:', error);
    throw error;
  }
};

/**
 * Quick connection test for development
 * @returns Promise<boolean>
 */
export const quickConnectionTest = async (): Promise<boolean> => {
  try {
    console.log('🚀 Quick Supabase connection test...');
    const { data, error } = await supabase
      .from('form_sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Quick connection test failed:', error);
      return false;
    }
    
    console.log('✅ Quick test successful - Supabase is connected');
    return true;
  } catch (error) {
    console.error('❌ Quick connection test failed:', error);
    return false;
  }
};

/**
 * Initialize database for development (run once)
 * @returns Promise<void>
 */
export const initializeDatabase = async (): Promise<void> => {
  console.log('🏗️ Initializing Supabase database...');
  
  try {
    // Run connection tests first
    await runDatabaseTests();
    
    console.log('📋 Supabase database initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};