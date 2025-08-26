// ProductAPIFeature.ts
import { Query as MongooseQuery, Document, Types } from 'mongoose';
import { Request } from 'express';

export interface PaginationOptions {
  limit?: number;
  nextKey?: string;
  prevKey?: string;
  page?: number; // used only in search mode
}

export interface PaginationMeta {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextKey?: string;
  prevKey?: string;
  count: number; // items in this page
  limit: number;
  page?: number; // only in search mode
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * ProductAPIFeature
 * - filter(): gte/gt/lte/lt casting support
 * - search(): $text relevance mode (sets projection for textScore)
 * - sort(): relevance-first sort in search mode; stable sort otherwise
 * - limitFields(): never drops _id and sortField
 * - paginate(): page/skip for search; cursor (nextKey/prevKey) otherwise
 * - executePaginated(): returns data + meta (keys or page number)
 */
export class ProductAPIFeature<T extends Document> {
  query: MongooseQuery<T[], T>;
  queryString: Request['query'];

  private sortField: string = 'createdAt';
  private sortOrder: 1 | -1 = -1;

  constructor(query: MongooseQuery<T[], T>, queryString: Request['query']) {
    this.query = query;
    this.queryString = queryString;
  }

  // ---------- Helpers ----------

  private isSearchMode(): boolean {
    return typeof this.queryString.search === 'string' && this.queryString.search.trim().length > 0;
  }

  private getValidatedLimit(): number {
    const limit = parseInt(this.queryString.limit as string) || 20;
    return Math.min(Math.max(limit, 1), 100);
  }

  private ensureNumber(n: any): number | undefined {
    if (n === undefined || n === null) return undefined;
    const val = Number(n);
    return Number.isFinite(val) ? val : undefined;
  }

  // ---------- Pipeline steps ----------

  filter(): this {
    const queryObj: Record<string, any> = { ...this.queryString };
    const excludedFields = ['limit', 'nextKey', 'prevKey', 'sort', 'fields', 'search', 'page'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Support gte/gt/lte/lt operators in query string: e.g. price[gte]=100
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Parse then attempt basic type coercion for numbers/dates where appropriate (optional)
    const parsed = JSON.parse(queryStr);

    // Example basic casting for known numeric fields (customize as needed)
    if (parsed.price) {
      if (typeof parsed.price === 'object') {
        for (const k of Object.keys(parsed.price)) {
          const maybeNum = this.ensureNumber(parsed.price[k]);
          if (maybeNum !== undefined) parsed.price[k] = maybeNum;
        }
      } else {
        const maybeNum = this.ensureNumber(parsed.price);
        if (maybeNum !== undefined) parsed.price = maybeNum;
      }
    }

    this.query = this.query.find(parsed);
    return this;
  }

  search(): this {
    if (this.isSearchMode()) {
      const search = (this.queryString.search as string).trim();
      // Add text filter and project text score (so we can sort by it in sort())
      this.query = this.query
        .find({ $text: { $search: search } })
        .select({ score: { $meta: 'textScore' } });
    }
    return this;
  }

  sort(): this {
    if (this.isSearchMode()) {
      // Relevance-first, then _id for stability
      this.query = this.query.sort({ score: { $meta: 'textScore' }, _id: -1 });
      // We cannot cursor-paginate by score; mark a stable field anyway
      this.sortField = '_id';
      this.sortOrder = -1;
      return this;
    }

    if (this.queryString.sort) {
      const sortFields = (this.queryString.sort as string).split(',');
      const sortBy = sortFields.join(' ');
      this.query = this.query.sort(sortBy);

      // Capture primary sort field + order
      const primarySort = sortFields[0];
      if (primarySort.startsWith('-')) {
        this.sortField = primarySort.substring(1);
        this.sortOrder = -1;
      } else {
        this.sortField = primarySort;
        this.sortOrder = 1;
      }
    } else {
      // Default to _id desc for stable pagination
      this.query = this.query.sort('-_id');
      this.sortField = '_id';
      this.sortOrder = -1;
    }

    return this;
  }

  limitFields(): this {
    const mustKeep = new Set<string>(['_id', this.sortField]);

    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      fields.forEach((f) => mustKeep.add(f));

      const select: Record<string, 1> = {};
      for (const f of mustKeep) select[f] = 1;
      this.query = this.query.select(select);
    } else {
      // Default selection: remove __v (keep _id by default)
      this.query = this.query.select('-__v');
      // If you had excluded fields elsewhere, ensure sortField is not excluded
    }

    return this;
  }

  paginate(): this {
    const validatedLimit = this.getValidatedLimit();

    if (this.isSearchMode()) {
      // Offset paging for relevance mode
      const page = Math.max(parseInt(this.queryString.page as string) || 1, 1);
      const skip = (page - 1) * validatedLimit;

      // Fetch one extra to detect next page reliably
      this.query = this.query.skip(skip).limit(validatedLimit + 1);
      return this;
    }

    // Cursor mode (non-search)
    const nextKey = this.queryString.nextKey as string;
    const prevKey = this.queryString.prevKey as string;

    if (nextKey) {
      this.applyForwardPagination(nextKey, validatedLimit);
    } else if (prevKey) {
      this.applyBackwardPagination(prevKey, validatedLimit);
    } else {
      // First page: get one extra
      this.query = this.query.limit(validatedLimit + 1);
    }

    return this;
  }

