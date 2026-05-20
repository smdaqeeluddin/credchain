// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CredChain is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Credential {
        uint256 tokenId;
        address issuer;
        address recipient;
        string ipfsHash;
        bytes32 credentialHash;
        uint256 issuedAt;
        bool revoked;
        string credentialType;
    }

    mapping(address => bool) public approvedIssuers;
    mapping(address => string) public issuerNames;
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) public holderCredentials;
    mapping(address => mapping(uint256 => uint256)) public verificationLog;
    mapping(uint256 => address[]) public tokenVerifiers;

    event IssuerApproved(address indexed issuer, string name);
    event CredentialIssued(uint256 indexed tokenId, address indexed issuer, address indexed recipient, string credentialType);
    event CredentialRevoked(uint256 indexed tokenId, address indexed issuer);
    event CredentialVerified(uint256 indexed tokenId, address indexed verifier, bool valid);

    constructor() ERC721("CredChain", "CRED") {}

    function approveIssuer(address issuer, string memory name) external onlyOwner {
        approvedIssuers[issuer] = true;
        issuerNames[issuer] = name;
        emit IssuerApproved(issuer, name);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        approvedIssuers[issuer] = false;
    }

    function issueCredential(
        address recipient,
        string memory ipfsHash,
        string memory credentialType,
        bytes32 credentialHash
    ) external returns (uint256) {
        require(approvedIssuers[msg.sender], "Not an approved issuer");
        require(recipient != address(0), "Invalid recipient");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(recipient, newTokenId);

        credentials[newTokenId] = Credential({
            tokenId: newTokenId,
            issuer: msg.sender,
            recipient: recipient,
            ipfsHash: ipfsHash,
            credentialHash: credentialHash,
            issuedAt: block.timestamp,
            revoked: false,
            credentialType: credentialType
        });

        holderCredentials[recipient].push(newTokenId);
        emit CredentialIssued(newTokenId, msg.sender, recipient, credentialType);
        return newTokenId;
    }

    function revokeCredential(uint256 tokenId) external {
        Credential storage cred = credentials[tokenId];
        require(cred.issuer == msg.sender, "Only issuer can revoke");
        require(!cred.revoked, "Already revoked");
        cred.revoked = true;
        emit CredentialRevoked(tokenId, msg.sender);
    }

    function verifyCredential(uint256 tokenId) external returns (bool) {
        Credential storage cred = credentials[tokenId];
        require(cred.issuedAt != 0, "Credential does not exist");
        bool valid = !cred.revoked;
        verificationLog[msg.sender][tokenId] = block.timestamp;
        tokenVerifiers[tokenId].push(msg.sender);
        emit CredentialVerified(tokenId, msg.sender, valid);
        return valid;
    }

    function getHolderCredentials(address holder) external view returns (uint256[] memory) {
        return holderCredentials[holder];
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        return credentials[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(credentials[tokenId].issuedAt != 0, "Token does not exist");
        return string(abi.encodePacked("ipfs://", credentials[tokenId].ipfsHash));
    }

    function totalCredentials() external view returns (uint256) {
        return _tokenIds.current();
    }
}