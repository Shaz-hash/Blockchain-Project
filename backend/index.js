const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRouter = require("./routers/auth");
const fileRouter = require("./routers/fileupload");
const multer = require('multer');
const fs = require('fs');
const path = require("path");
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const {Web3} = require('web3');
const Individual = require("./models/individual");

// Imports for the signature creation :
const ethUtil = require('ethereumjs-util');
const secp256k1 = require('secp256k1');
const ethers  = require('ethers');


const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json()); // Add body-parser middleware

// Need to later remove it to persistent datastorage format. 
const accessMap = new Map();


// JWT secret key


const jwtSecretKey = 'secret_key'; // Use a secure key and keep it safe
const PRIVATEKEY = '29a51884dea81b2eb575cd46bd51bd703cfb4c45e44ff0ee00f113b7b4339088';
const CONTRACTADDRESS = '0x0c00558dd823b1b093DD48D092C618319087D243';
const NODE_URL =
  "wss://sepolia.infura.io/ws/v3/f95f2b17b00a4d24b20398a713322329";
const myWeb3 = new Web3(new Web3.providers.WebsocketProvider(NODE_URL));
const logsFilter = {
  address: "0x0c00558dd823b1b093DD48D092C618319087D243", // Contract address
  topics: [
    encodeEvent("SignUpResult(string)"),
  ],
};
// Web3 setup - Update these values with your Ethereum node URL, contract address, and ABI and then uncomment the code below

// const web3 = new Web3('http://localhost:8545'); // Change to your Ethereum node URL
// const contractAddress = 'YOUR_CONTRACT_ADDRESS'; // Replace with your contract address
// const contractABI = [ /* YOUR CONTRACT ABI HERE */ ]; // Replace with your contract ABI
// const contract = new web3.eth.Contract(contractABI, contractAddress);

async function signMessage(message) {

  const originalMessageHash = ethUtil.keccak256(Buffer.from(message));
  const wallet = new ethers.Wallet(PRIVATEKEY);
  const signature = await wallet.signMessage(originalMessageHash);
  console.log("Signature created is : ", signature)
  return signature;
}




// Middleware to authenticate JWT and extract claims
function authenticateJWT(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(403).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, jwtSecretKey);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
}


// Function to verify the signatures passed by the users => will return true/false
async function verifySignature (message , givenSignature) {

  const originalMessageHash = ethUtil.keccak256(Buffer.from(message));
  const wallet = new ethers.Wallet(PRIVATEKEY);
  const signature = await wallet.signMessage(originalMessageHash);  
  // Comparin the Signatures here :
  if(givenSignature === signature)
  {
    console.log("Signature verified correctly !")
    return true 
  }
  else 
  {
    console.log("Signature verified incorrectly !")
    console.log(signature, "   ",givenSignature)
    return false
  }
}


// ******   Functions to listen to the target smart contract for the access rights & accordinly provide access/deny


// Function to encode the event topic
function encodeEvent(event) {
  return Web3.utils.sha3(event);
}
const subscribeToLogs = async () => {
  try {
    const subscription = await myWeb3.eth.subscribe('logs', logsFilter);

    subscription.on('data', handleLogs);
    subscription.on('error', handleError);

    // Clean up subscription on component unmount
    return () => {
      subscription.unsubscribe((error, success) => {
        if (success) console.log('Successfully unsubscribed!');
        else console.error('Error unsubscribing:', error);
      });
    };
  } catch (error) {
    console.error(`Error subscribing to new logs: ${error}`);
  }
};

// Fallback functions to react to the different events
const handleLogs = (log) => {
  
  console.log('Received log:', log);
  console.log(myWeb3.eth.abi.decodeParameter('string', log.data));

  let decodedData = myWeb3.eth.abi.decodeParameter('string', log.data);
  // handling the access accordinly in Memory(RAM for now) : 
  const [decision, publicKey, datasetID] = decodedData.split(':');
  
  // Only add to the map if the decision is true
  if (decision === 'true') {
    // const key = `${publicKey}:${datasetID}`;
    const key = publicKey.trim();
    // const key = publicKey;
    console.log("The key is : ", key)
    const blockNumber = log.blockNumber;
    
    // Store the block number in the map
    accessMap.set(key, blockNumber);
  }

};

const handleError = (error) => {
  console.error(`Error with log subscription: ${error}`);
};

// Call the subscription function
subscribeToLogs();


mongoose
  .connect(
    `mongodb+srv://new:new@blockchain.glqgkn6.mongodb.net/?retryWrites=true&w=majority&appName=Blockchain`
  )
  .then(() => {
    console.log("\x1b[34m%s\x1b[0m", "DB connected");
    app.listen(3001, () =>
      console.log("\x1b[33m%s\x1b[0m", "Listening at port 3001")
    );
  })
  .catch((err) => {
    console.error("\x1b[31m%s\x1b[0m", err);
  });

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  console.log("req.body", req.body);
  console.log("req.file", req.file);
});

app.get("/files", (req, res) => {
  fs.readdir("./uploads", (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ files });
  });
});






