/**
 * Data Integrity Dashboard Component
 * 
 * Purpose: Provides a comprehensive dashboard for monitoring lead category data integrity
 * across the entire system. Displays validation results, consistency reports, and
 * real-time monitoring statistics.
 * 
 * Changes made:
 * - Created comprehensive dashboard for data integrity monitoring
 * - Real-time validation and reporting interface
 * - Visual indicators for data consistency issues
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  generateMonitoringStats, 
  validateAllRecords, 
  monitorSessionIntegrity 
} from '@/lib/dataIntegrityMonitor';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  TrendingUp,
  RefreshCw,
  Search,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  categoryMismatches: number;
  encodingIssues: number;
  lastChecked: string;
  categoryDistribution: Record<string, number>;
}

export function DataIntegrityDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessionReport, setSessionReport] = useState<any>(null);

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const newStats = await generateMonitoringStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullValidation = async () => {
    setIsLoading(true);
    try {
      const results = await validateAllRecords();
      setValidationResults(results);
    } catch (error) {
      console.error('Failed to run validation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async () => {
    if (!sessionId.trim()) return;
    
    setIsLoading(true);
    try {
      // For demo purposes, we'll create a mock webhook payload
      const mockWebhookPayload = {
        lead_category: 'bch',
        session_id: sessionId
      };
      
      const report = await monitorSessionIntegrity(sessionId, mockWebhookPayload);
      setSessionReport(report);
    } catch (error) {
      console.error('Failed to check session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const getValidityPercentage = () => {
    if (!stats || stats.totalRecords === 0) return 0;
    return Math.round((stats.validRecords / stats.totalRecords) * 100);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Data Integrity Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor lead category consistency across webhook and database</p>
        </div>
        <Button onClick={refreshStats} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Validity</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getValidityPercentage()}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.validRecords || 0} of {stats?.totalRecords || 0} valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Category Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.invalidRecords || 0}</div>
            <p className="text-xs text-muted-foreground">
              Invalid categories found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encoding Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.encodingIssues || 0}</div>
            <p className="text-xs text-muted-foreground">
              Character encoding problems
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      {stats?.categoryDistribution && Object.keys(stats.categoryDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Lead Category Distribution
            </CardTitle>
            <CardDescription>
              Distribution of lead categories in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-primary">{count}</div>
                  <div className="text-xs text-gray-600 uppercase">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Validation */}
        <Card>
          <CardHeader>
            <CardTitle>Full Database Validation</CardTitle>
            <CardDescription>
              Run comprehensive validation on all database records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runFullValidation} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running Validation...' : 'Run Full Validation'}
            </Button>
            
            {validationResults && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Validation Results</h4>
                <div className="space-y-2 text-sm">
                  <div>Total Checked: {validationResults.totalChecked}</div>
                  <div>Issues Found: {validationResults.issuesFound}</div>
                  <div>Success Rate: {Math.round(((validationResults.totalChecked - validationResults.issuesFound) / validationResults.totalChecked) * 100)}%</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Check */}
        <Card>
          <CardHeader>
            <CardTitle>Session Integrity Check</CardTitle>
            <CardDescription>
              Check data consistency for a specific session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <Button 
                onClick={checkSession} 
                disabled={isLoading || !sessionId.trim()}
                size="sm"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {sessionReport && (
              <div className={`mt-4 p-4 rounded-lg border ${getSeverityColor(sessionReport.severity)}`}>
                <h4 className="font-medium mb-2">Session Report</h4>
                <div className="space-y-2 text-sm">
                  <div>Session ID: {sessionReport.sessionId}</div>
                  <div>Severity: {sessionReport.severity.toUpperCase()}</div>
                  <div>Issues: {sessionReport.issues.length}</div>
                  {sessionReport.issues.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Issues Found:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {sessionReport.issues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      {stats && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(stats.lastChecked).toLocaleString()}
        </div>
      )}
    </div>
  );
}