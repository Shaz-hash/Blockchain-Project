const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const mongoose = require('mongoose');
const SmartContract = require('../models/SmartContract'); // Import the SmartContract model

const contractDir = path.join(__dirname, '../contracts');
console.log("Policy Directory is : ",  contractDir);
async function deployContract(fileName) {
  const contractName = fileName.replace('.sol', '');
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  console.log(`Contract ${fileName} deployed to:`, contract.address);

  
  const smartContract = new SmartContract({
    name: contractName,
    address: contract.address,
  });

  await smartContract.save();
  console.log(`Contract ${contractName} saved to MongoDB`);
}

async function main() {
  await mongoose
    .connect(
      `mongodb+srv://new:new@blockchain.glqgkn6.mongodb.net/?retryWrites=true&w=majority&appName=Blockchain`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => {
      console.log('\x1b[34m%s\x1b[0m', 'DB connected');
    })
    .catch((err) => {
      console.error('\x1b[31m%s\x1b[0m', err);
      process.exit(1);
    });

  fs.readdir(contractDir, async (err, files) => {
    if (err) {
      console.error('Error reading policy directory:', err);
      process.exit(1);
    }

    const solFiles = files.filter(file => file.endsWith('.sol'));

    for (const file of solFiles) {
      const filePath = path.join(contractDir, file);
      await deployContract(file);
    }

    mongoose.disconnect();
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
