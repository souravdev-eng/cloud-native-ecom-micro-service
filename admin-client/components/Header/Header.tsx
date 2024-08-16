import Image from 'next/image';
import React from 'react';

const formatDate = (date: any) => {
    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    } as any;
    return new Intl.DateTimeFormat('en-GB', options).format(date);
};

const Header = () => {
    return (
        <div className='w-[100%] h-[60px] bg-white-200 divide-y-1 flex justify-between items-center p-10'>
            <div>
                <h2 className='text-lg font-semibold text-black'>
                    Welcome, James
                </h2>
                <span className='text-xs font-light text-gray-500'>
                    {formatDate(new Date())}
                </span>
            </div>
            <div className='flex justify-between items-center gap-5'>
                <div className='flex justify-between items-center gap-8 mr-6'>
                    <Image
                        src={'/icons/message.svg'}
                        alt={'Message'}
                        width={24}
                        height={24}
                        className='cursor-pointer'
                    />
                    <Image
                        src={'/icons/bell.svg'}
                        alt={'Message'}
                        width={24}
                        height={24}
                        className='cursor-pointer'
                    />
                </div>
                <div>
                    <input
                        type='text'
                        placeholder='Search'
                        className='w-[300px] h-[45px] border border-gray-100 rounded-md p-2 outline-none'
                    />
                </div>
            </div>
        </div>
    );
};

export default Header;
