const hre = require("hardhat");

async function main() {
  console.log("Deploying CredChain contract...");

  const CredChain = await hre.ethers.getContractFactory("CredChain");
  const credChain = await CredChain.deploy();

  await credChain.waitForDeployment();

  const address = await credChain.getAddress();
  console.log("CredChain deployed to:", address);
  console.log("SAVE THIS ADDRESS! Paste into frontend/utils/contract.js");

  const [deployer] = await hre.ethers.getSigners();
  await credChain.approveIssuer(deployer.address, "Demo University");
  console.log("Deployer approved as issuer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});