// Database connection and configuration for Deno 2
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Database configuration
export interface DatabaseConfig {
  hostname: string;
  port: number;
  database: string;
  username: string;
  password: string;
  tls?: {
    enabled: boolean;
    enforce?: boolean;
    caCertificates?: string[];
  };
}

// Get database configuration from environment variables
function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  
  if (databaseUrl) {
    // Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
    const url = new URL(databaseUrl);
    return {
      hostname: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
      tls: {
        enabled: url.protocol === "postgresql:" && url.hostname.includes("amazonaws.com") || 
                 url.hostname.includes("railway.app") || 
                 url.hostname.includes("neon.tech") ||
                 url.hostname.includes("supabase.co"),
        enforce: false
      }
    };
  }

  // Fallback to individual environment variables
  return {
    hostname: Deno.env.get("DB_HOST") || "localhost",
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
    database: Deno.env.get("DB_NAME") || "league_bingo",
    username: Deno.env.get("DB_USER") || "postgres", 
    password: Deno.env.get("DB_PASSWORD") || "password",
    tls: {
      enabled: Deno.env.get("DB_TLS") === "true"
    }
  };
}

// Database connection pool
class DatabasePool {
  private config: DatabaseConfig;
  private connections: Client[] = [];
  private maxConnections = 10;
  private currentConnections = 0;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async getConnection(): Promise<Client> {
    // Try to reuse an existing connection
    const existingConnection = this.connections.pop();
    if (existingConnection) {
      return existingConnection;
    }

    // Create new connection if under limit
    if (this.currentConnections < this.maxConnections) {
      const client = new Client(this.config);
      await client.connect();
      this.currentConnections++;
      console.log(`[DB] Created new connection (${this.currentConnections}/${this.maxConnections})`);
      return client;
    }

    // Wait for a connection to become available
    return new Promise((resolve) => {
      const checkForConnection = () => {
        const connection = this.connections.pop();
        if (connection) {
          resolve(connection);
        } else {
          setTimeout(checkForConnection, 10);
        }
      };
      checkForConnection();
    });
  }

  releaseConnection(client: Client): void {
    this.connections.push(client);
  }

  async closeConnection(client: Client): Promise<void> {
    await client.end();
    this.currentConnections--;
    console.log(`[DB] Closed connection (${this.currentConnections}/${this.maxConnections})`);
  }

  async closeAll(): Promise<void> {
    const allConnections = [...this.connections];
    this.connections = [];

    await Promise.all(
      allConnections.map(client => this.closeConnection(client))
    );
  }
}

// Global database pool instance
const dbConfig = getDatabaseConfig();
export const db = new DatabasePool(dbConfig);

console.log(`[DB] Database configuration loaded:`);
console.log(`  Host: ${dbConfig.hostname}:${dbConfig.port}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  Username: ${dbConfig.username}`);
console.log(`  TLS: ${dbConfig.tls?.enabled ? 'enabled' : 'disabled'}`);

// Database query helper with automatic connection management
export async function query<T = any>(
  text: string, 
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await db.getConnection();
  
  try {
    console.log(`[DB] Query: ${text}`);
    console.log(`[DB] Params: ${JSON.stringify(params)}`);
    
    const result = await client.queryObject<T>(text, params);
    
    console.log(`[DB] Result: ${result.rowCount} rows`);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } catch (error) {
    console.error(`[DB] Query error: ${error}`);
    console.error(`[DB] Query: ${text}`);
    console.error(`[DB] Params: ${JSON.stringify(params)}`);
    throw error;
  } finally {
    db.releaseConnection(client);
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = await db.getConnection();
  
  try {
    await client.queryObject("BEGIN");
    console.log("[DB] Transaction started");
    
    const result = await callback(client);
    
    await client.queryObject("COMMIT");
    console.log("[DB] Transaction committed");
    
    return result;
  } catch (error) {
    await client.queryObject("ROLLBACK");
    console.error("[DB] Transaction rolled back:", error);
    throw error;
  } finally {
    db.releaseConnection(client);
  }
}

// Database health check
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query("SELECT 1 as health");
    return result.rows.length === 1 && result.rows[0].health === 1;
  } catch (error) {
    console.error("[DB] Health check failed:", error);
    return false;
  }
}

// Initialize database (run migrations, etc.)
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("[DB] Initializing database...");
    
    // Check if sessions table exists
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'sessions'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log("[DB] Database tables not found. Please run the schema.sql file first.");
      console.log("[DB] You can run: psql $DATABASE_URL -f database/schema.sql");
      throw new Error("Database not initialized. Run schema.sql first.");
    }
    
    console.log("[DB] Database tables found, checking health...");
    const healthy = await healthCheck();
    
    if (!healthy) {
      throw new Error("Database health check failed");
    }
    
    console.log("[DB] Database initialized successfully");
  } catch (error) {
    console.error("[DB] Failed to initialize database:", error);
    throw error;
  }
}

// Cleanup function for graceful shutdown
export async function cleanup(): Promise<void> {
  console.log("[DB] Cleaning up database connections...");
  await db.closeAll();
  console.log("[DB] Database cleanup complete");
}

// Real-time notification listener
export class DatabaseNotifier {
  private client: Client | null = null;
  private listeners = new Map<string, ((data: any) => void)[]>();

  async start(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new Client(dbConfig);
    await this.client.connect();
    
    console.log("[DB] Started notification listener");
    
    // Listen for notifications
    this.client.on("notification", (notification) => {
      const { channel, payload } = notification;
      const listeners = this.listeners.get(channel) || [];
      
      try {
        const data = JSON.parse(payload);
        console.log(`[DB] Notification received: ${channel}`, data);
        
        listeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error(`[DB] Notification listener error:`, error);
          }
        });
      } catch (error) {
        console.error(`[DB] Failed to parse notification payload:`, error);
      }
    });
  }

  async listen(channel: string, callback: (data: any) => void): Promise<void> {
    if (!this.client) {
      await this.start();
    }

    // Add callback to listeners
    const existingListeners = this.listeners.get(channel) || [];
    this.listeners.set(channel, [...existingListeners, callback]);

    // Start listening to the channel
    await this.client!.queryObject(`LISTEN ${channel}`);
    console.log(`[DB] Listening to channel: ${channel}`);
  }

  async stop(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      this.listeners.clear();
      console.log("[DB] Stopped notification listener");
    }
  }
}

export const dbNotifier = new DatabaseNotifier();