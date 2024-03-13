import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    if (dbClient.isAlive() && redisClient.isAlive()) {
      return res.status(200).json({ redis: true, db: true });
    }

    return res.status(500).send('Internal server error');
  }

  static async getStats(req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();

      return res.status(200).json({ users, files });
    } catch (error) {
      return res.status(500).send('Internal server error');
    }
  }
}

export default AppController;
