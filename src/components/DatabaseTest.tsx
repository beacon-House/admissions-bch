/**
 * Database Test Component
 * 
 * Purpose: React component for testing database connectivity and operations in the UI.
 * Provides a simple interface to test database functions and display results.
 * 
 * Changes made:
 * - Initial component for database testing
 * - UI for connection testing and health checks
 * - Error handling and status display
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  testDatabaseConnection, 
  checkDatabaseHealth, 
  getDatabaseInfo
} from '@/lib/database';
import { 
  runDatabaseTests, 
  quickConnectionTest, 
  testTableOperations 
} from '@/lib/database-test';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export function DatabaseTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toLocaleTimeString() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const handleQuickTest = async () => {
    setIsLoading(true);
    try {
      const success = await quickConnectionTest();
      addResult({
        success,
        message: success ? 'Quick connection test passed' : 'Quick connection test failed'
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Quick test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionTest = async () => {
    setIsLoading(true);
    try {
      const connected = await testDatabaseConnection();
      addResult({
        success: connected,
        message: connected ? 'Database connection successful' : 'Database connection failed'
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setIsLoading(true);
    try {
      const health = await checkDatabaseHealth();
      addResult({
        success: health.connected,
        message: health.connected ? 'Database health check passed' : `Health check failed: ${health.error}`,
        data: health.info
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullTest = async () => {
    setIsLoading(true);
    try {
      await runDatabaseTests();
      addResult({
        success: true,
        message: 'All database tests completed successfully'
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Full test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableTest = async () => {
    setIsLoading(true);
    try {
      await testTableOperations();
      addResult({
        success: true,
        message: 'Table operations test completed successfully'
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Table test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Supabase Database Connection Test
          </CardTitle>
          <CardDescription>
            Test your Supabase PostgreSQL database connection and operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button 
              onClick={handleQuickTest} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Quick Test
            </Button>
            
            <Button 
              onClick={handleConnectionTest} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Connection Test
            </Button>
            
            <Button 
              onClick={handleHealthCheck} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Health Check
            </Button>
            
            <Button 
              onClick={handleTableTest} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Table Operations
            </Button>
            
            <Button 
              onClick={handleFullTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Run All Tests
            </Button>
            
            <Button 
              onClick={clearResults} 
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Latest test results (newest first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.slice().reverse().map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.message}
                      </p>
                      {result.data && (
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {result.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}