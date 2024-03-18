"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const notAuthorized_1 = require("../errors/notAuthorized");
const requireAuth = (req, res, next) => {
    if (!req.user) {
        throw new notAuthorized_1.NotAuthorizedError();
    }
    next();
};
exports.requireAuth = requireAuth;
