import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Link } from 'react-router-dom';
import './fileupload.css';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [xacmlFile, setXacmlFile] = useState(null);
  const [jsonTermsFile, setJsonTermsFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // State to store upload status message

  useEffect(() => {
    // Add the class to the body when the component mounts
    document.body.classList.add('fileupload-page');
    
    // Clean up the class when the component unmounts
    return () => {
      document.body.classList.remove('fileupload-page');
    };
  }, []);

  const upload = () => {
    if (!file || !xacmlFile || !jsonTermsFile) {
      setUploadStatus("All files (data, XACML, and JSON of terms) must be selected to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('xacmlFile', xacmlFile);
    formData.append('jsonTermsFile', jsonTermsFile);

    axios.post('http://localhost:3001/upload', formData)
      .then(res => {
        setUploadStatus("Files uploaded successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Wait 2 seconds before refreshing the page
      })
      .catch(err => {
        console.log(err);
        setUploadStatus("File upload failed. Please try again.");
      });
  };

  const handleFileInputChange = (e, setFileFunc, labelId) => {
    setFileFunc(e.target.files[0]);
    document.getElementById(labelId).innerText = e.target.files[0]?.name || "Upload data file";
  };

  return (
    <div className="fileupload-container">
      <h1 className="fileupload-title">File Upload</h1>
      <div className="fileupload-form">
        <label htmlFor="fileInput" id="fileLabel" className="file-label">Upload data file</label>
        <input type="file" id="fileInput" className="file-input" onChange={(e) => handleFileInputChange(e, setFile, "fileLabel")} />
        
        <label htmlFor="xacmlFileInput" id="xacmlFileLabel" className="file-label">Upload XACML file</label>
        <input type="file" id="xacmlFileInput" className="file-input" onChange={(e) => handleFileInputChange(e, setXacmlFile, "xacmlFileLabel")} />
        
        <label htmlFor="jsonTermsFileInput" id="jsonTermsFileLabel" className="file-label">Upload JSON of terms</label>
        <input type="file" id="jsonTermsFileInput" className="file-input" onChange={(e) => handleFileInputChange(e, setJsonTermsFile, "jsonTermsFileLabel")} />
        
        <button type="button" id="uploadButton" className="upload-button" onClick={upload}>Upload</button>
      </div>
      {uploadStatus && <p className={`upload-status-message ${uploadStatus.includes('failed') ? 'error' : ''}`}>{uploadStatus}</p>}
      <div className="navigation-button-container">
        <Link to="/filelist">
          <button className="Button">View Datasets</button>
        </Link>
      </div>
    </div>
  );
}

export default FileUpload;
