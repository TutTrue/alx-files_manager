import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    try {
      const { authorization } = req.headers;
      const [email, password] = Buffer.from(
        authorization.split(' ')[1],
        'base64',
      )
        .toString('utf-8')
        .split(':');
      const user = await dbClient.client
        .db()
        .collection('users')
        .findOne({ email, password: sha1(password) });
      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      const token = uuidv4();
      redisClient.set(`auth_${token}`, user._id.toString(), 86400);
      return res.status(200).send({ token });
    } catch (error) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    const { token } = req;
    redisClient.del(`auth_${token}`);
    return res.sendStatus(204);
  }
}

export default AuthController;
