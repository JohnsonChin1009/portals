import express from "express";
import * as snarkjs from "snarkjs";
import path from "path";
import { generateGoogleOAuthUrl, getGoogleAccessToken, verifyGoogleToken } from "../src/auth";
import { addressHasher, extractStringToASCII, splitBigIntToDigits } from "./helper";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Define the shape of the response from Google OAuth
interface AccessTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    id_token: string;
}

interface GoogleUser {
    sub: string;
    iss: string;
    aud: string;
    // Add other properties as needed
}

const app = express();
const port = 3000;

// Enable JSON parsing
app.use(express.json());

// Redirect to Google OAuth
app.get("/auth/google", (req, res) => {
    const authUrl = generateGoogleOAuthUrl();
    res.redirect(authUrl);
});

// Handle the callback from Google OAuth
app.get("/callback", async (req: express.Request, res: express.Response): Promise<void> => {
    const { code } = req.query; // Get the authorization code from the URL
    
    if (typeof code !== "string") {
        console.error("Invalid code received");
        return;
    }
    
    try {
        // Step 1: Process OAuth token and extract user data
        const googleUser = await processOAuthToken(code);
        
        // Step 2: Generate ZK input from user data
        const zkInput = prepareZkInput(googleUser);
        console.log("ZK input prepared", zkInput);

        // Step 3: Generate ZK proof using optimized approach
        const { proof, publicSignals } = await generateOptimizedProof(zkInput);

        // Step 4: Export Call Data
        const callDataRaw = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

        const formattedCallData = convertRawCalldataToJson(callDataRaw);
        
        try {
            const a = formattedCallData.a;
            const b = [
                [formattedCallData.b[0][0], formattedCallData.b[0][1]],
                [formattedCallData.b[1][0], formattedCallData.b[1][1]]
            ];
            const c = formattedCallData.c;
            
            // Format publicSignal as uint256[1] with hex string
            const publicSignal = [formattedCallData.publicSignals[0]];

            console.log("Formatted Call Data", { a, b, c, publicSignal });
            const contractAbi = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256[2]",
                            "name": "_pA",
                            "type": "uint256[2]"
                        },
                        {
                            "internalType": "uint256[2][2]",
                            "name": "_pB",
                            "type": "uint256[2][2]"
                        },
                        {
                            "internalType": "uint256[2]",
                            "name": "_pC",
                            "type": "uint256[2]"
                        },
                        {
                            "internalType": "uint256[1]",
                            "name": "_pubSignals",
                            "type": "uint256[1]"
                        }
                    ],
                    "name": "verifyProof",
                    "outputs": [
                        {
                            "internalType": "bool",
                            "name": "",
                            "type": "bool"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ];
            const contractAddress = "0x2cBa16cFE146Bf688Eb75cF6C8f21B522c5a853F";
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const privateKey = process.env.PRIVATE_KEY || "";
            const signer = new ethers.Wallet(privateKey, provider);

            const verifierContract = new ethers.Contract(contractAddress, contractAbi, signer);
            // Now use these values for your contract call
            const result = await verifierContract.verifyProof(a, b, c, publicSignal);
            
            if (result) {
                console.log("ZK Proof successfully verified on-chain!");
                res.json({ success: true, message: "ZK Proof verified on-chain" });
            } else {
                console.error("ZK Proof verification failed.");
                res.status(400).json({ success: false, message: "ZK Proof verification failed" });
            }
        } catch (error) {
            console.error("Error parsing calldata:", error);
            res.status(500).json({ 
                error: "Error parsing calldata", 
                message: error instanceof Error ? error.message : String(error)
            });
        }
    } catch (error) {
        console.error("Error in callback process:", error);
        res.status(500).json({ 
            error: "Error processing request", 
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Process OAuth token and extract verified user data
 */
async function processOAuthToken(code: string): Promise<GoogleUser> {
    // Get access token data
    const accessTokenData = await getGoogleAccessToken(code);
    console.log("Access Token Data received");
    
    // Extract and verify ID token
    const { id_token } = accessTokenData as AccessTokenResponse;
    const googleUser = await verifyGoogleToken(id_token);
    console.log("Google User verified");
    
    return googleUser;
}

/**
 * Prepare ZK circuit input from user data
 */
function prepareZkInput(googleUser: GoogleUser) {
    const { aud, iss } = googleUser;
    
    // Process strings to arrays suitable for ZK circuit
    const audArray = extractStringToASCII(aud);
    const issArray = extractStringToASCII(iss);
    
    const audDigits = splitBigIntToDigits(audArray);
    const issDigits = splitBigIntToDigits(issArray);
    console.log("Aud Digits" , audDigits);
    console.log("Iss Digits" , issDigits);
    return { audArray: audDigits, issArray: issDigits };
}

/**
 * Generate a ZK proof using an optimized approach
 */
async function generateOptimizedProof(zkInput: any) {
    const wasmPath = path.resolve(__dirname, "./zkPs/builds/main_js/main.wasm");
    const zkeyPath = path.resolve(__dirname, "./zkPs/main_final.zkey");
    
    try {
        // Step 1: Generate Input
        const input = {
            "audArray": zkInput.audArray,
            "issArray": zkInput.issArray,
        }

        // console.log("ZK INPUT FOR AUD ARRAY AND ISS ARRAY", input);
        // Step 2: Generate the proof separately
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        console.log("Proof generated successfully", proof);
        console.log("Public signals generated successfully", publicSignals);
        return { proof, publicSignals };
    } catch (error) {
        console.error("Error generating proof:", error);
        throw new Error(`Proof generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function cleanCalldata(rawCalldata: string) {
    try {
        // Parse the raw calldata
        const calldata = JSON.parse(rawCalldata);

        // Extract 'a' (first array): Remove quotes and whitespace
        const a = calldata[0].map((item: string) => item.replace(/"/g, '').replace(/\s+/g, ''));
        
        // Extract 'b' (second array - double array): Remove whitespaces but keep quotes inside each pair
        const b = calldata[1].map((innerArray: any[]) => innerArray.map(item => item.replace(/\s+/g, '')));

        // Extract 'c' (third array): Remove quotes and whitespace
        const c = calldata[2].map((item: string) => item.replace(/"/g, '').replace(/\s+/g, ''));

        // Extract public signal (final array): Remove quotes and whitespace
        const publicSignal = calldata[3].map((item: string) => item.replace(/"/g, '').replace(/\s+/g, ''));

        return {
            a,
            b,
            c,
            publicSignal
        };
    } catch (error) {
        console.error("Error parsing calldata:", error);
        throw new Error("Error parsing calldata");
    }
}

function convertRawCalldataToJson(rawCalldata: string): any {
    // Step 1: Clean the raw calldata by ensuring it maintains its structure as an array
    const cleanedCallData = `[${rawCalldata}]`;
  
    // Step 2: Parse the cleaned calldata into a JSON object
    try {
      const parsedData = JSON.parse(cleanedCallData);
  
      // Step 3: Extract the elements as needed
      const a = parsedData[0]; // First array (this is an array of hex strings)
      const b = parsedData[1]; // Second array (array of arrays)
      const c = parsedData[2]; // Third array (this is another array of hex strings)
      const publicSignals = parsedData[3]; // Fourth array (array of hex strings)
  
      return {
        a,
        b,
        c,
        publicSignals,
      };
    } catch (error) {
      console.error("Error parsing raw calldata:", error);
      return null;
    }
  }

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});