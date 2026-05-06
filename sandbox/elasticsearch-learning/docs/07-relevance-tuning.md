# 07 — Relevance Tuning

## What problem does this solve?

The user types `"running shoes"`. Both of these match:

- A 10-year-old, discontinued, never-bought pair of running shoes.
- A new, top-rated, in-stock pair of running shoes.

Default text relevance treats them as roughly equal. Your users do not.
Relevance tuning is how you teach ES that recency, popularity, stock
status, and "we just want this one promoted" all matter.

## The minimal mental model

### 1. BM25 — what the default score is doing

Without going into the math, BM25 says a doc scores high if:

1. **The query terms appear in the doc** (TF — term frequency). More
   matches → higher, but with diminishing returns.
2. **The terms are rare overall** (IDF — inverse document frequency).
   Hits on rare words count more.
3. **The matching field is short** (length norm). A 5-word title that
   matches scores higher than the same words buried in a 5000-word
   description.

That's it. It's a clean baseline, and most of the time the problem isn't
"BM25 is wrong" — it's "BM25 doesn't know about your business signals
(price, ratings, recency, popularity)".

### 2. Three layers of tuning, in order of cost

| Layer | What you change | Cost |
|-------|-----------------|------|
| **1. Mapping & analyzers** | Which fields, which tokenisation, synonyms | Reindex |
| **2. Query shape** | Boosts, phrase-bonus, `multi_match` type | Just code |
| **3. Function score** | Apply business signals (recency, popularity, rank features) | Just code |

Always exhaust layer 2 before reaching for layer 3. And always run a
**relevance evaluation** (section 6) before declaring victory.

### 3. Boosts — the simplest knob

Already covered in chapter 04. One thing to repeat:

> Boosts are multiplicative. `^3` means "3x the per-field score". Pick
> small numbers (2–5). Reach for `function_score` when boosts feel like
> they're being abused.

### 4. `function_score` — multiply by business signals

`function_score` wraps a query and multiplies (or replaces) its score by
one or more functions.

```json
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": { "query": "running shoes", "fields": ["title^3", "description"] }
      },
      "functions": [
        {
          "filter": { "term": { "in_stock": true } },
          "weight": 1.5
        },
        {
          "field_value_factor": {
            "field": "popularity",
            "modifier": "log1p",
            "missing": 1
          }
        },
        {
          "gauss": {
            "createdAt": {
              "origin": "now",
              "scale":  "30d",
              "decay":  0.5
            }
          }
        }
      ],
      "score_mode": "sum",
      "boost_mode": "multiply"
    }
  }
}
```

Reads as: "Take the text relevance score, then:

- Multiply by 1.5 if `in_stock` is true.
- Multiply by `log1p(popularity)` so popular items climb but not
  unboundedly.
- Apply a Gaussian decay on `createdAt`: full weight for new docs, half
  weight at 30 days old, dropping smoothly after."

`score_mode` controls how the **functions** combine (`sum`, `multiply`,
`avg`, `max`, …). `boost_mode` controls how the function output combines
with the **base query score** (`multiply` is most common).

### 5. Decay functions — recency, location, anything continuous

Three flavours: `gauss` (smooth bell curve), `exp` (sharp drop), `linear`.
Pick `gauss` unless you have a reason.

A common recency boost:

```json
"gauss": {
  "createdAt": { "origin": "now", "scale": "30d", "decay": 0.5 }
}
```

Reads as: "score multiplier is 1.0 at `now`, 0.5 at 30 days ago, smaller
beyond." This is the right shape for "newer is better, but don't ignore
older docs entirely".

The same function works on geo distance (`origin: <user lat,lon>`) or
price (`origin: <budget>`).

### 6. `rank_feature` and `rank_features` — purpose-built

ES 8 has dedicated field types for ranking signals:

```json
"mappings": {
  "properties": {
    "popularity": { "type": "rank_feature" },
    "ratings":    { "type": "rank_feature", "positive_score_impact": true }
  }
}
```

In the query:

