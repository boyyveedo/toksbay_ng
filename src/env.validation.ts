import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),

    DATABASE_URL: Joi.string().uri().required(),

    FRONTEND_URL: Joi.string().default('https://soloshopp.netlify.app'),


});
