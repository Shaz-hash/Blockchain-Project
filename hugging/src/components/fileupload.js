import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Link } from 'react-router-dom';
import './fileupload.css';

function FileUpload() {
  const [file, setFile] = useState(null);
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
    if (!file) {
      setUploadStatus("No file selected. Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    axios.post('http://localhost:3001/upload', formData)
      .then(res => {
        setUploadStatus("File uploaded successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Wait 2 seconds before refreshing the page
      })
      .catch(err => {
        console.log(err);
        setUploadStatus("File upload failed. Please try again.");
      });
  };

  return (
    <div className="fileupload-container">
      <h1 className="fileupload-title">File Upload</h1>
      <div className="fileupload-form">
        <input type="file" id="fileInput" className="file-input" onChange={(e) => setFile(e.target.files[0])} />
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
