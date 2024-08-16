import Header from '@/components/Header/Header';
import Sidebar from '@/components/Sidebar/Sidebar';
import React from 'react';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <main>
            <div className='flex'>
                <div>
                    <Sidebar />
                </div>
                <div className='flex flex-col w-[100%]'>
                    <Header />
                    <div className='w-full h-full bg-gray-50'>{children}</div>
                </div>
            </div>
        </main>
    );
};

export default RootLayout;
