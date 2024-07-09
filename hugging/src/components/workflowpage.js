import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './workflowpage.css';

const WorkflowPage = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [workflowDetails, setWorkflowDetails] = useState([]);
  const [fileDetails, setFileDetails] = useState([]);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState(null);

  const workflows = [
    "Workflow 1 : dataset1,dataset2,dataset3",
    "Workflow 2 : dataset1,dataset2",
    "Workflow 3 : dataset1,dataset3"
  ];

  const userDetails = {
    doctorId: "12345",
    hospitalId: "67890",
    specialization: "Cardiology",
    accessRights: "Full",
    location: "New York"
  };

  useEffect(() => {
    document.body.classList.add('workflow-page');
    return () => {
      document.body.classList.remove('workflow-page');
    };
  }, []);

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

  const fileDetailsHandler = (fileName) => {
    // Hardcoded values for demonstration
    const details = {
      address: "4r42f3rgtg543432de2f3rr",
      permissionFunction: "Cardiology()",
      arguments: ["doctorName", "DoctorID", "Specialization"]
    };
    setFileDetails(prevDetails => [...prevDetails, { fileName, details }]);
  };

  const getSignedDetails = async (argv) => {
    // Mocked signed details
    return ["signedDoctorName", "signedDoctorID", "signedSpecialization", "signature"];
  };

  const callSmartContractWithTxn = async (contractAddress, contractABI, functionName, args) => {
    // Mocking contract call result
    return { success: true, decision: true };
  };

  const buttonHandler = async (datasetArray) => {
    try {
      setFileDetails([]); // Clear previous details

      for (const fileName of datasetArray) {
        fileDetailsHandler(fileName);
        const signedDetails = await getSignedDetails(["doctorName", "DoctorID", "Specialization"]);

        const contractResult = await callSmartContractWithTxn(
          "4r42f3rgtg543432de2f3rr",
          [],
          "Cardiology()",
          signedDetails
        );

        if (contractResult.decision) {
          setNotification(`Smart Contract's Access Policy's Result for ${fileName} is Permit`);
        } else {
          setNotification(`Smart Contract's Access Policy's Result for ${fileName} is Denied`);
          break;
        }
      }

      setNotification("Workflow satisfied");
    } catch (error) {
      setError("Error processing workflow");
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
        <p><strong>Access Rights:</strong> {userDetails.accessRights}</p>
        <p><strong>Location:</strong> {userDetails.location}</p>
      </div>
      <div className="workflow-select-container">
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
          <p><strong>Arguments:</strong> {file.details.arguments.join(", ")}</p>
        </div>
      ))}
      {notification && <p className="notification-message">{notification}</p>}
      {error && <p className="notification-message error-message">{error}</p>}
    </div>
  );
}

export default WorkflowPage;