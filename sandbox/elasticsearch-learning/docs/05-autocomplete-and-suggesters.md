# 05 — Autocomplete & Suggesters

## What problem does this solve?

A user types `"r"` → you show `"red running shoes"`, `"raincoat"`,
`"running socks"`. They type `"ru"` → the list narrows. Each keypress
should round-trip to the server in well under 100ms or it feels slow.

Three approaches in Elasticsearch can do this. They look similar from the
outside but behave very differently. Pick wrong and you either ship a
bloated index or a slow autocomplete.

## The minimal mental model

### The three options

| Approach | What it is | Strength | Weakness |
|----------|------------|----------|----------|
| **Edge n-grams** | Index every prefix as a token. `"red"` → `"r"`, `"re"`, `"red"`. Then `match` on input. | Simple, flexible, full ES query power | Index size grows, mid-word match is "free" but often unwanted |
| **`search_as_you_type`** | A field type (8.x). Stores multiple sub-fields with shingles. | One-line setup, matches both prefixes and middle-of-phrase | Less flexible than n-grams; ES-specific (not in OpenSearch) |
| **`completion` suggester** | A specialised in-memory data structure (FST). | Fastest. Returns suggestions, not documents. | Strict: only prefix match, no fuzzy across separators, separate "input" field |

### Decision table

| Need | Use |
|------|-----|
| Suggest product names, blazing fast, ≤ a few million entries | **`completion` suggester** |
| Search-as-you-type that respects filters (category, price), with full query power | **Edge n-grams** |
| Quick win, no analyzer tuning, ES-only | **`search_as_you_type`** |
| Suggest from a million-row history with synonyms and ranking signals | Edge n-grams + `function_score` |

### 1. Edge n-grams — the workhorse

You index every prefix as a separate token at index time, then at query
time you do a **standard** match (no n-gram analysis on the query side).

```json
PUT /products_ac
{
  "settings": {
    "analysis": {
      "analyzer": {
        "edge_ngram_index": {
          "tokenizer": "standard",
          "filter": ["lowercase", "edge_ngram_filter"]
        },
        "edge_ngram_search": {
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 15
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "edge_ngram_index",
        "search_analyzer": "edge_ngram_search"
      }
    }
  }
}
```

Why two analyzers?

- At **index** time, `"red"` becomes `["re", "red"]`. Stored.
- At **query** time, `"re"` should match the token `"re"` directly. If
  the query were also n-gram'd, you would also produce `"r"` and match
  way too much.

Trade-offs:

- Index size grows roughly 3-5x. Acceptable for product catalogues, can be
  brutal for full descriptions. Apply the n-gram analyzer **only** to a
  short field like `title` or a dedicated `suggest` field.
- Tunables: `min_gram` 2 (1 is way too noisy). `max_gram` ~15 (covers
  most words; longer typed words still match because the **last 15 chars'**
  prefix is in the index).

### 2. `search_as_you_type` — easy mode

```json
PUT /products_sayt
{
  "mappings": {
    "properties": {
      "title": { "type": "search_as_you_type" }
    }
  }
}
```

This single field type creates three internal sub-fields with shingles
(2-grams, 3-grams) and an edge-n-gram tail. Query with `multi_match` of
type `bool_prefix`:

```json
{
  "query": {
    "multi_match": {
      "query": "red runn",
      "type": "bool_prefix",
      "fields": ["title", "title._2gram", "title._3gram"]
    }
  }
}
```

Strengths: zero analyzer setup. Handles "in the middle" matches via
shingles (`"running shoes"` matches mid-phrase).

Weaknesses:

- Only ES, not OpenSearch.
- Less control. If you need synonyms, ASCII-folding, custom stop words,
  you end up wrestling.

### 3. `completion` suggester — the fast lane

```json
PUT /products_completion
{
  "mappings": {
    "properties": {
      "name":       { "type": "text" },
      "suggest":    { "type": "completion" }
    }
  }
}

POST /products_completion/_doc/1
{
  "name": "Red Running Shoes",
  "suggest": {
    "input": ["Red Running Shoes", "Running Shoes Red", "Sneakers"],
    "weight": 10
  }
}
```

Search:

```json
POST /products_completion/_search
{
  "suggest": {
    "product_suggest": {
      "prefix": "red ru",
      "completion": { "field": "suggest", "size": 5, "fuzzy": { "fuzziness": 1 } }
    }
  }
}
```

How it works:

- The `completion` field uses an **FST** (finite-state transducer). The
  whole structure lives in memory — that is why it is fast.
- It is for **suggestions**, not documents. The result is a list of
  matching `input` strings (with the doc behind them as payload).
- You provide the alternate inputs explicitly. This is also the
  weakness: if you didn't list "running shoes" as an input, it will not
  match "running" alone.

Use this when:

- Suggestions are a curated list (product names, brand names, search
  history) — not arbitrary text.
- You need sub-millisecond latency.
- You are willing to feed the suggester explicit `input` values.

### 4. Latency and index-size in practice

Order of magnitude on a small product catalogue (~10k docs):

| Approach | Index size delta | p50 latency |
|----------|------------------|-------------|
| Plain `text` (no autocomplete) | baseline | n/a (no prefix support) |
| Edge n-grams (title only)      | +3-5x baseline | 2-10ms |
| `search_as_you_type`           | +2-3x baseline | 2-10ms |
| `completion` suggester         | +1-2x baseline (in memory) | <1ms |

These numbers move a lot with cardinality and analyzer config. The
example in `examples/05-autocomplete/` measures all three on the same
dataset so you can see it on your machine.

## Concrete example — combining autocomplete with filters

A common need: "autocomplete, but only within the user's selected
category". `completion` suggester supports **contexts** for this:

```json
"suggest": {
  "type": "completion",
  "contexts": [
    { "name": "category", "type": "category" }
  ]
}
```

Index:

```json
{
  "name": "Red Running Shoes",
  "suggest": {
    "input": ["Red Running Shoes"],
    "contexts": { "category": ["shoes"] }
  }
}
```

Query:

```json
"completion": {
  "field": "suggest",
  "contexts": { "category": ["shoes"] }
}
```

Without contexts (or with edge n-grams), you instead build a `bool` query:
`must` = the prefix `match`, `filter` = `term` on category.

## Trade-offs / when this breaks

- **N-grams on description**: do not. The index will explode and the
  noise will tank relevance.
- **`completion` suggester is per-shard**: each shard returns its top
  N, then ES merges. With heavy custom scoring, results can vary
  slightly across shards.
- **Tokenizing across separators**: `"hi-tech"` may or may not split,
  depending on the tokenizer. Test with `_analyze`.
- **Updating suggestions**: completion suggester does not support partial
  updates. To change a doc's `input`, you re-index the doc.

## What to remember

- Three options. Pick using the decision table, not by reading the docs
  in order.
- Edge n-grams: full power, more index. Use a **search analyzer** without
  n-grams or queries match too much.
- `search_as_you_type`: easy and good. Lock-in to ES.
- `completion` suggester: fastest. Suggests strings, not docs. You feed
  the inputs.
- Always limit autocomplete to short fields (title, brand, suggest field).
- Measure on your data. The numbers above are a starting point, not a
  fact.
