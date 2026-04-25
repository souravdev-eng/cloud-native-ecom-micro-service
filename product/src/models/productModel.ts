import mongoose from "mongoose";

interface ProductAttars {
  title: string;
  price: number;
  image: string;
  sellerId: string;
  description: string;
  quantity?: number;
  category: string;
  tags?: string[];
  originalPrice: number;
  stockQuantity: number;
}

interface ProductDoc extends mongoose.Document {
  title: string;
  price: number;
  image: string;
  sellerId: mongoose.Types.ObjectId;
  description: string;
  quantity?: number;
  rating: number;
  originalPrice: number;
  stockQuantity: number;
  tags: string[];
  category: string;
}

interface ProductModel extends mongoose.Model<ProductDoc> {
  build(attars: ProductAttars): ProductDoc;
}

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "other",
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      min: 10,
      max: 5000000,
      required: true,
    },
    rating: {
      type: Number,
      // default: 4.5,
    },
    quantity: {
      type: Number,
      default: 5,
    },
    stockQuantity: {
      type: Number,
      min: 5,
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

// Text index for search.
//
// MongoDB allows exactly one text index per collection, and the engine
// matches `$text: { $search: ... }` against ALL fields included here.
// Title is the most precise signal; tags are curated, low-noise
// keywords; description is useful but noisy. Weights are relative —
// what matters is the ratio.
//
// Migration note: this replaces the previous `TextSearch_title` index
// (title-only). MongoDB will not reshape an existing text index in
// place — Mongoose's ensureIndex / autoIndex logs an error and leaves
// the old one. To roll the change out, run the one-shot migration:
//
//   npm run migrate:text-index
//
// (See product/src/migrations/2026-04-25-product-text-index.ts.)
// The script is idempotent and safe to run multiple times.
productSchema.index(
  { title: "text", tags: "text", description: "text" },
  {
    name: "ProductTextIndex",
    weights: { title: 10, tags: 5, description: 1 },
    default_language: "english",
  },
);

productSchema.index(
  {
    category: 1,
    price: -1,
    quantity: 1,
  },
  { name: "category_1_price_-1_quantity1" },
);

// Filter/sort indexes
// productSchema.index({ category: 1, price: -1 });
// productSchema.index({ sellerId: 1, category: 1 });

// // Optional: only index in-stock items for faster “available” queries
// productSchema.index({ quantity: 1 }, { partialFilterExpression: { quantity: { $gt: 0 } } });

productSchema.statics.build = (attars: ProductAttars) => {
  return new Product(attars);
};

const Product = mongoose.model<ProductDoc, ProductModel>("Product", productSchema);

export { Product };
