const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x9C4FC779d234B86921c3F73C59873b723D733f58";
  const TOKEN_ID = 3; // change this to the token you want to revoke

  const CredChain = await hre.ethers.getContractAt("CredChain", CONTRACT_ADDRESS);
  const tx = await CredChain.revokeCredential(TOKEN_ID);
  await tx.wait();
  console.log(`Credential #${TOKEN_ID} revoked successfully`);
}

main().catch(console.error);