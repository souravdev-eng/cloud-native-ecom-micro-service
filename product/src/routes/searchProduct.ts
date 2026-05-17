import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, BadRequestError } from "@ecom-micro/common";
import { getElasticClient, isElasticAvailable, PRODUCT_INDEX } from "../services/elasticClient";
import { Product } from "../models/productModel";

const router = Router();

// ----------------------------------------------------------------
// Natural language query parser
// Extracts price/rating constraints from user queries like:
//   "Book under 500", "laptop below 1000", "phone above 200",
//   "shirt between 100 and 500", "cheap headphones", "rated above 4"
// ----------------------------------------------------------------
interface ParsedQuery {
  searchText: string;
  priceMax?: number;
  priceMin?: number;
  minRating?: number;
  sortByPrice?: "asc" | "desc";
}

function parseNaturalQuery(raw: string): ParsedQuery {
  let text = raw;
  const result: ParsedQuery = { searchText: "" };

  // "between X and Y" → price range
  const betweenRe = /\b(?:between|from)\s+(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)\b/i;
  const betweenMatch = text.match(betweenRe);
  if (betweenMatch) {
    result.priceMin = parseFloat(betweenMatch[1]);
    result.priceMax = parseFloat(betweenMatch[2]);
    text = text.replace(betweenMatch[0], "");
  }

  // "under/below/less than/max/upto X" → price max
  if (!result.priceMax) {
    const underRe =
      /\b(?:under|below|less\s+than|max|upto|up\s+to|within|cheaper\s+than)\s+(\d+(?:\.\d+)?)\b/i;
    const underMatch = text.match(underRe);
    if (underMatch) {
      result.priceMax = parseFloat(underMatch[1]);
      text = text.replace(underMatch[0], "");
    }
  }

  // "above/over/more than/min/starting X" → price min
  if (!result.priceMin) {
    const overRe =
      /\b(?:above|over|more\s+than|min|minimum|starting|starts?\s+from|from)\s+(\d+(?:\.\d+)?)\b/i;
    const overMatch = text.match(overRe);
    if (overMatch) {
      result.priceMin = parseFloat(overMatch[1]);
      text = text.replace(overMatch[0], "");
    }
  }

  // "rated above/over X" or "rating above X" → min rating
  const ratingRe =
    /\b(?:rated?|rating|stars?)\s*(?:above|over|at\s+least|min|>)\s*(\d+(?:\.\d+)?)\b/i;
  const ratingMatch = text.match(ratingRe);
  if (ratingMatch) {
    result.minRating = parseFloat(ratingMatch[1]);
    text = text.replace(ratingMatch[0], "");
  }

  // "cheap" → under 500, sort asc; "expensive" → above 1000, sort desc
  if (/\bcheap(?:est)?\b/i.test(text)) {
    if (!result.priceMax) result.priceMax = 500;
    result.sortByPrice = "asc";
    text = text.replace(/\bcheap(?:est)?\b/i, "");
  }
  if (/\bexpensive\b/i.test(text)) {
    if (!result.priceMin) result.priceMin = 1000;
    result.sortByPrice = "desc";
    text = text.replace(/\bexpensive\b/i, "");
  }

  // "sort by price" / "lowest price" / "highest price"
  if (/\b(?:lowest|low)\s*price\b/i.test(text)) {
    result.sortByPrice = "asc";
    text = text.replace(/\b(?:lowest|low)\s*price\b/i, "");
  } else if (/\b(?:highest|high)\s*price\b/i.test(text)) {
    result.sortByPrice = "desc";
    text = text.replace(/\b(?:highest|high)\s*price\b/i, "");
  }

  // Clean up leftover whitespace
  result.searchText = text.replace(/\s+/g, " ").trim();

  return result;
}

