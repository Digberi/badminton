import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Configuration
const config = new pulumi.Config();
const projectName = pulumi.getProject();
const stackName = pulumi.getStack();

// Create a Cloud SQL PostgreSQL instance
const dbInstance = new gcp.sql.DatabaseInstance("badminton-db", {
    databaseVersion: "POSTGRES_15",
    region: "us-central1",
    settings: {
        tier: "db-f1-micro",
        ipConfiguration: {
            authorizedNetworks: [{
                name: "all",
                value: "0.0.0.0/0", // Note: Restrict this in production
            }],
        },
    },
});

// Create a database
const database = new gcp.sql.Database("badminton-database", {
    instance: dbInstance.name,
    name: "badminton",
});

// Create a database user
const dbUser = new gcp.sql.User("badminton-user", {
    instance: dbInstance.name,
    name: "badminton_user",
    password: config.requireSecret("dbPassword"),
});

// Export database connection details
export const dbInstanceName = dbInstance.name;
export const dbConnectionName = dbInstance.connectionName;
export const dbPublicIp = dbInstance.publicIpAddress;
export const databaseName = database.name;

// Note: For Vercel deployment, set these environment variables:
// DATABASE_URL=postgresql://badminton_user:password@host:5432/badminton
