const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xC6Ff93F1c4279715ea0a9a1A2CC293350ff1a00C";
  const TOKEN_ID = 1; // change this to the token you want to revoke

  const CredChain = await hre.ethers.getContractAt("CredChain", CONTRACT_ADDRESS);
  const tx = await CredChain.revokeCredential(TOKEN_ID);
  await tx.wait();
  console.log(`Credential #${TOKEN_ID} revoked successfully`);
}

main().catch(console.error);