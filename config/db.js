/**
 * Postgres connection pool configuration
 */

const { Pool } = require("pg");
const ENV = require("./env");

// Prefer DATABASE_URL when available (e.g., on cloud envs), otherwise use individual vars
const pool = new Pool(
	ENV.DATABASE_URL
		? { connectionString: ENV.DATABASE_URL }
		: {
				user: ENV.PGUSER,
				host: ENV.PGHOST,
				database: ENV.PGDATABASE,
				password: ENV.PGPASSWORD,
				port: ENV.PGPORT ? Number(ENV.PGPORT) : undefined,
		  }
);

pool.on("error", (err) => {
	console.error("Unexpected PG client idle error:", err);
});

module.exports = pool;
