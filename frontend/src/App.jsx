import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Calculator from './components/Calculator';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
        {/* Toaster for nice notifications */}
        <Toaster position="top-center" reverseOrder={false} />
        <div className="min-h-screen font-sans text-gray-900">
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create" element={<Calculator />} />
                <Route path="/edit/:id" element={<Calculator />} />
            </Routes>
        </div>
    </Router>
  );
}

export default App;