import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landingpage';
import Login from './components/login';
import Signup from './components/signup';
import UserPage from './components/userpage';
import FileUpload from './components/fileupload';
import FileList from './components/filelist';
import { UsernameProvider } from './userdata/usernamecontext'; // Import UsernameProvider
import SmartContract from './components/smartcontract';
import PreSignup from './components/presignup';
import WorkflowPage from './components/workflowpage'; // Import WorkflowPage
import DataSetPage from './components/datasetpage'; // Import DataSetPage

function App() {
  return (
    <UsernameProvider> {/* Wrap the application with UsernameProvider */}
      <Router>
        <div className="App">
          <Routes> {/* Use Routes instead of Router */}
            <Route exact path="/" element={<LandingPage />} /> {/* Move Route inside Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/userpage" element={<UserPage />} />
            <Route path="/fileupload" element={<FileUpload />} />
            <Route path="/filelist" element={<FileList />} />
            <Route path="/smartcontract" element={<SmartContract />} />
            <Route path="/presignup" element={<PreSignup />} />
            <Route path="/workflow" element={<WorkflowPage />} /> {/* Add WorkflowPage route */}
            <Route path="/dataset" element={<DataSetPage />} /> {/* Add DataSetPage route */}
          </Routes>
        </div>
      </Router>
    </UsernameProvider>
  );
}

export default App;