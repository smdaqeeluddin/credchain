export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const CONTRACT_ABI = [
  "function approveIssuer(address issuer, string name) external",
  "function revokeIssuer(address issuer) external",
  "function approvedIssuers(address) view returns (bool)",
  "function issuerNames(address) view returns (string)",
  "function issueCredential(address recipient, string ipfsHash, string credentialType, bytes32 credentialHash, uint256 expiresAt) returns (uint256)",
  "function revokeCredential(uint256 tokenId) external",
  "function verifyCredential(uint256 tokenId) returns (bool)",
  "function getHolderCredentials(address holder) view returns (uint256[])",
  "function getCredential(uint256 tokenId) view returns (tuple(uint256,address,address,string,bytes32,uint256,uint256,bool,string))",
  "function totalCredentials() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event CredentialIssued(uint256 indexed tokenId, address indexed issuer, address indexed recipient, string credentialType)",
  "event CredentialRevoked(uint256 indexed tokenId, address indexed issuer)",
  "event CredentialVerified(uint256 indexed tokenId, address indexed verifier, bool valid)",
  "function verificationLog(address, uint256) view returns (uint256)",
"function tokenVerifiers(uint256, uint256) view returns (address)",
];