/**
 * GET /api/product/search
 * Full-text search using Elasticsearch
 * Falls back to MongoDB $text search if ES is unavailable
 *
 * Supports natural language queries like:
 *   "Book under 500", "laptop between 200 and 800",
 *   "cheap headphones", "phone rated above 4"
 *
 * Query params:
 *   q        - search query (required)
 *   category - filter by category (optional)
 *   limit    - results per page (default: 20, max: 50)
 *   page     - page number (default: 1)
 */
router.get(
  "/api/product/search",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    const { q, category, limit: limitStr, page: pageStr } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      throw new BadRequestError("Search query 'q' is required");
    }

    const parsed = parseNaturalQuery(q.trim());
    const limit = Math.min(Math.max(parseInt(limitStr as string) || 20, 1), 50);
    const page = Math.max(parseInt(pageStr as string) || 1, 1);
    const from = (page - 1) * limit;

    // Try Elasticsearch first, fall back to MongoDB on any ES error
    if (await isElasticAvailable()) {
      try {
        const results = await searchWithElasticsearch(parsed, {
          category: category as string,
          limit,
          from,
        });
        res.status(200).json({
          success: true,
          source: "elasticsearch",
          data: results.hits,
          meta: {
            total: results.total,
            page,
            limit,
            hasNextPage: from + limit < results.total,
          },
          filters: {
            priceMin: parsed.priceMin,
            priceMax: parsed.priceMax,
            minRating: parsed.minRating,
            sortByPrice: parsed.sortByPrice,
            parsedSearchText: parsed.searchText,
          },
        });
        return;
      } catch (esError: any) {
        console.warn("Elasticsearch search failed, falling back to MongoDB:", esError.message);
      }
    }

    // Fallback: MongoDB $text search
    const results = await searchWithMongoDB(parsed, { category: category as string, limit, page });
    res.status(200).json({
      success: true,
      source: "mongodb",
      data: results.data,
      meta: {
        total: results.total,
        page,
        limit,
        hasNextPage: page * limit < results.total,
      },
      filters: {
        priceMin: parsed.priceMin,
        priceMax: parsed.priceMax,
        minRating: parsed.minRating,
        parsedSearchText: parsed.searchText,
      },
    });
  },
);

/**
 * GET /api/product/search/suggest
 * Lightweight autocomplete — fires on each keystroke (debounced on client)
 * Returns up to 8 suggestions with title, category, price
 */
router.get(
  "/api/product/search/suggest",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      res.status(200).json({ suggestions: [] });
      return;
    }

    const query = q.trim();

    // Try Elasticsearch autocomplete
    if (await isElasticAvailable()) {
      try {
        const client = getElasticClient()!;
        const response = await client.search({
          index: PRODUCT_INDEX,
          body: {
            size: 8,
            _source: ["title", "category", "price", "image", "productId"],
            query: {
              bool: {
                should: [
                  {
                    match: {
                      "title.autocomplete": {
                        query,
                        operator: "and",
                      },
                    },
                  },
                  {
                    match_phrase_prefix: {
                      title: {
                        query,
                        boost: 2,
                      },
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
            highlight: {
              fields: {
                title: { number_of_fragments: 1 },
              },
            },
          },
        });

        const suggestions = response.hits.hits.map((hit: any) => ({
          id: hit._id,
          title: hit._source.title,
          category: hit._source.category,
          price: hit._source.price,
          image: hit._source.image,
          productId: hit._source.productId,
          highlight: hit.highlight?.title?.[0] || hit._source.title,
        }));

        res.status(200).json({ suggestions, source: "elasticsearch" });
        return;
      } catch (err: any) {
        console.warn("ES suggest failed, falling back to MongoDB:", err.message);
      }
    }

    // Fallback: MongoDB regex prefix search
    const regex = new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    const results = await Product.find({ title: regex })
      .select("title category price image")
      .limit(8)
      .lean();

    const suggestions = results.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      category: p.category,
      price: p.price,
      image: p.image,
      productId: p._id.toString(),
      highlight: p.title,
    }));

    res.status(200).json({ suggestions, source: "mongodb" });
  },
);

