'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const ROUTE = [
    {
        title: 'Dashboard',
        route: '/',
        icon: '/icons/home.svg',
    },
    {
        title: 'Product',
        route: '/product',
        icon: '/icons/product.svg',
    },
    {
        title: 'Analytics',
        route: '/analytics',
        icon: '/icons/stats.svg',
    },
    {
        title: 'Payments',
        route: '/payments',
        icon: '/icons/wallet.svg',
    },
    {
        title: 'Setting',
        route: '/setting',
        icon: '/icons/setting.svg',
    },
    {
        title: 'User',
        route: '/user',
        icon: '/icons/user.svg',
    },
    {
        title: 'Logout',
        route: '/sign-in',
        icon: '/icons/logout.svg',
    },
];

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <div className='w-[240px] h-[100vh] border-r-2 border-black-500 text-black'>
            <div className='mb-6 flex justify-center items-center mt-2'>
                <Image
                    src={'/icons/logo.svg'}
                    alt='Logo'
                    width={150}
                    height={150}
                />
            </div>
            <div className='flex flex-col gap-4 justify-center items-center'>
                {ROUTE.map((link) => {
                    const isActive =
                        pathname ===
                        (link.route || pathname.startsWith(link.route));
                    return (
                        <Link
                            href={link.route}
                            key={link.title}
                            className={`w-[180px] h-10 rounded flex justify-around cursor-pointer ${
                                isActive ? 'bg-blue-700' : 'bg-white'
                            }`}>
                            <Image
                                width={20}
                                height={20}
                                src={link.icon}
                                alt='home'
                                className='w-5 mr-4 ml-2'
                            />
                            <div className='flex items-center w-full'>
                                <h2
                                    className={`${
                                        isActive
                                            ? 'text-white'
                                            : 'text-gray-400'
                                    } font-medium text-left`}>
                                    {link.title}
                                </h2>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Sidebar;
