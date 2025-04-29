import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

enum Roles {
    User = 'user',
    Seller = 'seller',
    Admin = 'admin',
}

interface UserAttars {
    name: string;
    email: string;
    password: string;
    passwordConform?: any;
    role: Roles;
    resetToken?: string | null;
}

interface UserDoc extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    passwordConform: any;
    role: Roles;
    resetToken?: string | null;
    isModified(field: string): boolean;
}

interface UserModel extends mongoose.Model<UserDoc> {
    build(attars: UserAttars): UserDoc;
}

const userSchema = new mongoose.Schema(
    {
        name: String,
        email: {
            type: String,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        passwordConform: {
            type: String,
        },
        role: {
            type: String,
            enum: ['user', 'seller', 'admin'],
            default: 'user',
        },
        resetToken: String,
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
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 12);
        // @ts-ignore
        this.passwordConfirm = undefined;
        next();
    } catch (error) {
        console.log('Error while encrypt the password 💥');
    }
});

userSchema.post('save', (doc, next) => {
    doc.passwordConform = null;
    next();
});

userSchema.statics.build = (attars: UserAttars) => {
    return new User(attars);
};

const User = mongoose.model<UserDoc, UserModel>('user', userSchema);

export { User };
