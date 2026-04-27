import { Router, Response, Request, NextFunction } from "express";
import { NotFoundError, requireAuth, restrictTo } from "@ecom-micro/common";

import { cache } from "../cache/redisCache";
import { Product } from "../models/productModel";
import { rabbitMQWrapper } from "../rabbitMQWrapper";
import { ProductDeletePub } from "../queues/publisher/productDeletePub";

const router = Router();

router.delete(
  "/api/product/:id",
  requireAuth,
  restrictTo("seller"),
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return next(new NotFoundError("Oops! Product is not found"));
    }

    await cache.del(`product:${req.params.id}`);
    await new ProductDeletePub(rabbitMQWrapper.channel).publish({
      id: product.id,
    });
    res.status(200).send({ product: null });
  },
);

export { router as productDeleteRouter };
