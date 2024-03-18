"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = void 0;
const notAuthorized_1 = require("../errors/notAuthorized");
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new notAuthorized_1.NotAuthorizedError());
        }
        next();
    };
};
exports.restrictTo = restrictTo;
