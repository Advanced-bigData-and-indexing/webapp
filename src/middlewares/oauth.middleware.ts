import * as jose from "jose";
import { jwtDecode } from "jwt-decode";
import getPem from "rsa-pem-from-mod-exp";
import crypto from "crypto";
import { EnvConfiguration } from "../config/env.config";
import { AuthError } from "../errorHandling/Errors";
import JWK from "./GoogleAuthJWK.json";
import express from "express";
/**
 * We need to verify if all requests to this application are authenticated from
 * google's auth server
 * Reference : https://ncona.com/2015/02/consuming-a-google-id-token-from-a-server/
 */

type JWKJSON = {
  keys: [
    {
      n: string;
      e: string;
      use: string;
      alg: string;
      kty: string;
      kid: string;
    }
  ];
};

/**
 * This function validates the ID token obtained from JWT
 * Reference https://github.com/panva/jose
 * There seems to be some issue, with this approach where we break down the process,
 * let's directly try using the library methods instead
 */
const validateJWT = (token: string): boolean => {
  const decodedPayload = jwtDecode(token);
  const decodedHeader = jwtDecode(token, { header: true });

  console.log(decodedPayload);

  if (
    decodedPayload.aud !== EnvConfiguration.CLIENT_ID ||
    decodedPayload.iss !== EnvConfiguration.ISSUER
  ) {
    throw new AuthError("Id token is not valid");
  }

  /**
   * As the next step we need to proceed to verify the JWT signature
   *
   * – Retrieve the discovery document from https://accounts.google.com/.well-known/openid-configuration
   * – Parse the JSON document and retrieve the value of the jwks_uri key
   * – Retrieve public keys from jwks_uri
   * – Use public keys to validate signature
   */

  /**
   * In this implmentation we have skipped the first two steps and have directly
   * stored the contents of https://www.googleapis.com/oauth2/v3/certs
   * in ./GoogleAuthJWK.json
   * This must be cached in production environments to avoid unnecessary network requests
   * to the google apis end point to retrieve it every time
   */

  // From the headers, we identify which key we must be using here
  const keyToUse = decodedHeader.kid;

  /**
   * Now that we know which key to use,
   * we need to identify the key type(kty) and algorithm(alg).
   * The JSON Web Algorithms specification dictates that an RSA public key
   * need to also have a modulus(n) and an exponent(e).
   */

  // from the JWK document, let's identify the key type and the algorithm to be used
  const jwkDoc = JWK as JWKJSON;
  const { alg, kty, n, e } = jwkDoc.keys.filter(
    (jwk) => jwk.kid == keyToUse
  )[0];
  // algorithm (alg), key type(kty), modulus(n) and exponent(e)
  // refer: https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-web-algorithms-40

  /**
   * This key can’t be used directly to verify the token signature.
   * First we need to transform it to a PEM key
   **/

  const pem = getPem(n, e);
  let [header, payload, signature] = token.split(".");

  signature = Buffer.from(signature).toString("base64");
  const content = header + "." + payload;

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(content);
  return verifier.verify(pem, signature, "base64");
};

export const OAuthMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.path.includes("/v1/data")) {
    const authHeader = req.headers.authorization;

    if (authHeader == undefined) {
      return res.status(401).end();
    }

    const idToken = authHeader.split(" ")[1]; // Bearer idToken

    const JWKS = jose.createRemoteJWKSet(
      new URL(
        EnvConfiguration.JWK_URL || "https://www.googleapis.com/oauth2/v3/certs"
      )
    );

    try {
      const { payload, protectedHeader } = await jose.jwtVerify(idToken, JWKS, {
        issuer: EnvConfiguration.ISSUER,
        audience: EnvConfiguration.CLIENT_ID,
      });
      if (payload && protectedHeader) {
        next();
      } else {
        return res.status(401).end();
      }
    } catch (err) {
      return res.status(401).end();
    }
  } else {
    next();
  }
};
