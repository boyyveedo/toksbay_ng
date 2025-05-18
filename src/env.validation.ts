import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),

    DATABASE_URL: Joi.string().uri().required(),

    FRONTEND_URL: Joi.string().default('http://localhost:5173'),


});
