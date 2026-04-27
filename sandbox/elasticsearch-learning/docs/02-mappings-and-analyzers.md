# 02 — Mappings & Analyzers

## What problem does this solve?

You index a product called `"iPhone 15 Pro"`. Then:

- A user filters by exact brand `"Apple"` → 0 results, even though the
  brand field clearly says `"Apple"`.
- A user searches `"iphone"` (lowercase) → finds it.
- A user searches `"IPHONE"` → also finds it.
- A user sorts by `title` → ES throws an error.

All three are caused by the same thing: **how text is analyzed at index
time and at query time**. Mappings and analyzers are the rules that
control this.

## The minimal mental model

### 1. `text` vs `keyword` — the single most important distinction

Every string field in ES is mapped as one of these two types (or both).

| Aspect | `text` | `keyword` |
|--------|--------|-----------|
| Analyzed (tokenised, lowercased…) | Yes | No |
| Good for full-text search | **Yes** | No |
| Good for exact match (`brand = "Apple"`) | No | **Yes** |
| Good for sorting | **No** | Yes |
| Good for aggregations (facets, group-by) | No | **Yes** |
| Stored as | List of tokens | The whole string |

Most of the time you want **both**, using a multi-field mapping:

```json
{
  "title": {
    "type": "text",
    "fields": {
      "keyword": { "type": "keyword", "ignore_above": 256 }
    }
  }
}
```

Now `title` is full-text searchable, **and** `title.keyword` is available
for sort, exact match, and aggregations. This is what ES does by default
for any string field if you do not specify a mapping (dynamic mapping).

### 2. Analyzers — the pipeline

An analyzer turns a string into a list of tokens. It has three parts:

```
input string
   │
   ▼
[char filters]   e.g. strip HTML, replace é → e
   │
   ▼
[tokenizer]      e.g. split on whitespace and punctuation
   │
   ▼
[token filters]  e.g. lowercase, stop words, stemming, synonyms
   │
   ▼
list of tokens stored in the inverted index
```

The default analyzer (`standard`) does: split on Unicode word boundaries,
lowercase, no stemming, no stop words.

`"Red Running Shoes!"` → `["red", "running", "shoes"]`.

### 3. Index-time vs query-time analysis

This is the trap most people fall into:

> **The same analyzer must be used at index time and at query time, or
> nothing matches.**

If you index `"Café"` with an analyzer that does ASCII-folding (`café → cafe`)
but query with the default analyzer that does not, the user typing `cafe`
gets zero hits.

ES handles this for you if you set `analyzer` on the field — both index and
query use it. You only need to override it explicitly if you want a
different *search* analyzer, e.g. for autocomplete (chapter 05).

### 4. Custom analyzer — the recipe you will reach for

Most search use cases need at minimum: lowercase + ASCII-fold + stop words.

```json
PUT /products
{
  "settings": {
    "analysis": {
      "analyzer": {
        "search_text": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding", "english_stop"]
        }
      },
      "filter": {
        "english_stop": {
          "type": "stop",
          "stopwords": "_english_"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title":       { "type": "text", "analyzer": "search_text" },
      "description": { "type": "text", "analyzer": "search_text" },
      "brand":       { "type": "keyword" },
      "category":    { "type": "keyword" },
      "price":       { "type": "scaled_float", "scaling_factor": 100 },
      "tags":        { "type": "keyword" },
      "createdAt":   { "type": "date" }
    }
  }
}
```

A few choices in there worth noting:

- `brand` is `keyword` only. Brands are exact strings; you will not search
  inside them.
- `price` is `scaled_float` with factor 100 — stores cents as integers,
  avoids floating-point comparison surprises.
- `tags` is `keyword` (array of exact strings).
- `description` shares the `search_text` analyzer with `title` so a hit on
  either uses the same tokenisation.

### 5. Dynamic vs explicit mapping

If you index a document into a non-existent index, ES creates the index
**and** infers a mapping from the JSON. This is convenient and dangerous.

| Trade-off | Dynamic | Explicit |
|-----------|---------|----------|
| Speed of getting started | Fast | Slow |
| Types match your intent | Often no (`"42"` becomes `text`+`keyword`) | Yes |
| You can change a field's type later | No | No (but you decide upfront) |
| Ready for production | No | Yes |

**Rule:** prototype with dynamic. Promote to explicit before any traffic
hits the index.

### 6. Mappings are mostly immutable

Once a field is mapped, you can:

- ✅ Add **new** fields.
- ❌ Change an existing field's type or analyzer.

To "change" a mapping, you create a new index with the new mapping and
**reindex** into it. Use an alias so client code does not change. Chapter 08.

This is why getting mappings right early matters. It is the schema
migration story.

## Concrete example — debugging "why doesn't it match?"

ES has an `_analyze` API that shows you exactly what tokens come out of an
analyzer. Use it before guessing.

```bash
# what does our custom analyzer do to this string?
curl -XPOST 'localhost:9200/products/_analyze' \
  -H 'content-type: application/json' -d '
{
  "analyzer": "search_text",
  "text": "Café Running Shoes!"
}'
```

Output:

```json
{
  "tokens": [
    { "token": "cafe",    "position": 0 },
    { "token": "running", "position": 1 },
    { "token": "shoes",   "position": 2 }
  ]
}
```

If a search like `cafe` returns no results, the issue is one of:

1. The field has a different analyzer than you think.
2. You queried with `term` (which does not analyze) instead of `match`.
3. The field is `keyword`, not `text`.

`_analyze` settles all three in seconds.

## Trade-offs / when this breaks

- **Aggregating on a `text` field**: not allowed unless you enable
  `fielddata: true`, which uses lots of memory. Use the `.keyword`
  multi-field instead.
- **Sorting on a `text` field**: same — use `.keyword`.
- **Stop words remove your query terms**: searching for `"the office"` may
  return everything, because both words are stop words. Use a different
  analyzer for short titles (or no `stop` filter).
- **Stemming is language-specific**: `english` stemmer turns `running →
  run`, but it also turns `university → univers`. Tradeoffs.

## What to remember

- Use multi-field: `text` for search, `text.keyword` for sort/agg/exact.
- The same analyzer must run at index and query time. ES handles this if
  you set `analyzer` on the field.
- Use `_analyze` to debug "why doesn't it match?" before guessing.
- Mappings are effectively immutable. Plan for reindex (alias + new index).
- Don't agg or sort on `text`. Use `keyword`.
