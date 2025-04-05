import * as axios from "axios";
import * as jwt from "jsonwebtoken";

const googlePublicKeyUrl = "https://www.googleapis.com/oauth2/v3/certs";

interface GooglePublicKeyResponse {
    keys: Array<{
        kid: string;
        n: string;
        e: string;
    }>;
}

export const verifyIdToken = async (idToken: string): Promise<string> => {
    try {
      // Step 1: Decode the ID token to get the 'kid' (key ID)
      const decodedHeader = jwt.decode(idToken, { complete: true }) as { header: { kid: string } };
      const { kid } = decodedHeader.header;
      
      // Step 2: Fetch the public keys from the OAuth provider (e.g., Google)
      const { data } = await axios.get<GooglePublicKeyResponse>(googlePublicKeyUrl);
      const publicKey = data.keys.find(key => key.kid === kid);
  
      if (!publicKey) {
        throw new Error('Public key not found');
      }
  
      // Step 3: Reconstruct the public key
      const { n, e } = publicKey;
      const publicKeyPem = {
        kty: 'RSA',
        n, e
      };
  
      // Step 4: Verify the ID token
      const verifiedToken = jwt.verify(idToken, publicKeyPem as any);
      console.log('Verified token:', verifiedToken);
  
      // Step 5: Return the 'sub' (subject) or user ID
      const userId = (verifiedToken as any).sub;
      return userId;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new Error('Failed to verify ID token');
    }
  };