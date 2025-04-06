import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NewGroth16Verifier", (m) => {
  // Get deployer account
  const deployer = m.getAccount(0);

  const groth16Verifier = m.contract("Groth16Verifier");

  return { groth16Verifier };
});
