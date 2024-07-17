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
const SmartContract = require("./models/SmartContract");

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
const PRIVATEKEY0x = '29a51884dea81b2eb575cd46bd51bd703cfb4c45e44ff0ee00f113b7b4339088';
const CONTRACTADDRESS = '0x1c2Ab6b1943f00f40bfff1079709A9394839Cb05';
const NODE_URL =
  "wss://sepolia.infura.io/ws/v3/f95f2b17b00a4d24b20398a713322329";
const myWeb3 = new Web3(new Web3.providers.WebsocketProvider(NODE_URL));

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


const createLogsFilter = (address) => ({
  address, // Contract address
  topics: [
    encodeEvent("SignUpResult(string)"),
  ],
});

// Function to encode the event topic
function encodeEvent(event) {
  return Web3.utils.sha3(event);
}

const subscribeToLogs = async (logsFilter) => {
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

const startEventListeners = async () => {
  try {
    const smartContracts = await SmartContract.find();
    if (!smartContracts.length) {
      console.log("No smart contracts found in the database.");
      return;
    }

    smartContracts.forEach(contract => {
      const logsFilter = createLogsFilter(contract.address);
      subscribeToLogs(logsFilter);
      console.log(`Listening to events for contract: ${contract.address}`);
    });
  } catch (error) {
    console.error("Error fetching smart contracts from DB:", error);
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
    let key = publicKey.trim().toLowerCase();
    let fileName = datasetID.trim().toLowerCase();
    // const key = publicKey;
    console.log("The key is : ", key)
    const blockNumber = log.blockNumber;
    key = `${key}:${fileName}`;
    // Store the block number in the map
    accessMap.set(key, blockNumber);
  }

};

const handleError = (error) => {
  console.error(`Error with log subscription: ${error}`);
};

// Call the subscription function
// subscribeToLogs();
// startEventListeners();

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

startEventListeners();

const upload = multer({ storage });

// app.post('/upload', upload.single('file'), (req, res) => {
//   console.log("req.body", req.body);
//   console.log("req.file", req.file);
// });

app.post('/upload', upload.fields([{ name: 'file' }, { name: 'xacmlFile' }, { name: 'jsonTermsFile' }]), (req, res) => {
  console.log("req.body", req.body);
  console.log("req.files", req.files);
  
  if (!req.files.file || !req.files.xacmlFile || !req.files.jsonTermsFile) {
    return res.status(400).json({ error: "All files (data, XACML, and JSON of terms) must be selected to upload." });
  }

  res.status(200).json({ message: "Files uploaded successfully!" });
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

  let fileName = req.params.fileName;
  // Extract headers
  let authToken = req.headers['authorization'];
  const publicKey = req.headers['publickey'];
  const docId = req.headers['docid'];

  authToken = authToken && authToken.split(' ')[1];
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
  fileName = fileName.trim().toLowerCase();
  myKey = `${myKey}:${fileName}`;
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
  fileName = fileName + ".pdf";
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
    // First Verify see if the value is in DB :
    const smartContract = await SmartContract.findOne({ name : fileName });
    if (!smartContract) {
      return res.status(404).send({ message: 'SmartContract with this policy not found' });
    }
    const contractPath = path.join(__dirname, `../blockchain/artifacts/contracts/${fileName}.sol/${fileName}.json`);

    /* Fetching The Json Term Policy : */
    const jsonTermsPath = path.join(__dirname, `/uploads/${fileName}Terms.json`);
    const fileTerms = require(jsonTermsPath);





    console.log("filepath is : ", contractPath);
    const myContract = require(contractPath);
    console.log("hello" , myContract.abi)
    // Get the contract instance
    const contract = new myWeb3.eth.Contract(myContract.abi, smartContract.address);

    // Example: Call a pure function 'getPolicy' from the smart contract
    const result = await contract.methods.getPolicy().call();

    console.log("requirements for the contract : ", fileName , " is  : ", result)
    console.log("BACKEND_STEP1 : filenName requested = ", fileName);
    
    
    // const policy = await Policy.findOne({ fileName });
    // if (!policy) {
    //   return res.status(404).send('Policy not found');
    // }
    res.json({
      newContractAddress: smartContract.address,
      abi: myContract.abi,
      argv: result,
      permissionFunction: "evaluate",
      terms : fileTerms 
  });
} catch (error) {
  console.log("Error !" , error)
  res.status(500).send('Error fetching policy');
}
});


  /* Following Function is responsible to provide you with the arguments required for the username and signed them*/

app.get("/getSignedDetails/:username" , async (req , res) => {

  try 
  {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    const argvString = req.headers['argv'];
    console.log("Argv " ,argvString);
    const args = argvString ? argvString.split(',') : [];
    if(args.length == 0 || !token)
    {
      throw new Error("Arguments or Token not provided!");
    }
    const username = req.params.username;
    console.log("username", username);
    const individual = await Individual.findOne({ username: username });
    if (!individual) {
      return res.status(404).send({ message: 'Individual not found' });
    }
    // Extract the details dynamically based on args array
    const details = {}; let signedString = "";
    args.forEach( (arg , index) => {
      if (individual[arg] !== undefined) {
         console.log("args allowed : ", arg) 
          signedString += individual[arg];
          if (index < args.length - 1) {
            signedString += ', ';
          }
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