```json
{ "rank_feature": { "field": "popularity", "log": { "scaling_factor": 4 } } }
```

Pros over `function_score`:

- Cheaper internally — uses skip lists optimised for ranking.
- Composes cleanly inside `bool.should`.

Use `rank_feature` for "push these signals through ranking" when you have
a clean numeric score. Use `function_score` when you need decays or
filter-based boosts.

### 7. Phrase-bonus (revisit)

The single highest-leverage zero-cost trick:

```json
"should": [
  {
    "multi_match": {
      "query": "running shoes",
      "fields": ["title^5"],
      "type": "phrase"
    }
  }
]
```

Title matches that contain the user's query as a phrase get a big bump.
Cheap, intuitive, and almost always improves perceived relevance.

### 8. Evaluating relevance — don't ship by vibes

It is very easy to "improve" relevance by accidentally regressing on
queries you didn't think to test.

The minimal version of an evaluation:

1. Pick 20–50 representative queries.
2. For each, list the docs you think should appear in the top N (this is
   the "judgment list").
3. After every relevance change, score each query: how many of your
   judged docs appear in the top N? Average across queries (Recall@N,
   MRR, NDCG — pick one and stick with it).
4. Compare before/after. **Reject changes that improve some queries
   while clearly hurting others** unless you understand why.

ES has the `_rank_eval` API for this; for a small project a script over
20 queries is enough.

### 9. The "explain" trick — why is this doc here?

When a doc surprises you (good or bad), ask ES why:

```json
GET /products/_search
{ "explain": true, "query": { ... } }
```

Or for a single doc:

```bash
GET /products/_explain/p_42
{ "query": { ... } }
```

Output is verbose but readable: it shows BM25 components, function-score
contributions, and final score. This is the fastest debugger for "why
did the wrong doc rank first?".

## Concrete example — full ranking query

```json
{
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "must": [
            {
              "multi_match": {
                "query": "running shoes",
                "fields": ["title^3", "brand^2", "description"],
                "type": "best_fields",
                "fuzziness": "AUTO",
                "minimum_should_match": "75%"
              }
            }
          ],
          "should": [
            {
              "multi_match": {
                "query": "running shoes",
                "fields": ["title^5"],
                "type": "phrase"
              }
            }
          ],
          "filter": [
            { "term": { "category": "shoes" } }
          ]
        }
      },
      "functions": [
        { "filter": { "term": { "in_stock": true } }, "weight": 1.4 },
        { "rank_feature": { "field": "popularity", "log": { "scaling_factor": 4 } } },
        { "gauss": { "createdAt": { "origin": "now", "scale": "60d", "decay": 0.5 } } }
      ],
      "score_mode": "sum",
      "boost_mode": "multiply"
    }
  }
}
```

That single query encodes: text relevance + phrase preference + category
filter + in-stock bonus + popularity + recency. That's a real ranking
function for a real ecom search.

## Trade-offs / when this breaks

- **Over-tuning to specific examples.** Three queries get better, ten
  others quietly get worse. Always re-run the eval set.
- **Filters that should be requirements but aren't.** "Out-of-stock"
  with a 0.5 weight still shows out-of-stock items. If you really mean
  "exclude", use `must_not`.
- **Score collapsing to one signal.** A `^100` boost or a `weight: 1000`
  overwhelms everything else. The result looks like a sort, not search.
- **Untested decay parameters.** A `scale: 1d` recency decay buries
  anything older than a week. Always sanity-check the decay shape (the
  `decay` parameter is the multiplier at `scale`, not at infinity).

## What to remember

- BM25 is a strong default. Most relevance problems live in **mapping**
  and **business signals**, not BM25.
- Use boosts for fields, `function_score` / `rank_feature` for business
  signals.
- Phrase-bonus in `should` is the cheapest big win.
- Multiplicative scoring is intuitive; tune `boost_mode: multiply`.
- Evaluate with a fixed query set. No vibes.
- `explain: true` answers "why is this doc ranked here?".
