import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, promises as fsPromises } from 'fs';
import { contentType } from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const {
      name,
      type,
      parentId,
      isPublic,
      data,
    } = req.body;
    const { user } = req;

    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }
    if (parentId) {
      const parent = await dbClient.client
        .db()
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parent) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }
    const file = {
      userId: user._id,
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
      data,
    };
    if (type !== 'folder') {
      const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileNameUUID = uuidv4();

      const fileDataDecoded = Buffer.from(data, 'base64');

      const path = `${FOLDER_PATH}/${fileNameUUID}`;

      file.localPath = path;

      try {
        await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
        await fsPromises.writeFile(path, fileDataDecoded);
      } catch (err) {
        return { error: err.message, code: 400 };
      }
    }
    const insertedFile = await dbClient.client
      .db()
      .collection('files')
      .insertOne(file);
    return res.status(201).json({
      id: insertedFile.ops[0]._id,
      userId: user._id,
      name,
      type,
      parentId: parentId ? ObjectId(parentId) : 0,
      isPublic: isPublic || false,
    });
  }

  static async getShow(req, res) {
    try {
      const { user } = req;
      const { id } = req.params;
      const file = await dbClient.client
        .db()
        .collection('files')
        .findOne({ _id: ObjectId(id), userId: user._id });
      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }
      return res.status(200).json(file);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }

  static async getIndex(req, res) {
    try {
      const { user } = req;
      const { parentId, page } = req.query;
      const pageInt = page ? parseInt(page, 10) : 0;
      const pageSize = 20;

      const pipeline = [
        {
          $match: {
            userId: ObjectId(user._id),
            parentId: parentId ? ObjectId(parentId) : '0',
          },
        },
        { $sort: { _id: -1 } },
        { $skip: pageSize * pageInt },
        { $limit: pageSize },
      ];
      const files = await dbClient.client
        .db()
        .collection('files')
        .aggregate(pipeline)
        .toArray();
      if (!files) {
        return res.status(200).send([]);
      }
      const filesWithId = files.map((file) => {
        const newFile = { ...file };
        newFile.id = newFile._id;
        delete newFile._id;
        return newFile;
      });
      return res.status(200).json(filesWithId);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }

  static async putPublish(req, res) {
    try {
      const { user } = req;
      const { id } = req.params;
      const file = await dbClient.client
        .db()
        .collection('files')
        .findOne({ _id: ObjectId(id), userId: user._id });
      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }
      const updatedFile = await dbClient.client
        .db()
        .collection('files')
        .updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });
      return res.status(200).json({
        id: updatedFile._id,
        userId: user._id,
        name: file.name,
        type: file.type,
        parentId: file.parentId,
        isPublic: true,
      });
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }

  static async putUnpublish(req, res) {
    try {
      const { user } = req;
      const { id } = req.params;
      const file = await dbClient.client
        .db()
        .collection('files')
        .findOne({ _id: ObjectId(id), userId: user._id });
      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }
      const updatedFile = await dbClient.client
        .db()
        .collection('files')
        .updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });
      return res.status(200).json({
        id: updatedFile._id,
        userId: user._id,
        name: file.name,
        type: file.type,
        parentId: file.parentId,
        isPublic: false,
      });
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }

  static async getFile(req, res) {
    try {
      const token = req.header['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      const { id } = req.params;
      const { size } = req.query;
      const file = await dbClient.client
        .db()
        .collection('files')
        .findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
      if (!file || (!file.isPublic && file.userId.toString() !== userId)) {
        return res.status(404).send({ error: 'Not found' });
      }
      if (file.type === 'folder') {
        return res.status(400).send({ error: 'A folder doesn\'t have content' });
      }
      const filePath = (size && file.type === 'image') ? `${file.localPath}_${size}` : file.localPath;
      if (!existsSync(filePath)) {
        return res.status(404).send({ error: 'Not found' });
      }

      const fileMimeType = contentType(file.name) || 'text/plain; charset=utf-8';
      const data = await fsPromises.readFile(filePath);
      return res.setHeader('Content-Type', fileMimeType).staus(200).send(data);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }
}

export default FilesController;
