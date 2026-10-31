# NEXORA ER Diagram

This Chen-notation ER diagram is based on the current SQLAlchemy schema in `backend/app/models.py`.

![NEXORA Chen ER Diagram](./nexora_erd.svg)

## Notation
- Rectangle: entity/table
- Diamond: relationship
- Oval: attribute
- Underlined attribute: primary key
- FK: foreign key
- 1:M: one-to-many
- 1:0..1: one-to-zero-or-one

## Schema notes
- The current model has eight entities: `users`, `products`, `carts`, `cart_items`, `addresses`, `orders`, `order_items`, and `payments`.
- Product category is stored as the `category` attribute on `products`; there is no separate category table.
- There are no wishlist tables in the current `models.py`.
- Order delivery details are stored directly as delivery snapshot columns on `orders`; `orders` has no `address_id` foreign key.
- Each order can have at most one payment because `payments.order_oid` has a unique constraint.
- Each cart item references one product and one cart. A cart can contain multiple cart items.
