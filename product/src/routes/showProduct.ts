import { requireAuth } from '@ecom-micro/common';
import { Router, Response, Request, NextFunction } from 'express';
import { Product } from '../models/productModel';
import { ProductAPIFeature } from '../utils/productApiFeature';
import { redisClient } from '../redisClient';
import { generateSearchCacheKey, shouldCache } from '../utils/cacheKeys';
import { calculateTTL } from '../utils/calculateTTL';

const router = Router();

router.get('/api/product', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const shouldCacheResult = shouldCache(req.query);
  let cacheKey = '';

  // Check cache first if this query type should be cached
  if (shouldCacheResult) {
    cacheKey = generateSearchCacheKey(req.query);
    const cachedProduct = await redisClient.get(cacheKey);

    if (cachedProduct) {
      res.status(200).send(JSON.parse(cachedProduct));
      return;
    }
  }

  const productApiFeature = new ProductAPIFeature(Product.find({}), req.query)
    .filter()
    .sort()
    .search()
    .limitFields()
    .paginate();

  const product = await productApiFeature.executePaginated();

  // Cache the result if appropriate
  if (shouldCacheResult && product.data.length > 0) {
    const ttl = req.query.search ? calculateTTL(60, 'minutes') : calculateTTL(10, 'minutes');
    await redisClient.set(cacheKey, JSON.stringify(product), { EX: ttl });
  }

  res.status(200).send(product);
});

export { router as showProductRouter };
