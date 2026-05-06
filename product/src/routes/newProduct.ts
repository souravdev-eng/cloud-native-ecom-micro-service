import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, restrictTo, requestValidation, NotAuthorizedError } from '@ecom-micro/common';
import { productValidation } from '../validation/productValidation';
import { Product } from '../models/productModel';
import { rabbitMQWrapper } from '../rabbitMQWrapper';
import { ProductCreatedPub } from '../queues/publisher/productCreatedPub';
import { uploadImageToAws } from '../services/uploadImageToAws';

const router = Router();

router.post(
  '/api/product/new',
  requireAuth,
  restrictTo('seller'),
  productValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req?.user?.id;

    if (!sellerId) {
      throw new NotAuthorizedError();
    }

    // Take the image as a base64 string
    const image = req.body.image;
    const contentType = req.body.contentType || 'image/jpeg';

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const ext = extMap[contentType] || 'jpg';

    const sanitizedTitle = req.body.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${req.body.category}/${sellerId}/${sanitizedTitle}-${Date.now()}.${ext}`;

    const uploadedImageUrl = await uploadImageToAws(fileName, image, contentType);

    const product = Product.build({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      image: uploadedImageUrl,
      sellerId: sellerId,
      originalPrice: req.body.originalPrice,
      price: req.body.price,
      stockQuantity: req.body.stockQuantity,
      quantity: req.body.quantity,
      tags: req.body.tags,
    });

    await product.save();

    new ProductCreatedPub(rabbitMQWrapper.channel).publish({
      id: product.id,
      title: product.title,
      price: product.price,
      sellerId: product.sellerId.toString(),
      image: product.image,
      quantity: product.quantity!,
      category: product.category,
      originalPrice: product.originalPrice!,
      stockQuantity: product.stockQuantity!,
      tags: product.tags || [],
    });

    res.status(201).send(product);
  }
);

export { router as newProductRouter };
