// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FhevmTest} from "forge-fhevm/FhevmTest.sol";
import {MYSTToken} from "../src/MYSTToken.sol";
import {TipMyst} from "../src/TipMyst.sol";
import {euint64, externalEuint64} from "encrypted-types/EncryptedTypes.sol";

contract TipMystTest is FhevmTest {
    MYSTToken token;
    TipMyst tipMyst;

    uint256 internal constant ALICE_PK = 0xA11CE;
    uint256 internal constant BOB_PK = 0xB0B;

    address alice;
    address bob;

    function setUp() public override {
        super.setUp();
        alice = vm.addr(ALICE_PK);
        bob = vm.addr(BOB_PK);

        token = new MYSTToken();
        tipMyst = new TipMyst(address(token));
        token.setTipMyst(address(tipMyst));
    }

    // ──────────────────────────────────────────────
    //  Faucet tests
    // ──────────────────────────────────────────────

    function test_faucetGivesTenMYST() public {
        vm.prank(alice);
        token.claimFaucet();

        euint64 encBal = token.balanceOf(alice);
        bytes memory sig = signUserDecrypt(ALICE_PK, address(token));
        uint256 balance = userDecrypt(euint64.unwrap(encBal), alice, address(token), sig);

        assertEq(balance, token.FAUCET_AMOUNT());
    }

    function test_faucetCooldownPreventsDoubleClaim() public {
        vm.prank(alice);
        token.claimFaucet();

        vm.prank(alice);
        vm.expectRevert(MYSTToken.FaucetCooldown.selector);
        token.claimFaucet();
    }

    function test_faucetAllowedAfterCooldown() public {
        vm.prank(alice);
        token.claimFaucet();

        vm.warp(block.timestamp + 24 hours + 1);

        vm.prank(alice);
        token.claimFaucet();

        euint64 encBal = token.balanceOf(alice);
        bytes memory sig = signUserDecrypt(ALICE_PK, address(token));
        uint256 balance = userDecrypt(euint64.unwrap(encBal), alice, address(token), sig);

        assertEq(balance, token.FAUCET_AMOUNT() * 2);
    }

    // ──────────────────────────────────────────────
    //  Creator registration tests
    // ──────────────────────────────────────────────

    function test_registerCreator() public {
        vm.prank(bob);
        tipMyst.registerCreator("Bob", "A cool creator", "https://example.com/bob.jpg");

        assertTrue(tipMyst.isCreator(bob));
        (string memory name,,,) = tipMyst.getCreator(bob);
        assertEq(name, "Bob");
    }

    function test_cannotRegisterTwice() public {
        vm.startPrank(bob);
        tipMyst.registerCreator("Bob", "Bio", "");
        vm.expectRevert(TipMyst.AlreadyRegistered.selector);
        tipMyst.registerCreator("Bob2", "Bio2", "");
        vm.stopPrank();
    }

    function test_cannotRegisterWithEmptyName() public {
        vm.prank(bob);
        vm.expectRevert(TipMyst.EmptyName.selector);
        tipMyst.registerCreator("", "Bio", "");
    }

    // ──────────────────────────────────────────────
    //  Tip tests
    // ──────────────────────────────────────────────

    function test_sendTipTransfersBalanceToCreator() public {
        // Bob registers as a creator
        vm.prank(bob);
        tipMyst.registerCreator("Bob", "Creator bio", "");

        // Alice claims faucet
        vm.prank(alice);
        token.claimFaucet();

        // Alice sends 1 MYST tip to Bob
        uint64 tipAmount = 1_000_000; // 1 MYST
        (externalEuint64 encTip, bytes memory proof) = encryptUint64(tipAmount, alice, address(tipMyst));

        vm.prank(alice);
        tipMyst.sendTip(bob, encTip, proof);

        // Verify Bob received the tip
        euint64 encBobBal = token.balanceOf(bob);
        bytes memory bobSig = signUserDecrypt(BOB_PK, address(token));
        uint256 bobBalance = userDecrypt(euint64.unwrap(encBobBal), bob, address(token), bobSig);
        assertEq(bobBalance, tipAmount);

        // Verify Alice was deducted
        euint64 encAliceBal = token.balanceOf(alice);
        bytes memory aliceSig = signUserDecrypt(ALICE_PK, address(token));
        uint256 aliceBalance = userDecrypt(euint64.unwrap(encAliceBal), alice, address(token), aliceSig);
        assertEq(aliceBalance, token.FAUCET_AMOUNT() - tipAmount);
    }

    function test_tipCountIncrements() public {
        vm.prank(bob);
        tipMyst.registerCreator("Bob", "Bio", "");

        vm.prank(alice);
        token.claimFaucet();

        uint64 tipAmount = 1_000_000;
        (externalEuint64 encTip, bytes memory proof) = encryptUint64(tipAmount, alice, address(tipMyst));

        vm.prank(alice);
        tipMyst.sendTip(bob, encTip, proof);

        (,,, uint256 tipCount) = tipMyst.getCreator(bob);
        assertEq(tipCount, 1);
    }

    function test_cannotTipNonCreator() public {
        vm.prank(alice);
        token.claimFaucet();

        uint64 tipAmount = 1_000_000;
        (externalEuint64 encTip, bytes memory proof) = encryptUint64(tipAmount, alice, address(tipMyst));

        vm.prank(alice);
        vm.expectRevert(TipMyst.NotRegistered.selector);
        tipMyst.sendTip(bob, encTip, proof);
    }

    function test_cannotTipSelf() public {
        vm.prank(alice);
        tipMyst.registerCreator("Alice", "Bio", "");

        vm.prank(alice);
        token.claimFaucet();

        uint64 tipAmount = 1_000_000;
        (externalEuint64 encTip, bytes memory proof) = encryptUint64(tipAmount, alice, address(tipMyst));

        vm.prank(alice);
        vm.expectRevert(TipMyst.SelfTip.selector);
        tipMyst.sendTip(alice, encTip, proof);
    }

    function test_insufficientBalanceSilentlyTransfersZero() public {
        vm.prank(bob);
        tipMyst.registerCreator("Bob", "Bio", "");

        // Alice has 0 balance, tries to tip 5 MYST
        uint64 tipAmount = 5_000_000;
        (externalEuint64 encTip, bytes memory proof) = encryptUint64(tipAmount, alice, address(tipMyst));

        vm.prank(alice);
        tipMyst.sendTip(bob, encTip, proof); // Should not revert

        // Bob should still have 0
        euint64 encBobBal = token.balanceOf(bob);
        bytes memory sig = signUserDecrypt(BOB_PK, address(token));
        uint256 bobBalance = userDecrypt(euint64.unwrap(encBobBal), bob, address(token), sig);
        assertEq(bobBalance, 0);
    }

    function test_getAllCreatorsReturnsCorrectList() public {
        vm.prank(alice);
        tipMyst.registerCreator("Alice", "Bio A", "");
        vm.prank(bob);
        tipMyst.registerCreator("Bob", "Bio B", "");

        address[] memory creators = tipMyst.getAllCreators();
        assertEq(creators.length, 2);
        assertEq(creators[0], alice);
        assertEq(creators[1], bob);
    }
}
