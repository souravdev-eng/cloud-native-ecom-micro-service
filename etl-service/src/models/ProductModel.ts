import mongoose from 'mongoose';

enum Category {
    Phone = 'phone',
    earphone = 'earphone',
    Book = 'book',
    Fashions = 'fashions',
    other = 'other',
}

interface ProductAttrs {
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
