import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './datasetpage.css';

const DataSetPage = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileDetails, setFileDetails] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState("");
  const [terms, setTerms] = useState([]);
  const [termResponses, setTermResponses] = useState([]);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
    const policyDetails = await getPolicyDetails(fileName);
    const termsArray = Object.entries(policyDetails.terms).map(([key, value]) => ({ term: key, description: value }));
    setTerms(termsArray);
    setTermResponses(new Array(termsArray.length).fill(null));
    setShowTermsModal(true);
  };

  const getPolicyDetails = async (fileName) => {
    try {
      const response = await axios.get(`http://localhost:3001/getPolicy/${fileName}`);
      if (response.status !== 200) {
        throw new Error('Policy not found');
      }
      const { newContractAddress, abi, argv, permissionFunction, terms } = response.data;
      return response.data;
    } catch (error) {
      console.error("Error fetching policy:", error);
      throw error;
    }
  };

  const handleTermResponse = (index, response) => {
    const updatedResponses = [...termResponses];
    updatedResponses[index] = response;
    setTermResponses(updatedResponses);
  };

  const handleTermsSubmit = () => {
    if (termResponses.includes("no")) {
      setError("You must agree to all terms to access the dataset details.");
      setShowTermsModal(false);
    } else if (termResponses.includes(null)) {
      setError("Please respond to all terms.");
    } else {
      setError(null);
      setShowTermsModal(false);
      fetchFileDetails();
    }
  };

  const fetchFileDetails = async () => {
    try {
      const policyDetails = await getPolicyDetails(selectedFile);
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
      {fileDetails && !showTermsModal && !error && (
        <div className="file-details">
          <h3>File Details</h3>
          <p><strong>Smart Contract Address:</strong> {fileDetails.newContractAddress}</p>
          <p><strong>Permission Function:</strong> {fileDetails.permissionFunction}</p>
          <p><strong>Arguments Needed for the permission function:</strong> {fileDetails.argv}</p>
        </div>
      )}
      {notification && <p className="notification-message">{notification}</p>}
      {error && <p className="notification-message error-message">{error}</p>}
      {showTermsModal && (
        <div className="terms-modal">
          <div className="terms-modal-content">
            <h2>Terms and Conditions</h2>
            <p className="terms-intro">
              HUGGING FACE-MEDICARE DATA USE AGREEMENT
              <br />
              Information pertaining to an individual’s health status and medical treatment is sensitive. Therefore, specific laws, including the Privacy Act of 1974 and the Health Insurance Portability and Accountability Act of 1996, have been enacted to ensure the confidentiality of health information. In utilizing health data for research purposes, it is absolutely necessary to ensure, to the extent possible, that uses of such data will be limited to research. Uses for any other reason, particularly those resulting in personal disclosures, will be prosecuted to the full extent of the law. In addition, release of information about providers, i.e., the physicians and hospitals that provide care for cancer patients, may compromise the willingness of these providers to cooperate with the activities of the cancer registries. Therefore, considerations regarding the privacy of providers are also of great importance.
              <br />
              In order for the National Cancer Institute to provide the linked SEER-Surveillance, Epidemiology and End Results (SEER)-Medicare data to you, it is necessary that you agree to the following provisions:
            </p>
            {terms.map((term, index) => (
              <div key={index} className="term">
                <p>{term.description}</p>
                <button
                  className={`button-yes ${termResponses[index] === "yes" ? 'selected' : ''}`}
                  onClick={() => handleTermResponse(index, "yes")}
                >
                  Yes
                </button>
                <button
                  className={`button-no ${termResponses[index] === "no" ? 'selected' : ''}`}
                  onClick={() => handleTermResponse(index, "no")}
                >
                  No
                </button>
              </div>
            ))}
            <button
              onClick={handleTermsSubmit}
              disabled={termResponses.includes(null)}
            >
              Submit Responses
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataSetPage;
