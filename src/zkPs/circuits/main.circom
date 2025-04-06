pragma circom 2.1.6;

include "../../../node_modules/circomlib/circuits/comparators.circom";

// Main circuit that uses IsEqual for comparison
template Main() {
    signal input audArray[18];    // Array size 18
    signal input issArray[18];    // Array size 18
    signal output result;         // Result: 1 if equal, 0 if not

    component eq[18];  // Create an array of IsEqual components for each digit

    // Compare each pair of corresponding digits
    for (var i = 0; i < 18; i++) {
        eq[i] = IsEqual();
        audArray[i] ==> eq[i].in[0];   // Pass the element from audArray
        issArray[i] ==> eq[i].in[1];   // Pass the element from issArray
    }

    // Use intermediate signals for the accumulation
    signal eqResults[19];  // Needs to be size 19 (original + 18 comparisons)
    eqResults[0] <== 1;    // Start with 1

    // Accumulate the comparison results
    for (var i = 0; i < 18; i++) {
        eqResults[i+1] <== eqResults[i] * eq[i].out;  // If any comparison is 0, the result becomes 0
    }

    // The final result will be the last accumulated value
    result <== eqResults[18];
}

component main = Main();