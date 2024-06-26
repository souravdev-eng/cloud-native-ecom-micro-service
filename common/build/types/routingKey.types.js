"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingKeyTypes = void 0;
var RoutingKeyTypes;
(function (RoutingKeyTypes) {
    RoutingKeyTypes["UserForgotPassword"] = "user-forgot-password";
    RoutingKeyTypes["UserResetPassword"] = "user-rest-password";
    RoutingKeyTypes["SellerCreated"] = "seller-created";
    RoutingKeyTypes["SellerUpdated"] = "seller-updated";
    RoutingKeyTypes["ProductCreated"] = "product-created";
    RoutingKeyTypes["ProductUpdated"] = "product-updated";
    RoutingKeyTypes["ProductDeleted"] = "product-deleted";
    RoutingKeyTypes["OrderCreated"] = "order-created";
    RoutingKeyTypes["OrderUpdated"] = "order-updated";
    RoutingKeyTypes["OrderCanceled"] = "order-cancelled";
    RoutingKeyTypes["ProductAddedCart"] = "product-add-to-cart";
    RoutingKeyTypes["ProductRemoveCart"] = "product-remove-to-cart";
})(RoutingKeyTypes = exports.RoutingKeyTypes || (exports.RoutingKeyTypes = {}));
