#!/bin/bash

## Step 1 : run the python File xacml-parser.py on each policies with extension .xml:
            # Goal : the file which we will pass it, it will create a contract with its name in the same directory.

## Step 2 : run the deploy.js 
            # Goal : Deploy the smartContract and store the smart Contract into schema of MongoDB

## Step 4 : run the 

# Directory containing the XML files
policy_dir="../policies"

# Directory to store the generated smart contracts
contracts_dir="../contracts"

# Get all .xml files in the directory into an array
xml_files=("$policy_dir"/*.xml)

# Check if there are any .xml files in the directory
if [ ${#xml_files[@]} -eq 0 ]; then
  echo "No .xml files found in $policy_dir"
  exit 1
fi

# Loop through the array and call the Python script for each file
for xml_file in "${xml_files[@]}"; do
  echo "Processing $xml_file..."
  python3 ../policies/xacml-parser.py "$xml_file" "$contracts_dir"
done


