app.get("/files/:fileName", async (req, res) => {

  // Verify the Signature to ensure that it's the exactly the same person who wants the access

  const fileName = req.params.fileName;
  // Extract headers
  const authToken = req.headers['authorization'];
  const publicKey = req.headers['publickey'];
  const docId = req.headers['docid'];


  console.log("Doctor ID is : ", docId)

  // find the doc from the database :
  const individual = await Individual.findOne({ username : docId });
  console.log(individual);
  if (!individual) {
    return res.status(404).send({ message: 'Individual not found' });
  }

  // verify token:
  let stringifiedMsg = individual.doctorId + "," + individual.hospitalId + "," + individual.specialization + "," + individual.location; 
  console.log("String message is : ", stringifiedMsg)
  let boolVerifySignature = await verifySignature(stringifiedMsg , authToken) 
  if ( boolVerifySignature ===  false )
  {
    console.log("Token verification : Failed!!")
    return res.status(404).send({ message: 'Token verification failed !' });
  }
 

  // check if there is mapping available if yes then persue and delete it else throw errror :
  // let myKey = publicKey+":"+fileName;
  let myKey = publicKey.trim().toLowerCase();
  if (accessMap.has(myKey)) {
    const value = accessMap.get(myKey);
    console.log(`Found key: ${myKey}, value: ${value}`);
    
    // Delete the entry
    accessMap.delete(myKey);
    console.log(`Deleted key: ${myKey}`);
  } else {
    console.log(`Key not found: ${myKey}`);
    console.log('All keys in accessMap:');
    for (let k of accessMap.keys()) {
      console.log(k);
    }
    return res.status(404).send({ message: 'Permisssion not given !' });
  }
  // After verifying, check if any relevant event for that block has been emmitted or not ?

  // If event released, then grant the access for download 


  
  // const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'uploads', fileName);
  console.log("filePath", filePath);
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

 /* Following Function is to provide the client with the policy for the smart contract */

app.get("/getPolicy/:fileName", async (req, res) => {

  // 1) Extract artifacts json file 
  // 2) Extract the smart contract's address 
  // 3) Returns address, requirement Functions, permission function , abi 
  /* Server will store a mapping between FileName Against The Smart Contract Adress */
  /* Search the mongoDB to get the smart contract and return it's address */
  try {
    const fileName = req.params.fileName;
    console.log("BACKEND_STEP1 : filenName requested = ", fileName);
    const contractPath = path.join(__dirname, `../blockchain/artifacts/contracts/SC_20_21_13_28.sol/SC_20_21_13_28.json`);
    console.log("filepath is : ", contractPath);
    const myContract = require(contractPath);
    console.log("hello" , myContract.abi)
    // const policy = await Policy.findOne({ fileName });
    // if (!policy) {
    //   return res.status(404).send('Policy not found');
    // }
    res.json({
      newContractAddress: "0x1c2Ab6b1943f00f40bfff1079709A9394839Cb05",
      abi: myContract.abi,
      argv: "doctorId,hospitalId,specialization,accessRights,location",
      permissionFunction: "evaluate"
  });
} catch (error) {
  res.status(500).send('Error fetching policy');
}
  
  

});


  /* Following Function is responsible to provide you with the arguments required for the username and signed them*/

app.get("/getSignedDetails/:username" , async (req , res) => {

  try 
  {
    console.log("hereeeee1!!!")
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    console.log("token " , token);
    const argvString = req.headers['argv'];
    console.log("Argv " ,argvString);
    const args = argvString ? argvString.split(',') : [];
    if(args.length == 0 || !token)
    {

      console.log("sad")
      throw new Error("Arguments or Token not provided!");
    }
    console.log("hereeeee2!!!")
    const username = req.params.username;
    console.log("username", username);
    const individual = await Individual.findOne({ username: username });
    if (!individual) {
      return res.status(404).send({ message: 'Individual not found' });
    }
    console.log("hereeeee3!!!")
    // Extract the details dynamically based on args array
    const details = {}; let signedString = "";
    args.forEach( (arg , index) => {
      if (individual[arg] !== undefined) {
        if(arg == "doctorId" || arg == "hospitalId" || arg == "specialization" || arg == "location")
        { console.log("args allowed : ", arg) 
          signedString += individual[arg];
          if (index < args.length - 1) {
            signedString += ',';
          }}
        details[arg] = individual[arg]
      }
      else 
      {
        let errMsg = "Argument " + arg + " doesnt exist in schema !";
        console.log(errMsg)
        throw new Error(errMsg);
      }
    });
    console.log("String is : ", signedString)
    let signature = await signMessage(signedString);
    console.log(signature);
    res.json({
      individualDetails : details,
      signature : signature  
    })
    
  }
  catch (error)
  {
    res.status(404).send({ message: 'Server error', error: error.message }); 
  }
});


app.get('/api/individuals/:username', async (req, res) => {
  try {
    
    // Extracting the Token :
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    console.log("the token value is : ", token);

    if (!token) return res.status(401).json({ message: 'Token not found' });
    console.log("the token value is : ", token);
    
    const username = req.params.username;
    console.log("username", username);
    const individual = await Individual.findOne({ username: username });
    console.log(individual);
    if (!individual) {
      return res.status(404).send({ message: 'Individual not found' });
    }

    // Verifying the Token :
    let stringifiedMsg = individual.doctorId + "," + individual.hospitalId + "," + individual.specialization + "," + individual.location; 
    console.log("String message is : ", stringifiedMsg)
    let boolVerifySignature = await verifySignature(stringifiedMsg , token) 
    if ( boolVerifySignature ===  true )
    {
      console.log("Token verification : Sucess!!")
      res.json(individual);
    }
    else 
    {
      console.log("Token verification : Failed!!")
      return res.status(404).send({ message: 'Token verification failed !' });
    }
    // res.json(individual);
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

// JWT-protected endpoint to evaluate access
app.post('/evaluate', authenticateJWT, async (req, res) => {
  const { datasetID } = req.body;
  const { doctorID, hospitalID, specialization, accessRights, location } = req.user;

  try {
    const accounts = await web3.eth.getAccounts();
    const result = await contract.methods.evaluate(
      datasetID,
      doctorID,
      hospitalID,
      specialization,
      accessRights,
      location
    ).send({ from: accounts[0] });

    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.use("/auth", authRouter);

