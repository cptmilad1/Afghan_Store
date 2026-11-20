const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const required = ['PORT','CLIENT_URL','DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','JWT_SECRET','JWT_EXPIRES_IN'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
const port = Number(process.env.PORT), dbPort = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535 || !Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) throw new Error('PORT and DB_PORT must be valid TCP ports.');
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
module.exports = { nodeEnv: process.env.NODE_ENV || 'development', port, clientUrl: process.env.CLIENT_URL.split(',').map(s=>s.trim()), db: { host:process.env.DB_HOST, port:dbPort, name:process.env.DB_NAME, user:process.env.DB_USER, password:process.env.DB_PASSWORD, ssl:String(process.env.DB_SSL).toLowerCase()==='true' }, jwt:{ secret:process.env.JWT_SECRET, expiresIn:process.env.JWT_EXPIRES_IN } };
