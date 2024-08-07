import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './workflowpage.css';

import Web3 from 'web3';
const ethers = require("ethers");

const NODE_URL =
  "wss://sepolia.infura.io/ws/v3/f95f2b17b00a4d24b20398a713322329";
const web3 = new Web3(NODE_URL);

const WorkflowPage = () => {
  const [inputValue, setInputValue] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [workflowDetails, setWorkflowDetails] = useState([]);
  const [fileDetails, setFileDetails] = useState([]);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState(null);

  const workflows = [
    "Workflow 1 : lumsDataset,rutgersDataset,policy",
    "Workflow 2 : lumsDataset,rutgersDataset",
    "Workflow 3 : policy"
  ];

  const [userDetails, setUserDetails] = useState({
    doctorId: "",
    hospitalId: "",
    specialization: "",
    location: ""
  });

  useEffect(() => {
    document.body.classList.add('workflow-page');
    return () => {
      document.body.classList.remove('workflow-page');
    };
  }, []);

  const updateFileUrl = (fileName, fileUrl) => {
    setFileDetails(prevDetails =>
      prevDetails.map(file =>
        file.fileName === fileName
          ? { ...file, details: { ...file.details, fileUrl } }
          : file
      )
    );
  };

  const updateFileTxnHash = (fileName, txnHash) => {
    setFileDetails(prevDetails =>
      prevDetails.map(file =>
        file.fileName === fileName
          ? { ...file, details: { ...file.details, txnHash } }
          : file
      )
    );
  };

  const updateFileTxnResult = (fileName, txnRawResult) => {
    setFileDetails(prevDetails =>
      prevDetails.map(file =>
        file.fileName === fileName
          ? { ...file, details: { ...file.details, txnRawResult } }
          : file
      )
    );
  };

  /* Backend related APIS functions */

  const getUserSecretDetails = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in.');
      }
      const credentials = await axios.get(`http://localhost:3001/api/individuals/${inputValue}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      return credentials.data;

    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // The following function will ask the backend for the details required w.r.t to the file needed:
  const getPolicyDetails = async (fileName) => {
    try {
      const response = await axios.get(`http://localhost:3001/getPolicy/${fileName}`);
      if (response.status !== 200) {
        throw new Error('Policy not found');
      }
      const { newContractAddress, abi, argv, permissionFunction } = response.data;
      console.log("heres the response ")
      console.log(response.data)

      return response.data;
    } catch (error) {
      console.error("Error fetching policy:", error);
      throw error;
    }
  };

  const callSmartContractWithtxn = async (contractAddress, contractABI, functionName, args) => {
    try {
      console.log(contractABI, contractAddress)
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      // Create a new instance of web3 with the provider
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      const accounts = await web3.eth.getAccounts();
      const fromAccount = accounts[0];
      console.log(fromAccount)
      console.log("function name is : ", functionName, "args are : ", args);
      const method = contract.methods[functionName](...args);
      const gas = await method.estimateGas({ from: fromAccount });
      // Send the transaction
      const result = await method.send({ from: fromAccount, gas });
      console.log(result)
      return result;
    } catch (error) {
      console.error("Error calling contract function:", error);
      throw error;
    }
  };

  const getSignedDetails = async (argv) => {
    try {
      let authToken = getAuthToken();
      const signedCredentials = await axios.get(`http://localhost:3001/getSignedDetails/${inputValue}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Argv': argv
        }
      });
      // Extract individual details into an array
      const individualDetails = signedCredentials.data.individualDetails;
      const detailsArray = Object.values(individualDetails);

      console.log('Signed details array:', detailsArray);
      console.log('Signature:', signedCredentials.data.signature);
      detailsArray.push(signedCredentials.data.signature);
      return detailsArray;
    }
    catch (error) {
      console.error("Error in retrieving signed details : ", error)
    }
  }

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  function getAuthToken() {
    return localStorage.getItem('authToken');
  }

  const handleWorkflowSelect = (event) => {
    const workflow = event.target.value;
    setSelectedWorkflow(workflow);
    parseWorkflow(workflow);
  };

  const parseWorkflow = (workflow) => {
    const [, datasets] = workflow.split(": ");
    const datasetArray = datasets.split(",");
    setWorkflowDetails(datasetArray);
    buttonHandler(datasetArray);
  };

  const fileDetailsHandler = (fileName, newContractAddress, abi, argv, mypermissionFunction) => {
    const details = {
      address: newContractAddress,
      permissionFunction: mypermissionFunction,
      arguments: argv,
      contractAbi: abi,
      signedDetails: '',
      fileUrl: '',
      txnHash : '',
      blockHash : '',
      txnRawResult : ''
    };
    setFileDetails(prevDetails => [...prevDetails, { fileName, details }]);
  };

  const updateSignedDetails = (fileName, signedDetails) => {
    setFileDetails(prevDetails =>
      prevDetails.map(file =>
        file.fileName === fileName
          ? { ...file, details: { ...file.details, signedDetails } }
          : file
      )
    );
  };

  const callSmartContractWithTxn = async (contractAddress, contractABI, functionName, args) => {
    // Mocking contract call result
    return { success: true, decision: true };
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const buttonHandler = async (datasetArray) => {
    try {
      setFileDetails([]); // Clear previous details

      let userCreds = await getUserSecretDetails();
      if (userCreds == null) {
        throw new Error('Authentication token not found. Please log in.');
      }
      else {
        const { doctorId, hospitalId, specialization, accessRights, location } = userCreds;
        setUserDetails({ doctorId, hospitalId, specialization, location });
      }

      for (const fileName of datasetArray) {

        let { newContractAddress, abi, argv, permissionFunction } = await getPolicyDetails(fileName);

        fileDetailsHandler(fileName, newContractAddress, abi, argv, permissionFunction);

        await sleep(4000);

        let signedArgv = await getSignedDetails(argv);
        updateSignedDetails(fileName, signedArgv);

        signedArgv.unshift(fileName);

        const receipt = await callSmartContractWithtxn(newContractAddress, abi, permissionFunction, signedArgv);
        console.log("reciept for txn : ");
        console.log(receipt);



        let txnResult = web3.eth.abi.decodeParameter('string', receipt.logs[0].data);

        updateFileUrl(fileName, `https://sepolia.etherscan.io/address/${newContractAddress}`);
        updateFileTxnHash(fileName, receipt.transactionHash);
        updateFileTxnResult(fileName , txnResult);
        // updateSignedDetails(fileName, signedArgv);

        const [decision, publicKey, datasetID] = txnResult.split(':');

        if (decision == "true") {
          setNotification(`Smart Contract's Access Policy's Result for ${fileName} is Permit`);
        } else {
          setNotification(`Smart Contract's Access Policy's Result for ${fileName} is Denied`);
          throw new Error(`WorkFlow failed by the smart contract for the file : ${fileName}`);
          break;
        }
      }

      setNotification("Workflow satisfied");
    } catch (error) {
      setNotification("Workflow Not Satisfied ! ");
      console.error(error);
    }
  };

  return (
    <div className='WorkflowPageContainer'>
      <h1 className="header-title">Workflow Page</h1>
      <div className="user-details">
        <p><strong>Doctor ID:</strong> {userDetails.doctorId}</p>
        <p><strong>Hospital ID:</strong> {userDetails.hospitalId}</p>
        <p><strong>Specialization:</strong> {userDetails.specialization}</p>
        <p><strong>Location:</strong> {userDetails.location}</p>
      </div>
      <div className="workflow-select-container">
        <input style={{ backgroundColor: "white" }} type="text" value={inputValue} onChange={handleInputChange} placeholder="Enter your username" />
        <select
          style={{ backgroundColor: "white", width: "calc(100% - 40px)", color: 'grey' }}
          value={selectedWorkflow}
          onChange={handleWorkflowSelect}
        >
          <option value="" disabled>Select a workflow</option>
          {workflows.map((workflow, index) => (
            <option key={index} value={workflow}>{workflow}</option>
          ))}
        </select>
      </div>
      {fileDetails.map((file, index) => (
        <div key={index} className="file-details">
          <h3>File: {file.fileName}</h3>
          <p><strong>Contract Address:</strong> {file.details.address}</p>
          <p><strong>Permission Function:</strong> {file.details.permissionFunction}</p>
          <p><strong>Arguments:</strong> {file.details.arguments}</p>
          <p><strong>Signed Details from 3rd Party :</strong> {JSON.stringify(file.details.signedDetails)}</p> {/* Display signed details */}
          {file.details.fileUrl && (
            <p><strong>Transaction URL:</strong> {file.details.fileUrl}</p>
          )}
          {file.details.txnHash && (
            <p><strong>Transaction Hash :</strong> {file.details.txnHash}</p>
          )}
          {file.details.txnRawResult && (
            <p><strong>Transaction Event Result :</strong> {file.details.txnRawResult}</p>
          )}
        </div>
      ))}
      {notification && <p className="notification-message">{notification}</p>}
      {error && <p className="notification-message error-message">{error}</p>}
    </div>
  );
}

export default WorkflowPage;
