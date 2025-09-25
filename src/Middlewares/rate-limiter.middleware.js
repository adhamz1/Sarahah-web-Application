
import {ipKeyGenerator, rateLimit} from 'express-rate-limit'
import MongoStore  from 'rate-limit-mongo'
import { getCountryCode } from '../Utils/index.js';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000 ,
  max:async function(req){
    const {country_code} = await getCountryCode(req.headers['x-forwarded-for'])
    if(country_code =='IN') return 20 ;
    if(country_code == 'EG') return 30;
    return 15 ;
  },
  requestPropertyName:'rate_limit',
  statusCode:429,
  message:'Too many requests from this IP, please try again after 15 minutes',
  handler:(req,res,next)=>{
    res.status(429).json({message:'Too many requests from this IP, please try again after 15 minutes'})
  },
  // legacyHeaders:false,
  // standardHeaders:'draft-7',
  // skipFailedRequests:true,
  keyGenerator:(req)=>{
    const ip = ipKeyGenerator(req.headers['x-forwarded-for'])
    console.log('The key generator is'  , `${ip}-${req.path}`);
    return `${ip}-${req.path}`
  },
  store: new MongoStore({
    uri: process.env.DB_URI_LOCAL,
    collectionName:'rateLimiter',
    expireTimeMs: 15 * 60 * 1000,
  })
})

