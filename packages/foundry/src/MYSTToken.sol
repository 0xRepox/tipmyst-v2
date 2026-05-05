// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title MYST Token — Confidential ERC20-like token for TipMyst
/// @notice Balances are fully encrypted on-chain using FHEVM.
///         Only the balance owner can decrypt their own balance.
contract MYSTToken is ZamaEthereumConfig {
    string public constant name = "MYST Token";
    string public constant symbol = "MYST";
    uint8 public constant decimals = 6;

    // 10 MYST with 6 decimals
    uint64 public constant FAUCET_AMOUNT = 10_000_000;
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => euint64) private _balances;
    mapping(address => uint256) private _lastFaucet;

    // The TipMyst contract is the only authorised operator
    address public tipMyst;
    address public owner;

    event FaucetClaimed(address indexed user);
    event Transfer(address indexed from, address indexed to);

    error NotOwner();
    error TipMystAlreadySet();
    error OnlyTipMyst();
    error FaucetCooldown();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyTipMyst() {
        if (msg.sender != tipMyst) revert OnlyTipMyst();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Called once by the deployer to link the TipMyst contract.
    function setTipMyst(address _tipMyst) external onlyOwner {
        if (tipMyst != address(0)) revert TipMystAlreadySet();
        tipMyst = _tipMyst;
    }

    // ──────────────────────────────────────────────
    //  Faucet
    // ──────────────────────────────────────────────

    /// @notice Claim 10 MYST tokens. Limited to once every 24 hours.
    function claimFaucet() external {
        if (!canClaimFaucet(msg.sender)) revert FaucetCooldown();
        _lastFaucet[msg.sender] = block.timestamp;

        euint64 amount = FHE.asEuint64(FAUCET_AMOUNT);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        emit FaucetClaimed(msg.sender);
    }

    function canClaimFaucet(address user) public view returns (bool) {
        uint256 last = _lastFaucet[user];
        return last == 0 || block.timestamp >= last + FAUCET_COOLDOWN;
    }

    // ──────────────────────────────────────────────
    //  Read balance (encrypted)
    // ──────────────────────────────────────────────

    /// @notice Returns the encrypted balance handle for `account`.
    ///         Only the account itself (or an ACL-permitted party) can decrypt it.
    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }

    // ──────────────────────────────────────────────
    //  Tip transfer (called by TipMyst only)
    // ──────────────────────────────────────────────

    /// @notice Transfer an encrypted amount from `from` to `to`.
    ///         Silently transfers 0 when the sender has insufficient balance
    ///         (FHE cannot branch on encrypted values).
    /// @dev Caller must call FHE.allow(amount, address(this)) before this call.
    function tipTransfer(address from, address to, euint64 amount) external onlyTipMyst {
        // Zero-out the transfer when balance is insufficient
        ebool sufficient = FHE.le(amount, _balances[from]);
        euint64 transfer = FHE.select(sufficient, amount, FHE.asEuint64(0));

        _balances[from] = FHE.sub(_balances[from], transfer);
        _balances[to] = FHE.add(_balances[to], transfer);

        FHE.allowThis(_balances[from]);
        FHE.allow(_balances[from], from);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit Transfer(from, to);
    }
}
