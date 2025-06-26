/**
 * Data Integrity Monitor
 * 
 * Purpose: Monitors and reports on data integrity across the entire lead category lifecycle
 * from webhook reception to database persistence. Provides comprehensive reporting and
 * automated validation checks.
 * 
 * Changes made:
 * - Created comprehensive monitoring system for data integrity
 * - Implemented automated validation and reporting
 * - Added lifecycle tracking for lead categories
 */

import { supabase } from './database';
import { 
  validateLeadCategory, 
  compareLeadCategories, 
  generateDataIntegrityReport,
  logLeadCategoryError 
} from './dataValidation';
import { LeadCategory } from '@/types/form';

// Data integrity report interface
interface IntegrityReport {
  sessionId: string;
  timestamp: string;
  webhookData: any;
  databaseData: any;
  consistencyCheck: any;
  issues: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
}

// Monitoring statistics interface
interface MonitoringStats {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  categoryMismatches: number;
  encodingIssues: number;
  lastChecked: string;
  categoryDistribution: Record<string, number>;
}

/**
 * Monitor data integrity for a specific session
 */
export const monitorSessionIntegrity = async (
  sessionId: string,
  webhookPayload: any
): Promise<IntegrityReport> => {
  try {
    // Fetch corresponding database record
    const { data: databaseRecords, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const databaseData = databaseRecords?.[0];
    const issues: string[] = [];
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    if (!databaseData) {
      issues.push('No corresponding database record found');
      severity = 'high';
      recommendations.push('Investigate database insertion process');
    } else {
      // Generate comprehensive consistency report
      const consistencyCheck = generateDataIntegrityReport(
        webhookPayload,
        databaseData,
        sessionId
      );

      // Analyze issues
      if (!consistencyCheck.leadCategoryMatch) {
        issues.push(`Lead category mismatch: webhook="${webhookPayload.lead_category}", database="${databaseData.lead_category}"`);
        severity = 'high';
        recommendations.push('Review data transformation logic');
      }

      if (!consistencyCheck.encodingConsistent) {
        issues.push('Character encoding inconsistency detected');
        severity = 'medium';
        recommendations.push('Implement UTF-8 encoding validation');
      }

      if (consistencyCheck.validationErrors.length > 0) {
        issues.push(...consistencyCheck.validationErrors);
        severity = 'high';
      }

      recommendations.push(...consistencyCheck.recommendations);
    }

    const report: IntegrityReport = {
      sessionId,
      timestamp: new Date().toISOString(),
      webhookData: webhookPayload,
      databaseData,
      consistencyCheck: databaseData ? generateDataIntegrityReport(webhookPayload, databaseData, sessionId) : null,
      issues,
      recommendations,
      severity
    };

    // Log high severity issues
    if (severity === 'high') {
      logLeadCategoryError(
        'Data Integrity Monitor - High Severity',
        { webhook: webhookPayload.lead_category, database: databaseData?.lead_category },
        sessionId,
        report
      );
    }

    return report;

  } catch (error) {
    const errorReport: IntegrityReport = {
      sessionId,
      timestamp: new Date().toISOString(),
      webhookData: webhookPayload,
      databaseData: null,
      consistencyCheck: null,
      issues: [`Monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Investigate monitoring system functionality'],
      severity: 'high'
    };

    logLeadCategoryError(
      'Data Integrity Monitor - System Error',
      webhookPayload.lead_category,
      sessionId,
      { error, webhookPayload }
    );

    return errorReport;
  }
};

/**
 * Generate comprehensive monitoring statistics
 */
export const generateMonitoringStats = async (
  timeRange: 'hour' | 'day' | 'week' = 'day'
): Promise<MonitoringStats> => {
  try {
    const now = new Date();
    const timeRangeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(now.getTime() - timeRangeMs[timeRange]);

    // Fetch records within time range
    const { data: records, error } = await supabase
      .from('form_sessions')
      .select('lead_category, created_at')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const totalRecords = records?.length || 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let categoryMismatches = 0;
    let encodingIssues = 0;
    const categoryDistribution: Record<string, number> = {};

    // Analyze each record
    records?.forEach(record => {
      const validation = validateLeadCategory(record.lead_category);
      
      if (validation.isValid) {
        validRecords++;
        const category = validation.category;
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      } else {
        invalidRecords++;
      }

      if (validation.warnings.some(w => w.includes('encoding'))) {
        encodingIssues++;
      }
    });

    return {
      totalRecords,
      validRecords,
      invalidRecords,
      categoryMismatches,
      encodingIssues,
      lastChecked: now.toISOString(),
      categoryDistribution
    };

  } catch (error) {
    console.error('Failed to generate monitoring stats:', error);
    return {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      categoryMismatches: 0,
      encodingIssues: 0,
      lastChecked: new Date().toISOString(),
      categoryDistribution: {}
    };
  }
};

/**
 * Validate all records in database for consistency
 */
export const validateAllRecords = async (): Promise<{
  totalChecked: number;
  issuesFound: number;
  reports: IntegrityReport[];
}> => {
  try {
    const { data: records, error } = await supabase
      .from('form_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to prevent overwhelming

    if (error) {
      throw error;
    }

    const reports: IntegrityReport[] = [];
    let issuesFound = 0;

    for (const record of records || []) {
      const validation = validateLeadCategory(record.lead_category);
      
      if (!validation.isValid || validation.warnings.length > 0) {
        issuesFound++;
        
        const report: IntegrityReport = {
          sessionId: record.session_id,
          timestamp: new Date().toISOString(),
          webhookData: null, // Not available for historical records
          databaseData: record,
          consistencyCheck: null,
          issues: validation.errors,
          recommendations: validation.warnings,
          severity: validation.errors.length > 0 ? 'high' : 'medium'
        };

        reports.push(report);
      }
    }

    return {
      totalChecked: records?.length || 0,
      issuesFound,
      reports
    };

  } catch (error) {
    console.error('Failed to validate all records:', error);
    return {
      totalChecked: 0,
      issuesFound: 0,
      reports: []
    };
  }
};

/**
 * Real-time monitoring hook for React components
 */
export const useDataIntegrityMonitoring = () => {
  const [stats, setStats] = React.useState<MonitoringStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const newStats = await generateMonitoringStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh monitoring stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    refreshStats();
    // Refresh every 5 minutes
    const interval = setInterval(refreshStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    isLoading,
    refreshStats
  };
};