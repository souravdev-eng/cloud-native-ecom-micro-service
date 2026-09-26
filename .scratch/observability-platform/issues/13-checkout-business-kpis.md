# 13: Checkout & Business KPIs dashboard

**Parent spec:** `../spec.md`

**What to build:** A product owner opens **Checkout & Business KPIs** and sees:
- the checkout funnel: orders created → payment intents created → payments succeeded / failed;
- a **stuck-payment** gauge;
- order value over time;
- `auth` signup / login success / login failure / password-reset rates;
- `notification` emails sent vs failed by template.

The browser's `webhook_pending` state can't be observed server-side, so the stuck-payment gauge stands in for it: it counts orders with a payment intent that haven't become `paid` within N minutes, N configurable.

Services record business metrics through common's meter accessor, with low-cardinality labels only (no user, order or email IDs):
- `order`: orders created, payment intents created, payment outcomes from the Stripe webhook, order value histogram, stuck-payment gauge;
- `cart`: items added/removed, carts cleared by `OrderCreatedListener`;
- `auth`: signups, logins by result, password-reset requests;
- `notification`: emails sent/failed by template.

**Blocked by:** 06 (`order`/`cart` adopted), 08 (`notification` adopted)

**Status:** ready-for-agent

- [ ] Each listed metric exists on the owning service's `/metrics` with only low-cardinality labels
- [ ] `auth` and `cart` have a test asserting their business counter increments after the relevant request (no tests added in `order`/`notification`)
- [ ] Stuck-payment gauge rises when a payment intent is created but the webhook never arrives, and falls when it does
- [ ] Dashboard provisioned and passes validation; manual checkout moves the funnel panels
