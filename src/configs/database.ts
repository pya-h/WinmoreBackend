export default () => ({
  database: {
    host: process.env.DATABASE_ADDRESS,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
    databaseSslMode: process.env.DATABASE_SSL_MODE,
  },
});
