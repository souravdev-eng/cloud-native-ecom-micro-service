import mongoose from 'mongoose';

interface UserAttars {
  id: string;
  email: string;
  role: string;
}

interface UserDoc extends mongoose.Document {
  id: string;
  email: string;
  role: string;
}

interface UserModel extends mongoose.Model<UserDoc> {
  build(attars: UserAttars): UserDoc;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
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

userSchema.statics.build = (attars: UserAttars) => {
  return new User(attars);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
