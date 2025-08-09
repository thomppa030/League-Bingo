import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { postgresSessionStore } from '$lib/server/postgresSessionStore';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
  try {
    const databaseUrl = env.DATABASE_URL;
    
    if (!databaseUrl) {
      return json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        env_vars: Object.keys(process.env).filter(k => k.includes('DATABASE')),
        timestamp: new Date()
      });
    }

    // Test database connection
    try {
      await postgresSessionStore.initialize();
      
      return json({
        success: true,
        message: 'Database connection successful',
        database_url_present: true,
        database_url_prefix: databaseUrl.substring(0, 20) + '...',
        timestamp: new Date()
      });
      
    } catch (dbError) {
      return json({
        success: false,
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        database_url_present: true,
        timestamp: new Date()
      });
    }
    
  } catch (error) {
    return json({
      success: false,
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
};