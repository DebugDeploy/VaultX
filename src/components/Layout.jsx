import React, { useState } from 'react';
import Navbar from './Navbar';
import AddAssetModal from './AddAssetModal';

const Layout = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app-container">
      <Navbar onAddClick={() => setIsModalOpen(true)} />
      <main className="main-content">
        {children}
      </main>
      {isModalOpen && (
        <AddAssetModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default Layout;
