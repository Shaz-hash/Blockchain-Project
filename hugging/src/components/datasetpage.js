import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './datasetpage.css';

const DataSetPage = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileDetails, setFileDetails] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    // Simulate fetching files from backend
    const simulatedFiles = ["lumsDataset", "rutgersDataset", "policy"];
    setFiles(simulatedFiles);
    setNotification("Files fetched successfully.");
    document.body.classList.add('dataset-page');
    return () => {
      document.body.classList.remove('dataset-page');
    };
  }, []);

  const handleFileSelect = async (event) => {
    const fileName = event.target.value;
    setSelectedFile(fileName);
    await fileDetailsHandler(fileName);
  };

  const getPolicyDetails = async (fileName) => {
    try {
      const response = await axios.get(`http://localhost:3001/getPolicy/${fileName}`);
      if (response.status !== 200) {
        throw new Error('Policy not found');
      }
      const { newContractAddress, abi, argv, permissionFunction } = response.data;
      console.log("here's the response ");
      console.log(response.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching policy:", error);
      throw error;
    }
  };

  const fileDetailsHandler = async (fileName) => {
    try {
      const policyDetails = await getPolicyDetails(fileName);
      setFileDetails(policyDetails);
    } catch (error) {
      console.error("Error fetching file details:", error);
      setError("Error fetching file details");
    }
  };

  return (
    <div className='DataSetPageContainer'>
      <h1 className="header-title">DataSet Page</h1>
      <div className="dataset-select-container">
        <select
          style={{ backgroundColor: "white", width: "calc(100% - 40px)", color: 'grey' }}
          value={selectedFile}
          onChange={handleFileSelect}
        >
          <option value="" disabled>Select a dataset</option>
          {files.map((file, index) => (
            <option key={index} value={file}>{file}</option>
          ))}
        </select>
      </div>
      {fileDetails && (
        <div className="file-details">
          <h3>File Details</h3>
          <p><strong>Smart Contract Address:</strong> {fileDetails.newContractAddress}</p>
          <p><strong>Permission Function:</strong> {fileDetails.permissionFunction}</p>
          <p><strong>Arguments Needed for the permission function:</strong> {Array.isArray(fileDetails.argv) ? fileDetails.argv.join(", ") : "N/A"}</p>
        </div>
      )}
      {notification && <p className="notification-message">{notification}</p>}
      {error && <p className="notification-message error-message">{error}</p>}
    </div>
  );
}

export default DataSetPage;
