import mongoose from 'mongoose';

// Interface for OrderCart document
export interface OrderCartDoc extends mongoose.Document {
    id: string;
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
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

// Interface for creating OrderCart
interface OrderCartAttrs {
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
    version: number;
}

// Interface for Model with static methods
interface OrderCartModel extends mongoose.Model<OrderCartDoc> {
    build(attrs: OrderCartAttrs): OrderCartDoc;
}

const orderCartSchema = new mongoose.Schema(
    {
        cartId: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
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

// Static build method
orderCartSchema.statics.build = (attrs: OrderCartAttrs) => {
    return new OrderCart(attrs);
};

// Indexes
orderCartSchema.index({ cartId: 1 }, { unique: true });
orderCartSchema.index({ userId: 1, createdAt: -1 });

const OrderCart = mongoose.model<OrderCartDoc, OrderCartModel>('Cart', orderCartSchema);

export { OrderCart };

