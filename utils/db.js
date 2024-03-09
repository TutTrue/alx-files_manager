import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const port = process.env.DB_PORT || 27017;
    const host = process.env.DB_HOST || 'localhost';
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const users = await this.client.db().collection('users');
    return users.countDocuments();
  }

  async nbFiles() {
    const files = await this.client.db().collection('files');
    return files.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
