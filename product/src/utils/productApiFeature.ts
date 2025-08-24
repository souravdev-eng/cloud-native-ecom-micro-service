import { Query as MongooseQuery, Document } from 'mongoose';
import { Request } from 'express';

export class ProductAPIFeature<T extends Document> {
  query: MongooseQuery<T[], T>;
  queryString: Request['query'];

  constructor(query: MongooseQuery<T[], T>, queryString: Request['query']) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFiled = ['limit', 'nextKey', 'sort', 'fields'];
    excludedFiled.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    //
  }

  paginate() {
    //
  }
}
