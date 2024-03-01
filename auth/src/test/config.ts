import { createConnection, getConnection } from 'typeorm';
import { User } from '../entity/User';

const connection = {
  async create() {
    await createConnection({
      name: 'default',
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'SouravMajumdar123@',
      database: 'auth-test',
      dropSchema: true,
      logging: false,
      synchronize: true,
      entities: [User],
    });
  },

  async close() {
    await getConnection().close();
  },

  async clear() {
    const connection = getConnection();
    const entities = connection.entityMetadatas;

    const entityDeletionPromises = entities.map((entity) => async () => {
      const repository = connection.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
    });
    await Promise.all(entityDeletionPromises);
  },
};
export default connection;
