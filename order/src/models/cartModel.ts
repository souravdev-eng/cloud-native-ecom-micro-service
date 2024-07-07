import { Schema } from 'mongoose';

const cartSchema = new Schema({
  quantity: Number,
  userId: String,
  total: Number,
});
