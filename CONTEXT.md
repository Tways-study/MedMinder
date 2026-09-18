# MedMinder

A medicine inventory tracker for a pharmacy or clinic shelf: what's in stock, when it expires, and when to reorder.

## Language

### Stock

**Medicine**:
A product kept on the shelf, identified by name, form and strength (e.g. Amoxicillin 500mg capsule). It holds no stock itself; its stock is the sum of its Batches.
_Avoid_: Item, product, drug

**Batch**:
A quantity of one Medicine received together, sharing a single expiry date.
_Avoid_: Lot, stock entry

**Reorder Point**:
The on-hand quantity at or below which a Medicine is Low Stock.
_Avoid_: Minimum, threshold

**Stock Count**:
A dated physical count of what is actually on the shelf, recorded against the book quantity so the difference between them is kept as history.
_Avoid_: Reconciliation, audit, actual quantity edit

### Status

**Expiry Tier**:
How close something is to expiring: Expired, Critical, Soon, Watch, or In date. The day cutoffs are set per account.
_Avoid_: Alert level, "ok", "good", "warning"

**No Expiry Set**:
The state of stock with no known expiry date. It is shown separately from In date, never counted as In date.

**Low Stock**:
A Medicine whose on-hand quantity is at or below its Reorder Point. It is independent of Expiry Tier; a Medicine can be both Critical and Low Stock.
_Avoid_: Out of stock (that is zero, a special case)