  // ---------- Cursor pagination (non-search) ----------

  private applyForwardPagination(nextKey: string, limit: number): void {
    const { value, id } = this.decodeKey(nextKey);

    if (value === null) {
      // Legacy id-only key
      const condition = {
        _id: { [this.sortOrder === 1 ? '$gt' : '$lt']: new Types.ObjectId(id) },
      };
      this.query = this.query.find(condition).limit(limit + 1);
      return;
    }

    const condition = this.buildPaginationCondition(value, id, 'forward');
    this.query = this.query.find(condition).limit(limit + 1);
  }

  private applyBackwardPagination(prevKey: string, limit: number): void {
    const { value, id } = this.decodeKey(prevKey);
    const condition = this.buildPaginationCondition(value, id, 'backward');

    // Reverse sort temporarily to fetch the previous page
    const reversedSort = this.sortOrder === 1 ? `-${this.sortField}` : this.sortField;
    this.query = this.query
      .find(condition)
      .sort(reversedSort)
      .limit(limit + 1);
  }

  private buildPaginationCondition(value: any, id: string, direction: 'forward' | 'backward'): any {
    const isForward = direction === 'forward';
    const isAscending = this.sortOrder === 1;

    let operator: '$gt' | '$lt';
    if (isForward) {
      operator = isAscending ? '$gt' : '$lt';
    } else {
      operator = isAscending ? '$lt' : '$gt';
    }

    let sortValue: any = value;

    // Cast only when appropriate for the active sortField
    if (this.sortField === '_id') {
      sortValue = new Types.ObjectId(value);
    } else if (this.sortField === 'createdAt' || this.sortField === 'updatedAt') {
      sortValue = new Date(value);
    } else if (typeof value === 'string' && !isNaN(Number(value))) {
      // numeric sort fields
      sortValue = Number(value);
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
    return Buffer.from(JSON.stringify({ value, id })).toString('base64url');
  }

  private decodeKey(key: string): { value: any; id: string } {
    try {
      const decoded = Buffer.from(key, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);

      // Accept legacy (id-only) keys
      if (!('value' in parsed) && 'id' in parsed) {
        console.warn('Legacy key format detected; please regenerate pagination keys.');
        return { value: null, id: parsed.id };
      }

      if (!('id' in parsed) || !('value' in parsed)) {
        throw new Error('Key must contain both value and id');
      }
      return parsed;
    } catch (err) {
      throw new Error('Invalid key format');
    }
  }

  // ---------- Execute + build meta ----------

  async executePaginated(): Promise<PaginatedResult<T>> {
    const validatedLimit = this.getValidatedLimit();

    // Execute
    const results = await this.query.exec();

    // SEARCH MODE (offset-based)
    if (this.isSearchMode()) {
      const page = Math.max(parseInt(this.queryString.page as string) || 1, 1);

      const hasNextPage = results.length > validatedLimit;
      const hasPrevPage = page > 1;

      const data = hasNextPage ? results.slice(0, validatedLimit) : results;

      return {
        data,
        meta: {
          hasNextPage,
          hasPrevPage,
          count: data.length,
          limit: validatedLimit,
          page,
        },
      };
    }

    // CURSOR MODE (non-search)
    const isPrevPagination = !!this.queryString.prevKey;
    let data: T[];
    let hasNextPage: boolean;
    let hasPrevPage: boolean;

    if (isPrevPagination) {
      // When going backward we fetched with reversed sort
      // Reverse results back to requested sort order
      data = results.reverse();
      // Coming from a next page implies there's a next when going back
      hasNextPage = true;
      hasPrevPage = data.length > validatedLimit;

      if (hasPrevPage) data = data.slice(1); // drop the extra one
    } else {
      hasNextPage = results.length > validatedLimit;
      hasPrevPage = !!this.queryString.nextKey || !!this.queryString.prevKey;
      data = hasNextPage ? results.slice(0, validatedLimit) : results;
    }

    const meta: PaginationMeta = {
      hasNextPage,
      hasPrevPage,
      count: data.length,
      limit: validatedLimit,
    };

    // Keys
    if (data.length > 0) {
      // Next key
      if (hasNextPage) {
        const lastItem = data[data.length - 1] as any;
        const sortValue = lastItem[this.sortField];
        meta.nextKey = this.encodeKey(sortValue, lastItem._id.toString());
      }

      // Prev key
      if (hasPrevPage) {
        const firstItem = data[0] as any;
        const sortValue = firstItem[this.sortField];
        meta.prevKey = this.encodeKey(sortValue, firstItem._id.toString());
      }
    }

    return { meta, data };
  }
}
