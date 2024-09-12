import Redis from "ioredis";
const redisCon = new Redis(process.env.REDIS_URL || "", { tls: { rejectUnauthorized: false } });
// { createClient, Graph, RedisClientType, RedisDefaultModules }
console.log("REDISURL", process.env.REDIS_URL);

console.log("redisState", redisCon.status)

export default redisCon;