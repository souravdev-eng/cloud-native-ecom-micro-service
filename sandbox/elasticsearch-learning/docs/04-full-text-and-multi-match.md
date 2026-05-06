# 04 — Full-Text & Multi-Match

## What problem does this solve?

A user typing into a search box does not know your schema. They might mean
the title, the description, the brand, the SKU, or the category. You need
one query that searches across **all** of them, ranks the best matches
first, and tolerates typos.

That query is `multi_match`.

## The minimal mental model

### 1. Multi-match — one user query, many fields

```json
{
  "query": {
    "multi_match": {
      "query": "red running shoes",
      "fields": ["title", "description", "brand"]
    }
  }
}
```

Internally this is rewritten into a `bool` of `match` clauses, one per
field. The interesting question is **how the per-field scores are
combined**. That is what `type` controls.

### 2. The `type` parameter — the four you actually use

| `type` | Plain meaning | Use when |
|--------|---------------|----------|
| `best_fields` (default) | Score = score of the **best** matching field. | One field is "the right one"; you want the best single hit. Default for product titles + descriptions. |
| `most_fields` | Score = sum across all matching fields. | The same content is repeated in fields with different analyzers (e.g. `title`, `title.english`, `title.shingles`). |
| `cross_fields` | Treats all listed fields as **one big field**. | The query terms are scattered across fields (e.g. first name in `firstName`, last name in `lastName`). |
| `phrase` | Match the words as a phrase, in order. | "Exact phrase" mode toggle, or used as a `should` to boost phrase matches. |

You will use `best_fields` 90% of the time. `phrase` shows up as a
relevance boost (chapter 07).

### 3. Field boosts

Some fields matter more than others. A hit in the title is more important
than a hit in the description. Boost with `^N`:

```json
{
  "multi_match": {
    "query": "running shoes",
    "fields": ["title^3", "brand^2", "description"]
  }
}
```

Boosts are multiplicative on the per-field score. Start with small numbers
(2–5). Big numbers (100) are usually a sign you should be using
`function_score` instead (chapter 07).

### 4. Fuzziness — typo tolerance

```json
{
  "multi_match": {
    "query": "runing",
    "fields": ["title", "description"],
    "fuzziness": "AUTO"
  }
}
```

`AUTO` is the right answer 95% of the time. It maps:

- length 0–2 → fuzziness 0 (must match exactly)
- length 3–5 → fuzziness 1 (one edit)
- length 6+  → fuzziness 2 (two edits)

"Edits" are Damerau-Levenshtein: insert, delete, substitute, transpose.

Costs:

- Fuzziness expands one user term into many candidate terms internally. It
  is more expensive than exact match — usually fine, but matters at scale.
- It can produce surprising matches: `"sofa"` ↔ `"sole"` are 2 edits apart.

Common refinement: **disable fuzziness on short queries** (`fuzziness: 0`)
to avoid noise from common 3-letter words.

### 5. Operator and `minimum_should_match`

Default `match` behaviour: any token can match. For a 3-word query, a
1-word match is a hit (low score, but present).

To require more terms:

```json
{
  "multi_match": {
    "query": "red running shoes",
    "fields": ["title^3", "description"],
    "operator": "and"
  }
}
```

…requires **all** terms in **at least one** field. That's often too
strict.

Better: `minimum_should_match` as a percentage:

```json
{ "minimum_should_match": "75%" }
```

For a 4-word query, that requires at least 3 terms to match.

### 6. Phrase boosting — the "looks better in order" trick

A common pattern: relax `match` to find candidates, then **add a phrase
match as a `should`** to rank exact-order hits higher.

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "red running shoes",
            "fields": ["title^3", "description"],
            "minimum_should_match": "75%"
          }
        }
      ],
      "should": [
        {
          "multi_match": {
            "query": "red running shoes",
            "fields": ["title^5", "description"],
            "type": "phrase"
          }
        }
      ]
    }
  }
}
```

Effect: docs that contain the words in any order still match; docs that
contain the **phrase** get a big boost.

### 7. Stemming and synonyms (briefly)

If you mapped your `text` fields with the `english` analyzer (or added the
`english_stemmer` token filter), `running` and `runs` and `ran` all
collapse to `run`, so the user gets reasonable matches without you doing
anything.

Synonyms (`shoes` ↔ `sneakers`) are configured in the analyzer's token
filters. Trade-off: index-time synonyms are fast at query time but
require reindex when you change the synonym list. Search-time synonyms
are slower per query but easy to update. Pick based on how often you
update the list.

## Concrete example

```json
POST /products/_search
{
  "size": 20,
  "_source": ["title", "brand", "price"],
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "red runing shoes",
            "fields": ["title^3", "brand^2", "description"],
            "type": "best_fields",
            "fuzziness": "AUTO",
            "minimum_should_match": "66%"
          }
        }
      ],
      "should": [
        {
          "multi_match": {
            "query": "red running shoes",
            "fields": ["title^5"],
            "type": "phrase"
          }
        }
      ],
      "filter": [
        { "term": { "category": "shoes" } }
      ]
    }
  }
}
```

Reads as: "Find shoes whose title (3x), brand (2x), or description matches
roughly 'red runing shoes' with one typo allowed; require at least 2 of 3
words to match; strongly prefer titles that contain the exact phrase 'red
running shoes'."

## Trade-offs / when this breaks

- **Fuzziness on every term is expensive.** For 5+ word queries, consider
  disabling fuzziness on the rarer (longer) tokens only.
- **`cross_fields` and analyzers must match across fields**, otherwise it
  misbehaves. Easy to forget when one field uses `english` and another
  uses `standard`.
- **Boosting too hard kills relevance.** A `^100` on title means the
  description never matters, even when title is empty.
- **Stop words make short queries weird.** Searching `"the"` returns
  nothing if `the` is a stop word, even on a doc literally titled "The
  Office".

## What to remember

- `multi_match` + `best_fields` is the default. Reach for `cross_fields`
  only when the data is split across fields semantically.
- Boost titles, not descriptions. Modest numbers (2–5).
- `fuzziness: "AUTO"` is almost always right.
- Use phrase-boost in `should` to reward exact-order hits without
  requiring them.
- `minimum_should_match: "75%"` is a good middle ground between "any word"
  and "all words".
