import * as circomlibjs from "circomlibjs";
import { BigNumberish } from "ethers";

interface addressHasherProps {
    sub: string;
    iss: string;
    aud: string;
}

export async function addressHasher({sub, iss, aud}: addressHasherProps) {
    console.log("Props received:", {sub, iss, aud});
    console.log(circomlibjs);
    try {
        const poseidon = await circomlibjs.buildPoseidon();
        console.log("Poseidon instance built successfully.");

        const newSub = BigInt(sub);
        const newIss = stringToBigInt(iss);
        const newAud = stringToBigInt(aud);

        const hash = poseidon([newSub, newIss, newAud]);

        const hashValue = poseidon.F.toString(hash);

        return hashValue;
    } catch (error) {
        console.error("An error occurred in addressHasher:", error);
    }
}

// Function to convert string to BigInt
function stringToBigInt(str: string): BigNumberish {
    try {
        console.log("Converting string to BigInt:", str);
        const result = BigInt("0x" + Buffer.from(str, "utf8").toString("hex"));
        console.log("Conversion successful:", result);
        return result;
    } catch (error) {
        console.error("Error converting string to BigInt:", error);
        throw error;
    }
}

export function extractStringToASCII(input: string): bigint | string {
    const keyword = "google";
    const index = input.toLowerCase().indexOf(keyword);
  
    if (index === -1) {
      return "Keyword not found in the input string.";
    }
  
    const extracted = input.substring(index, index + keyword.length);
    const asciiArray = extracted.split('').map(char => char.charCodeAt(0));
    const joined = asciiArray.map(n => n.toString().padStart(3, '0')).join(''); // pad to prevent overlap
    return BigInt(joined);
}  

export function splitBigIntToDigits(bigIntValue: bigint | string): number[] {
    const digits = bigIntValue.toString().split('').map(Number);
    
    return digits;
}