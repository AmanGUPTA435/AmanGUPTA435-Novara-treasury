// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

address constant VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));

interface Vm {
    struct Log {
        bytes32[] topics;
        bytes data;
        address emitter;
    }

    function startBroadcast() external;
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
    function writeFile(string calldata path, string calldata data) external;
    function toString(address value) external pure returns (string memory);
    function toString(uint256 value) external pure returns (string memory);
    function prank(address msgSender) external;
    function startPrank(address msgSender) external;
    function stopPrank() external;
    function expectRevert() external;
    function expectRevert(bytes calldata revertData) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
    function deal(address account, uint256 newBalance) external;
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
}

abstract contract Script {
    Vm internal constant vm = Vm(VM_ADDRESS);
}

abstract contract Test {
    Vm internal constant vm = Vm(VM_ADDRESS);

    function assertEq(uint256 a, uint256 b) internal pure {
        require(a == b, "assertEq(uint) failed");
    }

    function assertEq(uint256 a, uint256 b, string memory err) internal pure {
        require(a == b, err);
    }

    function assertEq(address a, address b) internal pure {
        require(a == b, "assertEq(address) failed");
    }

    function assertEq(string memory a, string memory b) internal pure {
        require(keccak256(bytes(a)) == keccak256(bytes(b)), "assertEq(string) failed");
    }

    function assertEq(uint8 a, uint8 b) internal pure {
        require(a == b, "assertEq(uint8) failed");
    }

    function assertTrue(bool value) internal pure {
        require(value, "assertTrue failed");
    }

    function assertTrue(bool value, string memory err) internal pure {
        require(value, err);
    }

    function assertGt(uint256 a, uint256 b) internal pure {
        require(a > b, "assertGt failed");
    }

    function assertGe(uint256 a, uint256 b) internal pure {
        require(a >= b, "assertGe failed");
    }
}
