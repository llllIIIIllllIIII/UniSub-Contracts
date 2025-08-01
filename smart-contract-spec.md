# smart-contract-spec.md

## 🎯 Contract Goal

This smart contract system implements a decentralized NFT-based subscription mechanism. It allows service providers to create their own subscription NFT collections, and users can mint these NFTs to gain access rights to the corresponding services. Each NFT represents a time-limited subscription credential.

---

## 🏗️ Architecture Overview

The system consists of:
- A **Factory Contract** to allow service providers to deploy their own subscription NFT collections.
- A **SubscriptionNFT Contract** per service, which is a time-bound ERC-721 with subscription metadata.
- Optional: a central **Registry or View Layer** to track all minted NFTs by a given user across collections.

---

## ✳️ Core Features

### 1. Service Provider: Create Subscription NFT Collection

#### Function
`createSubscriptionCollection(string name, uint256 priceInUSDT, uint256 durationInSeconds)`

#### Description
Allows a service provider to deploy a new `SubscriptionNFT` contract with:
- Service Name
- Subscription Price (denominated in USDT)
- Subscription Duration (e.g., 30 days)

#### Stored Data per Collection
- `name`: Service name (e.g., "SuperVPN Premium")
- `price`: Price in USDT (ERC-20 address hardcoded or passed in)
- `duration`: How long a subscription NFT lasts
- `owner`: The creator (service provider)

> 🔧 Suggestion: Consider storing `symbol`, `baseURI`, and `description` fields as well.

---

### 2. User: Mint Subscription NFT

#### Function
`mintSubscription(address collection)`

#### Description
- Lets users pay the specified amount in USDT to mint a new NFT from the specified `SubscriptionNFT` collection.
- The minted NFT will record:
  - Owner address
  - Mint timestamp
  - Expiry timestamp (calculated as `block.timestamp + duration`)

> 💡 Minting should fail if the user hasn’t approved enough USDT.

---

### 3. Service Provider: Verify Active Subscription

#### Function
`hasValidSubscription(address user) external view returns (bool)`

#### Description
Each `SubscriptionNFT` contract should expose a view function to check:
- If a user owns a non-expired subscription NFT (based on token expiry metadata).
- Could return `true` if any of the user’s NFTs for this collection are still valid.

---

### 4. User: Query Minted Subscriptions

#### Function (in Factory or Helper View)
`getMySubscriptions(address user) public view returns (address[] memory collections, uint256[] memory expiryTimes)`

#### Description
Allow users to view:
- Which subscription NFT contracts they've interacted with
- Their active token IDs and expiry timestamps in each

> ✅ Can be optional if you don’t want on-chain aggregation. This can also be handled in frontend using The Graph.

---

## ⛽ Token Standard & Currency

- Subscription NFTs: ERC-721 with metadata (optional: include expiry in tokenURI or via mapping).
- Payment Token: USDT (ERC-20), hardcoded or configurable per factory deployment.

---

## 🔒 Access Control & Security Notes

- Only service provider can mint/deploy their own collection.
- Only user who pays can mint a subscription.
- Service providers must not be able to manipulate subscription durations after deployment.
- Use OpenZeppelin libraries for:
  - ERC-721
  - Ownable
  - ReentrancyGuard
  - SafeERC20

---

## 📦 Suggested Contract Layout

### Contract: `SubscriptionFactory`
- `createSubscriptionCollection()`
- `getCollectionsByOwner(address)`
- `getAllCollections()`

### Contract: `SubscriptionNFT`
- `mintSubscription()`
- `hasValidSubscription(address)`
- `getExpiryTime(uint256 tokenId)`
- `tokenURI(uint256 tokenId)` (optional dynamic metadata)

---

## 🧩 Optional Enhancements

- Add NFT `burn` after expiry
- Enable NFT transfer before expiry to make it resellable
- Hook for renewal (e.g., `renewSubscription(uint256 tokenId)`)
- Dynamic metadata based on `block.timestamp`
- Optional whitelist for service access validation

---

## 📝 To Be Defined

- What happens when subscription expires? Auto-burn or just ignored?
- Can NFTs be traded/transferred?
- Should each NFT have its own metadata, or be uniform per collection?