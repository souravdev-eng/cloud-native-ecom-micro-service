import mongoose from 'mongoose';

enum Category {
  Phone = 'phone',
  Book = 'book',
  Fashions = 'Fashions',
  other = 'other',
}

interface ProductAttars {
  title: string;
  price: number;
  image: string;
  sellerId: string;
  description: string;
  category: Category;
}

interface ProductDoc extends mongoose.Document {
  title: string;
  price: number;
  image: string;
  sellerId: string;
  description: string;
  category: Category;
}

interface ProductModel extends mongoose.Model<ProductDoc> {
  build(attars: ProductAttars): ProductDoc;
}

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Category,
      default: Category.other,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 100,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    sellerId: {
      type: String,
      required: true,
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

productSchema.statics.build = (attars: ProductAttars) => {
  return new Product(attars);
};

const Product = mongoose.model<ProductDoc, ProductModel>('Product', productSchema);

export { Product };
