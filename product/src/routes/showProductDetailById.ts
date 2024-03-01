import { NotFoundError, requireAuth } from "@ecom-micro/common";
import { Router, Response, Request, NextFunction } from "express";
import { Product } from "../models/productModel";

const router = Router();

router.get(
  "/api/product/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new NotFoundError("Oops! Product is not found"));
    }

    res.status(200).send(product);
  }
);

export { router as showProductDetailByIdRouter };
