export enum RoutingKeyTypes {
  UserForgotPassword = 'user-forgot-password',
  UserResetPassword = 'user-rest-password',

  SellerCreated = 'seller-created',
  SellerUpdated = 'seller-updated',

  ProductCreated = 'product-created',
  ProductUpdated = 'product-updated',
  ProductDeleted = 'product-deleted',

  CartCreated = 'cart-created',
  CartUpdated = 'cart-updated',
  CartDeleted = 'cart-deleted',

  OrderCreated = 'order-created',
  OrderUpdated = 'order-updated',
  OrderCanceled = 'order-cancelled',

  ProductAddedCart = 'product-add-to-cart',
  ProductRemoveCart = 'product-remove-to-cart',
}
