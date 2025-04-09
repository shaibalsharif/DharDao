import type { Config } from "drizzle-kit"

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect:"postgresql",
 
  dbCredentials: {
    url: process.env.NEXT_PUBLIC_DATABASE_URL || "postgresql://neondb_owner:npg_4HyWFnRNk9tG@ep-blue-shape-a5o3gufn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
  
  
} satisfies Config
