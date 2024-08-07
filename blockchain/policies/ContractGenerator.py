def read_data(file_path):
    """
    Reads key-value pairs from the given file path and returns a dictionary of the pairs.
    """
    data = {}
    with open(file_path, 'r') as file:
        for line in file:
            key, value = line.strip().split(': ')
            data[key.strip()] = value.strip()
    return data

def generate_evaluate_function(keys):
    """
    Generates the condition part of the evaluate function dynamically based on the keys.
    """
    conditions = []
    for key in keys:
        condition = f'keccak256(abi.encodePacked(datasetPolicies["{key}"])) == keccak256(abi.encodePacked({key}))'
        conditions.append(condition)
    condition_string = " && ".join(conditions)
    return condition_string

def generate_contract(data):
    """
    Generates a Solidity smart contract with dynamic dataset-specific policies based on the provided data.
    """
    keys = list(data.keys())
    evaluate_conditions = generate_evaluate_function(keys)
    policy_lines = "\n".join([f'        datasetPolicies["{key}"] = "{value}";' for key, value in data.items()])
    input_fields = ",".join(keys)  # Collects all the keys as a comma-separated string
    parameters = ", ".join([f"string memory {key}" for key in keys])
    concat_parameters = ', ", ", '.join(keys)

    base_contract = f"""
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

contract SC_20_21_13_28 {{
    using Strings for uint256;

    address public constant publicKey =
        0x7264d9Fd1a56D865D8B7D96E5251A6eFE820b483;

    event SignUpResult(string success);

    // Store dataset-specific access control policies
    mapping(string => string) datasetPolicies;

    constructor() {{{{
{policy_lines}
    }}}}

    function getPolicy() public pure returns (string memory) {{{{
        return "{input_fields}";
    }}}}

    function evaluate(
        string memory datasetID,
        {parameters},
        bytes memory signature
    ) public {{{{
        // Verifying the Signature first:
        require(
            verify(
                publicKey,
                string(
                    abi.encodePacked(
                        {concat_parameters}
                    )
                ),
                signature
            ) == true,
            "Invalid signature"
        );

        // Policy Evaluation
        bool permit = {evaluate_conditions};

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
    }}}}

    function getMessageHash(
        string memory _message
    ) public pure returns (bytes32) {{{{
        return keccak256(abi.encodePacked(_message));
    }}}}

    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) public pure returns (bytes32) {{{{
        return
            keccak256(
                abi.encodePacked(
                    "\\x19Ethereum Signed Message:\\n32",
                    _messageHash
                )
            );
    }}}}

    function verify(
        address _signer,
        string memory _message,
        bytes memory signature
    ) public pure returns (bool) {{{{
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }}}}

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {{{{
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }}}}

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {{{{
        require(sig.length == 65, "invalid signature length");

        assembly {{{{
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }}}}
    }}}}

    function convert() public view returns (string memory) {{{{
        address addr = msg.sender;
        return toString(addr);
    }}}}

    function toString(address _addr) internal pure returns (string memory) {{{{
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';

        for (uint256 i = 0; i < 20; i++) {{{{
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }}}}
        return string(str);
    }}}}
}}
    """
    return base_contract

def main():
    file_path = "policy.txt"  # Modify this path to the location of your text file.
    data = read_data(file_path)
    contract = generate_contract(data)
    with open("specialisation-location.sol", "w") as f:
        f.write(contract)
    print("Contract generated successfully!")

if __name__ == "__main__":
    main()
