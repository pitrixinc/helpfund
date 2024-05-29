import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, onFilterChange, onSortChange }) {
  return (
    <React.Fragment className="flex h-screen">
      <div className='w-[20%]'>
        <Sidebar onFilterChange={onFilterChange} onSortChange={onSortChange} />
      </div>
      <main className="flex-1 md:p-4 lg:p-4 overflow-auto"
        sx={{
          variant: 'layout.main',
        }}>
        {children}
      </main>
    </React.Fragment>
  );
}
