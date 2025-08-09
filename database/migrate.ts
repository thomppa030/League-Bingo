#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

// Database migration script for League Bingo PostgreSQL setup
import { initializeDatabase, healthCheck, query } from "./db.ts";

async function runMigration() {
  console.log("🚀 League Bingo Database Migration");
  console.log("==================================");

  try {
    // Check if we can connect to the database
    console.log("1. Checking database connection...");
    const isHealthy = await healthCheck();
    
    if (!isHealthy) {
      console.error("❌ Cannot connect to database. Please check your DATABASE_URL or connection settings.");
      Deno.exit(1);
    }
    
    console.log("✅ Database connection successful");

    // Check if schema needs to be applied
    console.log("\n2. Checking database schema...");
    
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map((row: any) => row.table_name);
    console.log(`Found ${existingTables.length} existing tables:`, existingTables);

    // Required tables for the application
    const requiredTables = [
      'sessions',
      'players', 
      'bingo_cards',
      'bingo_squares',
      'pattern_completions',
      'game_events',
      'challenge_categories',
      'challenges'
    ];

    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing required tables: ${missingTables.join(', ')}`);
      console.log("\n🔧 To set up the database schema, run:");
      console.log(`   psql $DATABASE_URL -f database/schema.sql`);
      console.log("\nOr if using a GUI tool, execute the contents of database/schema.sql");
      
      // Optionally, we could read and execute the schema file here
      const shouldApplySchema = confirm("\nWould you like to apply the schema now? (y/n)");
      if (shouldApplySchema) {
        await applySchema();
      } else {
        Deno.exit(1);
      }
    } else {
      console.log("✅ All required tables present");
    }

    // Verify data integrity
    console.log("\n3. Verifying data integrity...");
    
    await verifyConstraints();
    
    // Check for sample data
    console.log("\n4. Checking sample data...");
    await checkSampleData();

    // Run any pending migrations
    console.log("\n5. Checking for pending migrations...");
    await runPendingMigrations();

    console.log("\n🎉 Database migration completed successfully!");
    console.log("\nYour League Bingo database is ready to use.");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    Deno.exit(1);
  }
}

async function applySchema(): Promise<void> {
  console.log("📄 Reading schema file...");
  
  try {
    const schemaContent = await Deno.readTextFile("./database/schema.sql");
    
    // Split on statement boundaries and execute
    const statements = schemaContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await query(statement);
      }
    }

    console.log("✅ Schema applied successfully");
    
  } catch (error) {
    if (error.name === 'NotFound') {
      console.error("❌ Schema file not found at ./database/schema.sql");
      console.log("Please ensure you're running this from the project root directory");
    } else {
      console.error("❌ Failed to apply schema:", error);
    }
    throw error;
  }
}

async function verifyConstraints(): Promise<void> {
  try {
    // Check foreign key constraints
    const constraintsResult = await query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    console.log(`✅ Found ${constraintsResult.rowCount} foreign key constraints`);

    // Check indexes
    const indexesResult = await query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log(`✅ Found ${indexesResult.rowCount} indexes`);
    
  } catch (error) {
    console.error("⚠️ Error verifying constraints:", error);
  }
}

async function checkSampleData(): Promise<void> {
  try {
    // Check challenge categories
    const categoriesResult = await query("SELECT COUNT(*) as count FROM challenge_categories");
    const categoriesCount = parseInt(categoriesResult.rows[0].count);
    
    if (categoriesCount === 0) {
      console.log("⚠️ No challenge categories found - this might be expected for a fresh install");
    } else {
      console.log(`✅ Found ${categoriesCount} challenge categories`);
    }

    // Check challenges
    const challengesResult = await query("SELECT COUNT(*) as count FROM challenges");
    const challengesCount = parseInt(challengesResult.rows[0].count);
    
    if (challengesCount === 0) {
      console.log("⚠️ No challenges found - this might be expected for a fresh install");
    } else {
      console.log(`✅ Found ${challengesCount} challenges`);
    }

    // Check active sessions
    const sessionsResult = await query("SELECT COUNT(*) as count FROM sessions WHERE status IN ('setup', 'playing')");
    const sessionsCount = parseInt(sessionsResult.rows[0].count);
    
    console.log(`📊 Found ${sessionsCount} active sessions`);

  } catch (error) {
    console.error("⚠️ Error checking sample data:", error);
  }
}

async function runPendingMigrations(): Promise<void> {
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // List of migrations (add new ones here)
    const migrations = [
      {
        name: "001_initial_schema",
        description: "Initial database schema",
        sql: "" // Already applied via schema.sql
      },
      {
        name: "002_add_indexes",
        description: "Add performance indexes",
        sql: `
          CREATE INDEX IF NOT EXISTS idx_game_events_session_player 
          ON game_events(session_id, player_id);
          
          CREATE INDEX IF NOT EXISTS idx_players_session_ready 
          ON players(session_id, is_ready);
        `
      }
    ];

    // Check which migrations have been run
    for (const migration of migrations) {
      const existingResult = await query(
        "SELECT * FROM migrations WHERE name = $1",
        [migration.name]
      );

      if (existingResult.rowCount === 0 && migration.sql.trim()) {
        console.log(`Running migration: ${migration.description}`);
        
        // Execute migration SQL
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await query(statement);
        }

        // Record migration as completed
        await query(
          "INSERT INTO migrations (name) VALUES ($1)",
          [migration.name]
        );

        console.log(`✅ Completed migration: ${migration.name}`);
      }
    }

    console.log("✅ All migrations up to date");

  } catch (error) {
    console.error("⚠️ Error running migrations:", error);
  }
}

// CLI interface
if (import.meta.main) {
  await runMigration();
}