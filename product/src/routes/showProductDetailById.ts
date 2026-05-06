import { NotFoundError, requireAuth } from "@ecom-micro/common";
import { Router, Response, Request, NextFunction } from "express";
import { Product } from "../models/productModel";
import { cache } from "../cache/redisCache";

const router = Router();

router.get(
  "/api/product/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    const redisKey = `product:${req.params.id}`;

    const cachedProduct = await cache.get(redisKey);

    if (cachedProduct !== null) {
      console.log("Return from Cache...");

      res.status(200).send(cachedProduct);
    } else {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new NotFoundError("Oops! Product is not found"));
      }
      await cache.set(redisKey, product);
      console.log("Return from Mongo...");
      res.status(200).send(product);
    }
  },
);

export { router as showProductDetailByIdRouter };
