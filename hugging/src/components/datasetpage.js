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
    async function fetchFiles() {
      try {
        const response = await axios.get('http://localhost:3001/files');
        setFiles(response.data.files);
        setNotification("Files fetched successfully.");
      } catch (error) {
        setError('Error fetching files');
      }
    }

    fetchFiles();
    document.body.classList.add('dataset-page');
    return () => {
      document.body.classList.remove('dataset-page');
    };
  }, []);

  const handleFileSelect = (event) => {
    const fileName = event.target.value;
    setSelectedFile(fileName);
    fileDetailsHandler(fileName);
  };

  const fileDetailsHandler = (fileName) => {
    // Hardcoded values for demonstration
    const details = {
      address: "4r42f3rgtg543432de2f3rr",
      permissionFunction: "Cardiology()",
      arguments: ["doctorName", "DoctorID", "Specialization"]
    };
    setFileDetails(details);
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
          <p><strong>Contract Address:</strong> {fileDetails.address}</p>
          <p><strong>Permission Function:</strong> {fileDetails.permissionFunction}</p>
          <p><strong>Arguments:</strong> {fileDetails.arguments.join(", ")}</p>
        </div>
      )}
      {notification && <p className="notification-message">{notification}</p>}
      {error && <p className="notification-message error-message">{error}</p>}
    </div>
  );
}

export default DataSetPage;