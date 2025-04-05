import axios from "axios";
import * as querystring from "querystring";
import * as dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

export async function authenticate() {
    const authUrl = `https://accounts.google.com/o/oauth2/auth?${querystring.stringify({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid profile email",
        state: "random_state_string"
    })}`;

    console.log(`Redirecting user to ${authUrl}`);

    
}