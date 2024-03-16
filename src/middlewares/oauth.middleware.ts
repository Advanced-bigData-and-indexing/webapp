
import { EnvConfiguration } from "../config/env.config";
import { AuthError } from "../errorHandling/Errors";
import express from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
/**
 * We need to verify if all requests to this application are authenticated from
 * google's auth server
 * Reference: https://dev.to/cloudx/validate-an-openid-connect-jwt-using-a-public-key-in-jwks-14jh
 */

// const allowedIssuers = [EnvConfiguration.ISSUER];
const allowedIssuers = ["https://accounts.google.com"];

export const OAuthMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.path.includes("/v1/data")) {

    // Extract the auth header
    const authHeader = req.headers.authorization;

    if (authHeader == undefined) {
      return res.status(401).end();
    }

    // getting the id token
    const idToken = authHeader.split(" ")[1]; // Bearer idToken

    try {
      await verifyFn(idToken);
    } catch (err) {
      console.log(err);
      return res.status(401).end();
    }
    next();
  } else {
    next();
  }
};

/**
 * Verify an OpenID Connect ID Token
 * @param {string} token - The JWT Token to verify
 */
const verifyFn = async (token: string) => {
  
  const decodedJwt = jwt.decode(token, {complete: true});

  if(decodedJwt == null){
    console.log("error in decoding");
    throw new AuthError();
  }

  const {header, payload} = decodedJwt;
  
  if(typeof payload == 'string' || payload == null){
    console.log("payload is null or string ", payload);
    throw new AuthError();
  }
  const { iss: issuer } = payload;
  if(issuer == undefined){
    console.log("Undefined issuer");
    throw new AuthError();
  }

  const jwksUri = await fetchJwksUri(issuer);

  const client = jwksClient({ jwksUri });
  
  const publicKey = (await client.getSigningKey(header.kid)).getPublicKey();
  
  try{
    jwt.verify(token, publicKey);
  }
  catch (err){
    console.log(err);
    throw new AuthError();
  }
  
};


const fetchJwksUri = async (issuer: string) => {
  if (!allowedIssuers.includes(issuer)) {
    throw new Error(`The issuer ${issuer} is not trusted here!`);
  }
  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
  const { jwks_uri } = await response.json();
  return jwks_uri;
};
