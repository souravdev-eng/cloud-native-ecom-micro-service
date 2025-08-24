import { Query as MongooseQuery, Document } from 'mongoose';
import { Request } from 'express';
import { Types } from 'mongoose';

export interface PaginationOptions {
  limit?: number;
  nextKey?: string;
  prevKey?: string;
}

export interface PaginationMeta {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextKey?: string;
  prevKey?: string;
  count: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export class ProductAPIFeature<T extends Document> {
  query: MongooseQuery<T[], T>;
  queryString: Request['query'];
  private sortField: string = 'createdAt';
  private sortOrder: 1 | -1 = -1;

  constructor(query: MongooseQuery<T[], T>, queryString: Request['query']) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ['limit', 'nextKey', 'prevKey', 'sort', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(',').join(' ');
      this.query = this.query.sort(sortBy);

      // Extract primary sort field and order for pagination
      const sortFields = (this.queryString.sort as string).split(',');
      const primarySort = sortFields[0];

      if (primarySort.startsWith('-')) {
        this.sortField = primarySort.substring(1);
        this.sortOrder = -1;
      } else {
        this.sortField = primarySort;
        this.sortOrder = 1;
      }
    } else {
      // Default sort - check if createdAt exists, otherwise use _id
      this.query = this.query.sort('-_id'); // Using _id as fallback
      this.sortField = '_id';
      this.sortOrder = -1;
    }

    console.log('Sort configuration:', { sortField: this.sortField, sortOrder: this.sortOrder });
    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate(): this {
    const limit = parseInt(this.queryString.limit as string) || 20;
    const nextKey = this.queryString.nextKey as string;
    const prevKey = this.queryString.prevKey as string;

    // Validate limit bounds (prevent abuse)
    const validatedLimit = Math.min(Math.max(limit, 1), 100);

    if (nextKey) {
      this.applyForwardPagination(nextKey, validatedLimit);
    } else if (prevKey) {
      this.applyBackwardPagination(prevKey, validatedLimit);
    } else {
      // First page
      this.query = this.query.limit(validatedLimit + 1);
    }

    return this;
  }

  private applyForwardPagination(nextKey: string, limit: number): void {
    try {
      const decodedKey = this.decodeKey(nextKey);
      const { value, id } = decodedKey;

      // If value is null (legacy format), use simple id-based pagination
      if (value === null) {
        const condition = {
          _id: { [this.sortOrder === 1 ? '$gt' : '$lt']: new Types.ObjectId(id) },
        };
        this.query = this.query.find(condition).limit(limit + 1);
      } else {
        const condition = this.buildPaginationCondition(value, id, 'forward');
        this.query = this.query.find(condition).limit(limit + 1);
      }
    } catch (error) {
      console.error('Forward pagination error:', error);
      throw new Error('Invalid pagination key');
    }
  }

  private applyBackwardPagination(prevKey: string, limit: number): void {
    try {
      const decodedKey = this.decodeKey(prevKey);
      const { value, id } = decodedKey;

      const condition = this.buildPaginationCondition(value, id, 'backward');

      // For backward pagination, we need to reverse the sort order temporarily
      const reversedSort = this.sortOrder === 1 ? `-${this.sortField}` : this.sortField;
      this.query = this.query
        .find(condition)
        .sort(reversedSort)
        .limit(limit + 1);
    } catch (error) {
      throw new Error('Invalid pagination key');
    }
  }

  private buildPaginationCondition(value: any, id: string, direction: 'forward' | 'backward'): any {
    const isForward = direction === 'forward';
    const isAscending = this.sortOrder === 1;

    let operator: string;
    if (isForward) {
      operator = isAscending ? '$gt' : '$lt';
    } else {
      operator = isAscending ? '$lt' : '$gt';
    }

    // Handle different data types for the sort field
    let sortValue = value;
    if (this.sortField === 'createdAt' || this.sortField === 'updatedAt') {
      sortValue = new Date(value);
    } else if (Types.ObjectId.isValid(value)) {
      sortValue = new Types.ObjectId(value);
    }

    return {
      $or: [
        { [this.sortField]: { [operator]: sortValue } },
        {
          [this.sortField]: sortValue,
          _id: { [operator]: new Types.ObjectId(id) },
        },
      ],
    };
  }

  private encodeKey(value: any, id: string): string {
    const keyData = { value, id };
    return Buffer.from(JSON.stringify(keyData)).toString('base64url');
  }

  private decodeKey(key: string): { value: any; id: string } {
    try {
      const decoded = Buffer.from(key, 'base64url').toString('utf8');
      const parsedKey = JSON.parse(decoded);

      // Handle legacy format with only id
      if (parsedKey.id && !parsedKey.value) {
        console.warn('Legacy key format detected, please regenerate pagination keys');
        return { value: null, id: parsedKey.id };
      }

      if (!parsedKey.value || !parsedKey.id) {
        throw new Error('Key must contain both value and id');
      }

      return parsedKey;
    } catch (error) {
      console.error('Key decoding error:', error);
      throw new Error('Invalid key format');
    }
  }

  async executePaginated(): Promise<PaginatedResult<T>> {
    const limit = parseInt(this.queryString.limit as string) || 20;
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    const isPrevPagination = !!this.queryString.prevKey;

    // Debug logging
    console.log('Pagination params:', {
      limit: validatedLimit,
      nextKey: this.queryString.nextKey,
      prevKey: this.queryString.prevKey,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
    });

    // Execute query with +1 to check for next page
    const results = await this.query.exec();
    console.log('Query results count:', results.length);

    let data: T[];
    let hasNextPage: boolean;
    let hasPrevPage: boolean;

    if (isPrevPagination) {
      // For backward pagination, we need to reverse the results and handle differently
      data = results.reverse();
      hasNextPage = true; // We know there's a next page since we came from there
      hasPrevPage = data.length > validatedLimit;

      if (hasPrevPage) {
        data = data.slice(1); // Remove the extra item
      }
    } else {
      // Forward pagination or first page
      hasNextPage = results.length > validatedLimit;
      hasPrevPage = !!this.queryString.nextKey || !!this.queryString.prevKey;

      if (hasNextPage) {
        data = results.slice(0, validatedLimit);
      } else {
        data = results;
      }
    }

    const meta: PaginationMeta = {
      hasNextPage,
      hasPrevPage,
      count: data.length,
      limit: validatedLimit,
    };

    // Generate next and previous keys
    if (data.length > 0) {
      if (hasNextPage) {
        const lastItem = data[data.length - 1];
        const sortValue = lastItem[this.sortField as keyof T];
        console.log('Generating nextKey with:', {
          sortField: this.sortField,
          sortValue,
          id: lastItem._id.toString(),
        });
        meta.nextKey = this.encodeKey(sortValue, lastItem._id.toString());
      }

      if (hasPrevPage) {
        const firstItem = data[0];
        const sortValue = firstItem[this.sortField as keyof T];
        meta.prevKey = this.encodeKey(sortValue, firstItem._id.toString());
      }
    }

    console.log('Pagination meta:', meta);
    return { data, meta };
  }

  // Legacy method for backward compatibility
  async execute(): Promise<T[]> {
    const result = await this.executePaginated();
    return result.data;
  }
}
