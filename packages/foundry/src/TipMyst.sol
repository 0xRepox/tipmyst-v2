// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {MYSTToken} from "./MYSTToken.sol";

/// @title TipMyst — Confidential tipping platform powered by FHEVM
/// @notice Creators register their profiles; supporters send encrypted tips.
///         Tip amounts and balances are never revealed on-chain.
contract TipMyst is ZamaEthereumConfig {
    struct Creator {
        string name;
        string bio;
        string imageUrl;
        uint256 tipCount;
        bool registered;
    }

    MYSTToken public immutable token;

    mapping(address => Creator) private _creators;
    address[] private _creatorList;

    event CreatorRegistered(address indexed creator, string name);
    event TipSent(address indexed from, address indexed to);

    error AlreadyRegistered();
    error NotRegistered();
    error EmptyName();
    error SelfTip();

    constructor(address _token) {
        token = MYSTToken(_token);
    }

    // ──────────────────────────────────────────────
    //  Creator registration
    // ──────────────────────────────────────────────

    function registerCreator(string calldata _name, string calldata _bio, string calldata _imageUrl) external {
        if (_creators[msg.sender].registered) revert AlreadyRegistered();
        if (bytes(_name).length == 0) revert EmptyName();

        _creators[msg.sender] = Creator({name: _name, bio: _bio, imageUrl: _imageUrl, tipCount: 0, registered: true});
        _creatorList.push(msg.sender);

        emit CreatorRegistered(msg.sender, _name);
    }

    // ──────────────────────────────────────────────
    //  Tipping
    // ──────────────────────────────────────────────

    /// @notice Send an encrypted tip to a registered creator.
    /// @param creator  The creator's wallet address.
    /// @param encAmount  Client-side encrypted tip amount.
    /// @param inputProof  ZK proof validating the encryption.
    function sendTip(address creator, externalEuint64 encAmount, bytes calldata inputProof) external {
        if (!_creators[creator].registered) revert NotRegistered();
        if (creator == msg.sender) revert SelfTip();

        // Decrypt input into an in-memory euint64 handle
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // Grant MYSTToken permission to use this handle in tipTransfer
        FHE.allow(amount, address(token));

        // Execute the confidential transfer
        token.tipTransfer(msg.sender, creator, amount);

        _creators[creator].tipCount++;
        emit TipSent(msg.sender, creator);
    }

    // ──────────────────────────────────────────────
    //  Views
    // ──────────────────────────────────────────────

    function isCreator(address addr) external view returns (bool) {
        return _creators[addr].registered;
    }

    function getCreator(address addr)
        external
        view
        returns (string memory _name, string memory _bio, string memory _imageUrl, uint256 _tipCount)
    {
        Creator storage c = _creators[addr];
        return (c.name, c.bio, c.imageUrl, c.tipCount);
    }

    function getAllCreators() external view returns (address[] memory) {
        return _creatorList;
    }

    function getCreatorCount() external view returns (uint256) {
        return _creatorList.length;
    }
}
