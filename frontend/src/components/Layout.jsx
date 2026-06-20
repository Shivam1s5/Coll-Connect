import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="app-container">
      <div className="app-navbar">
        <h1>Coll-Connect</h1>
      </div>
      
      <div className="content-area">
        <div className="ad-sidebar">
          AD SPACE (SIDEBAR-LEFT)
        </div>
        
        <div className="main-center">
          <Outlet />
        </div>

        <div className="ad-sidebar">
          AD SPACE (SIDEBAR-RIGHT)
        </div>
      </div>

      <div className="ad-footer">
        AD SPACE (FOOTER)
      </div>
    </div>
  );
};

export default Layout;
