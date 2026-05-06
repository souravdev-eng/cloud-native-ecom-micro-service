import mongoose from 'mongoose';

interface ProductAttrs {
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
    category: string;
    tags?: string[];
    originalPrice: number;
    stockQuantity: number;
}

interface ProductModel extends mongoose.Model<ProductDoc> {
    build(attrs: ProductAttrs): ProductDoc;
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
        originalPrice: {
            type: Number,
            required: true,
        },
        stockQuantity: {
            type: Number,
            required: true,
        },
    },
    {
        toJSON: {
            transform(_: any, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

productSchema.statics.build = (attrs: ProductAttrs) => {
    return new Product(attrs);
};

const Product = mongoose.model<ProductDoc, ProductModel>('Product', productSchema);

export { Product, ProductDoc };
