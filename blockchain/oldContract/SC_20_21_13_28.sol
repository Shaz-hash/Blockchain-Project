// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

contract SC_20_21_13_28 {
    using Strings for uint256;

    address public constant publicKey =
        0x7264d9Fd1a56D865D8B7D96E5251A6eFE820b483;

    event SignUpResult(string success);

    // Attribute Management
    mapping(string => mapping(string => bool)) doctorIsAuthorized;
    mapping(string => mapping(string => bool)) doctorSpecialization;
    mapping(string => mapping(string => bool)) doctorHasAccessRights;
    mapping(string => mapping(string => bool)) datasetLocation;

    // uint public calls;

    // Store dataset-specific access control policies
    mapping(string => mapping(string => mapping(string => bool))) datasetPolicies;

    constructor() {
        // Attribute Management
        doctorIsAuthorized["doc123"]["hospitalA"] = true;
        doctorSpecialization["doc123"]["Cardiology"] = true;
        doctorHasAccessRights["doc123"]["Read-Write"] = true;

        doctorIsAuthorized["doc456"]["hospitalA"] = false;
        doctorSpecialization["doc456"]["Cardiology"] = false;
        doctorHasAccessRights["doc456"]["Read-Write"] = false;

        datasetLocation["hospitalA"]["Cloud"] = true;
        datasetLocation["hospitalB"]["Local"] = true;

        // calls = 0;

        // Initialize dataset-specific policies
        datasetPolicies["dataset1"]["access-subject"]["isAuthorized"] = true;
        datasetPolicies["dataset1"]["access-subject"][
            "specializationCardiology"
        ] = true;
        datasetPolicies["dataset1"]["access-subject"][
            "hasAccessRightsRead-Write"
        ] = true;
        datasetPolicies["dataset1"]["dataset"]["locationCloud"] = true;
    }

    function evaluate(
        string memory datasetID,
        string memory doctorID,
        string memory hospitalID,
        string memory specialization,
        string memory accessRights,
        string memory location,
        bytes memory signature
    ) public {
        // Verifying the Signature first:
        require(
            verify(
                publicKey,
                string(
                    abi.encodePacked(
                        doctorID,
                        ",",
                        hospitalID,
                        ",",
                        specialization,
                        ",",
                        location
                    )
                ),
                signature
            ) == true,
            "Invalid signature"
        );

        // Attribute Management
        bool isAuthorized = doctorIsAuthorized[doctorID][hospitalID];
        bool hasSpecialization = doctorSpecialization[doctorID][specialization];
        bool hasAccessRights = doctorHasAccessRights[doctorID][accessRights];
        bool locationMatches = datasetLocation[hospitalID][location];

        // Policy Evaluation
        bool permit = true;

        if (datasetPolicies[datasetID]["access-subject"]["isAuthorized"]) {
            permit = permit && isAuthorized;
        }

        if (
            datasetPolicies[datasetID]["access-subject"][
                string(abi.encodePacked("specialization", specialization))
            ]
        ) {
            permit = permit && hasSpecialization;
        }

        if (
            datasetPolicies[datasetID]["access-subject"][
                string(abi.encodePacked("hasAccessRights", accessRights))
            ]
        ) {
            permit = permit && hasAccessRights;
        }

        if (
            datasetPolicies[datasetID]["dataset"][
                string(abi.encodePacked("location", location))
            ]
        ) {
            permit = permit && locationMatches;
        }

        string memory myAddress = convert();
        string memory decision = string(
            abi.encodePacked(
                permit ? "true" : "false",
                ":",
                myAddress,
                ":",
                datasetID
            )
        );

        emit SignUpResult(decision);
    }

    function getMessageHash(
        string memory _message
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_message));
    }

    function getSender() public view returns (address) {
        return msg.sender;
    }

    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function verify(
        address _signer,
        string memory _message,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function convert() public view returns (string memory) {
        address addr = msg.sender;
        string memory addrStr = toString(addr);
        return addrStr;
    }

    function toString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }

        return string(str);
    }
}
