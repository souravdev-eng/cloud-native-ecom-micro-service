import mongoose from 'mongoose';

// Cart - local copy of cart data from cart service
export interface CartDocument extends mongoose.Document {
  id: string;
  cartId: string; // Original cart ID from cart service
  userId: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  sellerId: string;
  productQuantity: number; // Available product quantity
  cartQuantity: number; // Quantity in cart
  total: number;
  version: number; // For optimistic concurrency control
  createdAt: Date;
  updatedAt: Date;
}

interface CartAttrs {
  cartId: string;
  userId: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  sellerId: string;
  productQuantity: number;
  cartQuantity: number;
  total: number;
  version?: number;
}

interface CartModel extends mongoose.Model<CartDocument> {
  build(attrs: CartAttrs): CartDocument;
  findByEvent(data: { cartId: string; version: number }): Promise<CartDocument | null>;
}

const cartSchema = new mongoose.Schema(
  {
    cartId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    productTitle: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    productImage: {
      type: String,
      required: true,
    },
    sellerId: {
      type: String,
      required: true,
    },
    productQuantity: {
      type: Number,
      required: true,
    },
    cartQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    total: {
      type: Number,
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Static method to build a cart
cartSchema.statics.build = (attrs: CartAttrs) => {
  return new Cart({
    ...attrs,
    version: attrs.version || 0,
  });
};

// Static method to find by event with version check
cartSchema.statics.findByEvent = (data: { cartId: string; version: number }) => {
  return Cart.findOne({
    cartId: data.cartId,
    version: data.version - 1, // Previous version
  });
};

// Optimistic concurrency control
cartSchema.pre('save', function (done) {
  // Only increment version on updates, not creation
  if (this.isModified() && !this.isNew) {
    this.increment();
  }
  done();
});

// Indexes for efficient queries
cartSchema.index({ cartId: 1 }, { unique: true });
cartSchema.index({ userId: 1 });
cartSchema.index({ productId: 1 });
cartSchema.index({ userId: 1, createdAt: -1 });

const Cart = mongoose.model<CartDocument, CartModel>('Cart', cartSchema);

export { Cart };
