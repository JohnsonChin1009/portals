import * as axios from "axios";
import * as querystring from "querystring";
import * as dotenv from "dotenv";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import jwkToPem from "jwk-to-pem";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

interface GooglePublicKeyResponse {
  keys: Array<{
    kid: string;
    kty: string;
    e: string; // Exponent (base64url encoded)
    n: string; // Modulus (base64url encoded)
    alg: string;
    use: string;
  }>;
}

interface GoogleUser {
  sub: string;
  iss: string;
  aud: string;
  email: string;
  name: string;
  picture: string;
}

// Generate Google OAuth URL
export function generateGoogleOAuthUrl() {
  const googleOAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const scope = "https://www.googleapis.com/auth/userinfo.profile"; // Access user profile
  const responseType = "code";
  const accessType = "offline";

  const nonce = crypto.randomBytes(16).toString("hex");

  const url = `${googleOAuthUrl}?${querystring.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope,
    response_type: responseType,
    access_type: accessType,
    nonce,
  })}`;

  return url;
}

// Exchange authorization code for access token
export async function getGoogleAccessToken(code: string) {
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const response = await axios.post(
    tokenUrl,
    querystring.stringify({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  );

  console.log("ID_Token", response.data);
  return response.data; // The response will contain the access token and refresh token
}

// Verify Google ID Token
export const verifyGoogleToken = async (
  idToken: string,
): Promise<GoogleUser> => {
  try {
    // URL to Google's public key for JWT signature verification
    const googlePublicKeyUrl = `https://www.googleapis.com/oauth2/v3/certs`;

    // Get Google's public keys (the public key is used to verify JWT signature)
    const response =
      await axios.get<GooglePublicKeyResponse>(googlePublicKeyUrl);
    const keys = response.data.keys;
    console.log("Google Public Key Response: ", response.data);

    // Decode the JWT header to get the key ID (kid)
    const decodedHeader = jwt.decode(idToken, { complete: true }) as {
      header: { kid: string };
    };
    const { kid } = decodedHeader.header;

    // Find the key that matches the kid (key id) from the JWT header
    const googlePublicKey = keys.find((key) => key.kid === kid);

    if (!googlePublicKey) {
      throw new Error("Public key not found");
    }

    const { n, e } = googlePublicKey;

    // Convert the public key from JWK to PEM format
    const publicKeyPem = jwkToPem({
      kty: "RSA",
      n, // Modulus (in base64url)
      e, // Exponent (in base64url)
    });

    // Verify the JWT using the public key (PEM format)
    const decodedToken = jwt.verify(idToken, publicKeyPem) as GoogleUser;

    // Return the decoded Google user information
    return decodedToken;
  } catch (error) {
    console.error("Error verifying JWT:", error);
    throw new Error("Failed to verify Google token");
  }
};