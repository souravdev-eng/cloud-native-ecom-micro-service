import { createConnection, getConnection, Connection } from 'typeorm';
import { User } from '../entity/User';

const connection = {
  async create(): Promise<Connection> {
    const connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [User],
    });

    // console.log(`Connected to PostgreSQL database: ${connection.name}`);
    return connection;
  },

  async close(): Promise<void> {
    const defaultConnection = getConnection('default');
    await defaultConnection.close();
    // console.log(`Connection to PostgreSQL database closed`);
  },

  async clear(): Promise<void> {
    const defaultConnection = getConnection('default');
    const entities = defaultConnection.entityMetadatas;

    const entityDeletionPromises = entities.map(async (entity) => {
      const repository = defaultConnection.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
    });

    await Promise.all(entityDeletionPromises);
    // console.log(`Cleared data from PostgreSQL database`);
  },
};

export default connection;
