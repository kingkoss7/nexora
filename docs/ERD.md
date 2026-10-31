# NEXORA ER Diagram

This Chen-notation diagram is based on the actual SQLAlchemy definitions in `backend/app/models.py`.

![NEXORA Chen ER Diagram](./nexora_erd.svg)

## Chen notation
- Rectangle: entity/table
- Diamond: relationship
- Oval: attribute
- Underlined attribute: primary key
- FK: foreign key
- 1:M: one-to-many
- 1:0..1: one-to-zero-or-one

## Exact schema represented
The diagram contains the eight entities defined in the current model: `users`, `products`, `carts`, `cart_items`, `addresses`, `orders`, `order_items`, and `payments`.

It does not add wishlist or category tables. Product category is the `category` attribute on `products`.

## Relationship cardinalities
- USERS 1:M CARTS
- USERS 1:M ADDRESSES
- USERS 1:M ORDERS
- CARTS 1:M CART_ITEMS
- PRODUCTS 1:M CART_ITEMS
- ORDERS 1:M ORDER_ITEMS
- PRODUCTS 1:M ORDER_ITEMS
- ORDERS 1:0..1 PAYMENTS

The model stores delivery recipient/address snapshot fields directly on `orders`; there is no `address_id` foreign key from `orders` to `addresses`. Each payment belongs to one order, and `payments.order_oid` is unique.

## Notes
All attribute names shown are taken from the SQLAlchemy model. Check constraints and unique constraints are schema rules, not separate ER entities.
