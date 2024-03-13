import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

async function getUsetByToken(token) {
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return null;
  }
  const user = await dbClient.client
    .db()
    .collection('users')
    .findOne({ _id: ObjectId(userId) });
  if (!user) {
    return null;
  }
  return user;
}

export default getUsetByToken;
