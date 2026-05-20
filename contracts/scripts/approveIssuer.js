const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xC6Ff93F1c4279715ea0a9a1A2CC293350ff1a00C";
  const ISSUER_ADDRESS = "0x28c90aA178520687f3aFdAbD79139B7BFC0e124F";
  const ISSUER_NAME = "R N S Institute Of Technology";

  const CredChain = await hre.ethers.getContractAt("CredChain", CONTRACT_ADDRESS);
  const tx = await CredChain.approveIssuer(ISSUER_ADDRESS, ISSUER_NAME);
  await tx.wait();
  console.log(`Approved ${ISSUER_NAME} (${ISSUER_ADDRESS}) as issuer`);
}

main().catch(console.error);