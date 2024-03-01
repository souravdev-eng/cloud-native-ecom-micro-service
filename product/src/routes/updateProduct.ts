import {
  restrictTo,
  requireAuth,
  NotFoundError,
  BadRequestError,
  requestValidation,
} from "@ecom-micro/common";
import { Router, Response, Request, NextFunction } from "express";
import { natsWrapper } from "../natsWrapper";
import { Product } from "../models/productModel";
import { productUpdateValidation } from "../validation/productValidation";
import { ProductUpdatedPublisher } from "../events/publishers/productUpdatedPublisher";

const router = Router();

router.patch(
  "/api/product/:id",
  requireAuth,
  restrictTo("seller", "admin"),
  productUpdateValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const category = ["phone", "book", "Fashions", "other"];

    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new NotFoundError("Oops! Product is not found");
    }

    if (!category.includes(req.body.category)) {
      return next(new BadRequestError("Oops! Product category is invalid"));
    }

    product.set({
      title: req.body.title ? req.body.title : product.title,
      category: req.body.category ? req.body.category : product.category,
      description: req.body.description
        ? req.body.description
        : product.description,
      image: req.body.image ? req.body.image : product.image,
      price: req.body.price ? req.body.price : product.price,
    });

    await product.save();

    new ProductUpdatedPublisher(natsWrapper.client).publish({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      sellerId: product.sellerId,
    });

    res.status(200).send(product);
  }
);

export { router as productUpdateRouter };
