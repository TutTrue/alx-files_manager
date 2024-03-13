import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }

    try {
      if (await dbClient.client.db().collection('users').findOne({ email })) {
        return res.status(400).send({ error: 'Already exist' });
      }
      const user = await dbClient.client
        .db()
        .collection('users')
        .insertOne({ email, password: sha1(password) });
      const insertedUser = user.ops[0];
      return res
        .status(201)
        .json({ id: insertedUser._id, email: insertedUser.email });
    } catch (error) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
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
      return res.status(404).send({ error: 'User not found' });
    }
    return res.status(200).send({ id: user._id, email: user.email });
  }
}

export default UserController;
