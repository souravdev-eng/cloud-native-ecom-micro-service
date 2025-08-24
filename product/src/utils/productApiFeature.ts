import { Query as MongooseQuery, Document } from 'mongoose';

interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

interface QueryString {
  [key: string]: string | string[] | ParsedQs | ParsedQs[] | undefined;
}

export class ProductAPIFeature<T extends Document> {
  query: MongooseQuery<T[], T>;
  queryString: QueryString;

  constructor(query: MongooseQuery<T[], T>, queryString: ParsedQs) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFiled = ['limit', 'nextKey', 'sort', 'fields'];
    excludedFiled.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    //
  }

  limitFields() {
    //
  }

  paginate() {
    //
  }
}