async function searchWithElasticsearch(
  parsed: ParsedQuery,
  options: { category?: string; limit: number; from: number },
) {
  const client = getElasticClient()!;

  // Build text query — use match_all if only filters remain
  const must: any[] =
    parsed.searchText.length > 0
      ? [
          {
            multi_match: {
              query: parsed.searchText,
              fields: ["title^3", "title.autocomplete", "description", "category.text", "tags"],
              type: "best_fields",
              fuzziness: "AUTO",
            },
          },
        ]
      : [{ match_all: {} }];

  // Build filters from parsed natural language + explicit params
  const filter: any[] = [];

  if (options.category) {
    filter.push({ term: { category: options.category } });
  }

  // Price range filter
  const priceRange: Record<string, number> = {};
  if (parsed.priceMin !== undefined) priceRange.gte = parsed.priceMin;
  if (parsed.priceMax !== undefined) priceRange.lte = parsed.priceMax;
  if (Object.keys(priceRange).length > 0) {
    filter.push({ range: { price: priceRange } });
  }

  // Rating filter
  if (parsed.minRating !== undefined) {
    filter.push({ range: { rating: { gte: parsed.minRating } } });
  }

  // Sort: price sort if requested, otherwise relevance
  const sort: any[] = [];
  if (parsed.sortByPrice) {
    sort.push({ price: { order: parsed.sortByPrice } });
  }
  if (parsed.searchText.length > 0) {
    sort.push("_score");
  }
  sort.push({ createdAt: { order: "desc" } });

  const response = await client.search({
    index: PRODUCT_INDEX,
    body: {
      from: options.from,
      size: options.limit,
      query: {
        bool: {
          must,
          filter,
        },
      },
      sort,
      highlight: {
        fields: {
          title: { number_of_fragments: 1 },
          description: { number_of_fragments: 2, fragment_size: 150 },
        },
      },
      _source: [
        "title",
        "description",
        "category",
        "price",
        "originalPrice",
        "rating",
        "tags",
        "sellerId",
        "productId",
        "createdAt",
      ],
    },
  });

  const total =
    typeof response.hits.total === "number" ? response.hits.total : response.hits.total?.value || 0;

  const hits = response.hits.hits.map((hit: any) => ({
    id: hit._id,
    score: hit._score,
    ...hit._source,
    highlight: hit.highlight || {},
  }));

  return { total, hits };
}

async function searchWithMongoDB(
  parsed: ParsedQuery,
  options: { category?: string; limit: number; page: number },
) {
  const filter: any = {};

  // Text search (only if there's actual search text)
  if (parsed.searchText.length > 0) {
    filter.$text = { $search: parsed.searchText };
  }

  if (options.category) {
    filter.category = options.category;
  }

  // Price filters
  if (parsed.priceMin !== undefined || parsed.priceMax !== undefined) {
    filter.price = {};
    if (parsed.priceMin !== undefined) filter.price.$gte = parsed.priceMin;
    if (parsed.priceMax !== undefined) filter.price.$lte = parsed.priceMax;
  }

  // Rating filter
  if (parsed.minRating !== undefined) {
    filter.rating = { $gte: parsed.minRating };
  }

  const skip = (options.page - 1) * options.limit;

  // Sort: price sort if requested, otherwise relevance (or recency)
  let sortOption: any;
  if (parsed.sortByPrice) {
    sortOption = { price: parsed.sortByPrice === "asc" ? 1 : -1 };
  } else if (parsed.searchText.length > 0) {
    sortOption = { score: { $meta: "textScore" } };
  } else {
    sortOption = { createdAt: -1 };
  }

  const query = Product.find(filter);

  if (parsed.searchText.length > 0) {
    query.select({ score: { $meta: "textScore" } });
  }

  const [data, total] = await Promise.all([
    query.sort(sortOption).skip(skip).limit(options.limit),
    Product.countDocuments(filter),
  ]);

  return { data, total };
}

export { router as searchProductRouter };
