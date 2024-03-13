import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function userAuth(req, res, next) {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const user = await dbClient.client
    .db()
    .collection('users')
    .findOne({ _id: ObjectId(userId) });
  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  req.user = user;
  req.token = token;
  return next();
}

export default userAuth;
