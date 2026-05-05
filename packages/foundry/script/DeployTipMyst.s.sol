// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {MYSTToken} from "../src/MYSTToken.sol";
import {TipMyst} from "../src/TipMyst.sol";

contract DeployTipMyst is Script {
    function run() external {
        vm.startBroadcast();

        MYSTToken token = new MYSTToken();
        console.log("MYSTToken deployed at:", address(token));

        TipMyst tipMyst = new TipMyst(address(token));
        console.log("TipMyst deployed at:  ", address(tipMyst));

        token.setTipMyst(address(tipMyst));
        console.log("TipMyst authorised as operator on MYSTToken");

        vm.stopBroadcast();
    }
}
