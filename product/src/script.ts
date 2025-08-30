import mongoose from 'mongoose';
import { Product } from './models/productModel'; // adjust import

// helper to run queries with explain
async function runExplain(label: string, query: any, options: any = {}) {
  const cursor = Product.find(query, null, options).cursor();
  const plan = await Product.collection.find(query, options).explain('executionStats');

  console.log(`\n--- ${label} ---`);
  console.log('Query:', JSON.stringify(query), 'Options:', options);
  console.log('Winning Plan:', plan.queryPlanner.winningPlan.stage);
  console.log('Docs Examined:', plan.executionStats.totalDocsExamined);
  console.log('Docs Returned:', plan.executionStats.nReturned);
  console.log('Execution Time (ms):', plan.executionStats.executionTimeMillis);
}

export async function main() {
  await mongoose.connect(process.env.PRODUCT_SERVICE_MONGODB_URL!, {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWORD,
  }); // change DB name

  // 1. Text search
  await runExplain('Text Search (title+tags)', { $text: { $search: 'Apple Air' } });

  // 2. Category + price sort
  await runExplain('Category filter + Price sort', { category: 'ipad' }, { sort: { price: -1 } });

  // 3. Seller + Category
  await runExplain('Seller + Category', {
    sellerId: new mongoose.Types.ObjectId('64afee9fd75b22e8eaa11111'),
    category: 'ipad',
  });

  // 4. In-stock products
  await runExplain('In-stock products', { quantity: { $gt: 0 } });

  // 5. Global price sort
  await runExplain('Global Price sort', {}, { sort: { price: -1 }, limit: 20 });

  // 6. Exact tag filter
  await runExplain('Tag filter (exact match)', { tags: 'apple' });

  await mongoose.disconnect();
}
