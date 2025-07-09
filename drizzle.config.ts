import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/models"],
  out: "./drizzle",
  dbCredentials: {
    host: process.env.DB_HOST || "",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "",
    ssl:"prefer"
  },
  schemaFilter:["lushaiedu_payment"]
});