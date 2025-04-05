import express from "express";
import { generateGoogleOAuthUrl, getGoogleAccessToken, verifyGoogleToken } from "../src/auth";
import { addressHasher, extractStringToASCII, splitBigIntToDigits} from "./helper";

// Define the shape of the response from Google OAuth
interface AccessTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    id_token: string;
}

const app = express();
const port = 3000;

// Redirect to Google OAuth
app.get("/auth/google", (req, res) => {
    const authUrl = generateGoogleOAuthUrl();
    res.redirect(authUrl);
});

// Handle the callback from Google OAuth
app.get("/callback", async (req, res) => {
    const { code } = req.query; // Get the authorization code from the URL
    
    if (typeof code === "string") {
        try {
            // Step 1: Get the access token data using the authorization code
            const accessTokenData = await getGoogleAccessToken(code);
            console.log("Access Token Data:", accessTokenData);
            // Typecast the response to AccessTokenResponse to tell TypeScript about the id_token
            const { id_token } = accessTokenData as AccessTokenResponse;
            console.log("ID Token:", id_token);
            // Step 2: Verify the ID token using the verifyGoogleToken function
            const googleUser = await verifyGoogleToken(id_token);
            
            console.log("Google User:", googleUser);

            const { sub, iss, aud } = googleUser;

            // Step 3: Hash the profile using the addressHasher function to identify the user
            const hashProfile = await addressHasher({ sub, iss, aud });

            // Step 4: Extract the substring to ASCII

            const audArray = extractStringToASCII(aud);
            const issArray = extractStringToASCII(iss);

            const audDigits = splitBigIntToDigits(audArray);
            const issDigits = splitBigIntToDigits(issArray);

            console.log("Digits", { audDigits, issDigits });

            // res.json({ hashProfile });
            // Check here.. So we're stopping here at the moment. We are able to get the sub value which would be googleUser.sub

            // Now, let's work on the zkProof for it?
        } catch (error) {
            res.status(500).json({ error: "Error exchanging authorization code or verifying token" });
        }
    } else {
        res.status(400).json({ error: "Authorization code missing" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
