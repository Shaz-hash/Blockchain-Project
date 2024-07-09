// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

contract old_SC_20_21_13_28 {
    using Strings for uint256;

    // Public Key of the 3rd Party to verify the Signature send over Smart Contract for the authorization for credentials :
    address public constant publicKey =
        0x7264d9Fd1a56D865D8B7D96E5251A6eFE820b483;

    // event SignUpResult(bool success);
    event SignUpResult(string success);

    // Attribute Management
    mapping(string => mapping(string => uint)) doctorIsAuthorized;
    mapping(string => mapping(string => uint)) doctorSpecialization;
    mapping(string => mapping(string => uint)) doctorHasAccessRights;
    mapping(string => mapping(string => uint)) datasetLocation;

    uint public calls;
    mapping(string => mapping(string => mapping(string => uint))) policy;
    mapping(string => uint) indexResolver;
    mapping(uint => mapping(uint => mapping(uint => bool))) clauseResults;

    uint categoryCount;
    mapping(uint => uint) attributeCounts;
    mapping(uint => mapping(uint => uint)) valueCounts;

    mapping(string => string) payload;
    mapping(string => string) policyResults;

    // Store dataset-specific access control policies
    mapping(string => mapping(string => mapping(string => uint))) datasetPolicies;

    // ******** Signature Library ~ Starts here ********

    // Signature Validation :
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
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
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
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }

    // ******** Signature Library ~ Ends here ********

    constructor() {
        // Attribute Management
        doctorIsAuthorized["doc123"]["hospitalA"] = 1;
        doctorSpecialization["doc123"]["Cardiology"] = 1;
        doctorHasAccessRights["doc123"]["Read-Write"] = 1;

        datasetLocation["hospitalA"]["Cloud"] = 1;
        datasetLocation["hospitalB"]["Local"] = 1;

        calls = 0;

        // Policy Management
        policy["access-subject"]["isAuthorized"]["true"] = 1;
        indexResolver["access-subject"] = 1;
        indexResolver["access-subjectisAuthorized"] = 1;
        indexResolver["access-subjectisAuthorizedtrue"] = 1;
        categoryCount++;
        attributeCounts[1]++;
        valueCounts[1][1]++;

        policy["access-subject"]["specialization"]["Cardiology"] = 1;
        indexResolver["access-subjectspecialization"] = 2;
        indexResolver["access-subjectspecializationCardiology"] = 1;
        attributeCounts[1]++;
        valueCounts[1][2]++;

        policy["access-subject"]["hasAccessRights"]["Read-Write"] = 1;
        indexResolver["access-subjecthasAccessRights"] = 3;
        indexResolver["access-subjecthasAccessRightsRead-Write"] = 1;
        attributeCounts[1]++;
        valueCounts[1][3]++;

        policy["dataset"]["location"]["Cloud"] = 1;
        indexResolver["dataset"] = 2;
        indexResolver["datasetlocation"] = 1;
        indexResolver["datasetlocationCloud"] = 1;
        categoryCount++;
        attributeCounts[2]++;
        valueCounts[2][1]++;
    }

    function evaluate(
        string memory datasetID,
        string memory doctorID,
        string memory hospitalID,
        string memory specialization,
        string memory accessRights,
        string memory location
    ) public {
        // Attribute Management
        string[12] memory request;
        uint length = 0;

        if (doctorIsAuthorized[doctorID][hospitalID] == 1) {
            request[length] = "access-subject";
            request[length + 1] = "isAuthorized";
            request[length + 2] = "true";
            length += 3;
        }

        if (doctorSpecialization[doctorID][specialization] == 1) {
            request[length] = "access-subject";
            request[length + 1] = "specialization";
            request[length + 2] = specialization;
            length += 3;
        }

        if (doctorHasAccessRights[doctorID][accessRights] == 1) {
            request[length] = "access-subject";
            request[length + 1] = "hasAccessRights";
            request[length + 2] = accessRights;
            length += 3;
        }

        if (datasetLocation[hospitalID][location] == 1) {
            request[length] = "dataset";
            request[length + 1] = "location";
            request[length + 2] = location;
            length += 3;
        }

        // Check against dataset-specific policy
        for (uint i = 0; i < length; i += 3) {
            string memory category = request[i];
            string memory attrID = request[i + 1];
            string memory value = request[i + 2];

            if (datasetPolicies[datasetID][category][attrID] == 1) {
                clauseResults[indexResolver[category]][
                    indexResolver[append(category, attrID, "")]
                ][indexResolver[append(category, attrID, value)]] = true;
            }
        }

        bool permit = true;

        for (uint i = 1; i <= categoryCount; i++) {
            for (uint j = 1; j <= attributeCounts[i]; j++) {
                for (uint k = 1; k <= valueCounts[i][j]; k++) {
                    if (clauseResults[i][j][k]) {
                        clauseResults[i][j][k] = false;
                    } else {
                        permit = false;
                    }
                }
            }
        }

        if (permit) {
            policyResults[datasetID] = "Permit";
        } else {
            policyResults[datasetID] = "Deny";
        }

        calls++;
    }

    function evaluate2(
        string memory datasetID,
        string memory doctorID,
        string memory hospitalID,
        string memory specialization,
        string memory accessRights,
        string memory location,
        bytes memory signature
    ) public {
        // Attribute Management
        string[12] memory request;
        uint length = 0;

        // Verifying the Signature first :
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

        // Now Continuing with the authorization via access policy rules in Contract

        if (doctorIsAuthorized[doctorID][hospitalID] == 1) {
            request[length] = "access-subject";
            request[length + 1] = "isAuthorized";
            request[length + 2] = "true";
            length += 3;
        }

        if (doctorSpecialization[doctorID][specialization] == 1) {
            request[length] = "access-subject";
            request[length + 1] = "specialization";
            request[length + 2] = specialization;
            length += 3;
        }

        if (doctorHasAccessRights[doctorID][accessRights] == 1) {
            request[length] = "access-subject";
            request[length + 1] = "hasAccessRights";
            request[length + 2] = accessRights;
            length += 3;
        }

        if (datasetLocation[hospitalID][location] == 1) {
            request[length] = "dataset";
            request[length + 1] = "location";
            request[length + 2] = location;
            length += 3;
        }

        // Check against dataset-specific policy
        for (uint i = 0; i < length; i += 3) {
            string memory category = request[i];
            string memory attrID = request[i + 1];
            string memory value = request[i + 2];

            if (datasetPolicies[datasetID][category][attrID] == 1) {
                clauseResults[indexResolver[category]][
                    indexResolver[append(category, attrID, "")]
                ][indexResolver[append(category, attrID, value)]] = true;
            }
        }

        bool permit = true;
        string memory myAddress = convert();
        string memory decision = string(
            abi.encodePacked("false", ":", myAddress)
        );

        for (uint i = 1; i <= categoryCount; i++) {
            for (uint j = 1; j <= attributeCounts[i]; j++) {
                for (uint k = 1; k <= valueCounts[i][j]; k++) {
                    if (clauseResults[i][j][k]) {
                        clauseResults[i][j][k] = false;
                    } else {
                        permit = false;
                    }
                }
            }
        }

        if (permit == true) {
            decision = string(abi.encodePacked("true", ":", myAddress));
        }

        emit SignUpResult(decision);
    }

    function getEvaluationResult(
        string memory ID
    ) public view returns (string memory) {
        return policyResults[ID];
    }

    function bytes32ToString(bytes32 x) internal pure returns (string memory) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;

        for (uint j = 0; j < 32; j++) {
            bytes1 char = bytes1(bytes32(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }

        bytes memory bytesStringTrimmed = new bytes(charCount);

        for (uint j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }

        return string(bytesStringTrimmed);
    }

    function append(
        string memory a,
        string memory b,
        string memory c
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b, c));
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function uint2str(
        uint _i
    ) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
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
