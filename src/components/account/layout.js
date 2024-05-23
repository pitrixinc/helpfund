import React, { useCallback } from 'react';;
import Sidebar from '../Sidebar';

export default function Layout({ children }) {
  
  return (
    <React.Fragment>
      <div className="flex h-screen">
        <div className='w-[20%]'>
        <Sidebar />
        </div>
      <main className="flex-1 p-4 overflow-auto"
        sx={{
          variant: 'layout.main',
        }}
      >
        {children}
      </main>
     </div>
    </React.Fragment>
  );
}
