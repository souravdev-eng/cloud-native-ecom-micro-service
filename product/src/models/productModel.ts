import mongoose from 'mongoose';

enum Category {
  Phone = 'phone',
  earphone = 'earphone',
  Book = 'book',
  Fashions = 'fashions',
  other = 'other',
}

interface ProductAttars {
  title: string;
  price: number;
  image: string;
  sellerId: string;
  description: string;
  quantity?: number;
  category: Category;
  tags?: string[];
  rating?: number;
}

interface ProductDoc extends mongoose.Document {
  title: string;
  price: number;
  image: string;
  sellerId: mongoose.Types.ObjectId;
  description: string;
  quantity?: number;
  category: Category;
  tags?: string[];
  rating: number;
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
      // enum: Category,
      default: Category.other,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      min: 100,
      required: true,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    quantity: {
      type: Number,
      default: 5,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Text index for search
productSchema.index(
  { title: 'text', tags: 'text' },
  {
    name: 'TextSearch_title_tags',
    weights: { title: 10, tags: 2 },
  }
);

// Filter/sort indexes
productSchema.index({ category: 1, price: -1 });
productSchema.index({ sellerId: 1, category: 1 });

// Optional: only index in-stock items for faster “available” queries
productSchema.index({ quantity: 1 }, { partialFilterExpression: { quantity: { $gt: 0 } } });

productSchema.statics.build = (attars: ProductAttars) => {
  return new Product(attars);
};

const Product = mongoose.model<ProductDoc, ProductModel>('Product', productSchema);

export { Product };
