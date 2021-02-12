import mongoose from 'mongoose';
import config, { isDev } from '../utils/configUtils';

// Configure mongoose's promise to global promise
mongoose.Promise = global.Promise;

// Configure Mongoose
mongoose.connect(`mongodb:${config.get('DBHost')}`, { useNewUrlParser: true });
if (isDev) {
  mongoose.set('debug', true);
}

export interface IDbMetada extends mongoose.Document {
  version: number;
}

const DbMetadaSchema = new mongoose.Schema<IDbMetada>({ version: Number });

const DbMetadatas = mongoose.model<IDbMetada>('DbMetadatas', DbMetadaSchema);
export default DbMetadatas;
