import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import './PoliceLayout.css';

const PoliceLayout = () => {
    return (
        <div className="police-dashboard-container">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};
export default PoliceLayout;