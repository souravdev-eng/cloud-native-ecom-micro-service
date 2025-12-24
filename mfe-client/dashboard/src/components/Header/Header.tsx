import React, { useMemo } from 'react';
import XIcon from '@mui/icons-material/X';
import { useNavigate } from 'react-router-dom';
import { Divider, Typography } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { useAuth } from '../../hooks/useAuth';
import * as Styled from './Header.styles';

interface MenuItemType {
	id: number;
	title: string;
	path?: string;
	action?: 'logout';
	requiresAuth?: boolean;
	hideWhenAuth?: boolean;
}

const MenuItems: MenuItemType[] = [
	{
		id: 1,
		title: 'My Account',
		path: '/user/my-account',
		requiresAuth: true,
	},
	{
		id: 2,
		title: 'About Us',
		path: '/about-us',
	},
	{
		id: 3,
		title: 'Blog',
		path: '/blog',
	},
	{
		id: 4,
		title: 'My Wishlist',
		path: '/user/my-wishlist',
		requiresAuth: true,
	},
	{
		id: 5,
		title: 'Cart',
		path: '/user/cart',
		requiresAuth: true,
	},
	{
		id: 6,
		title: 'Log in',
		path: '/user/auth/signin',
		hideWhenAuth: true,
	},
	{
		id: 7,
		title: 'Log out',
		action: 'logout',
		requiresAuth: true,
	},
];

const Header = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated, logout } = useAuth();
	const navigate = useNavigate();

	const filteredMenuItems = useMemo(() => {
		return MenuItems.filter((item) => {
			if (item.requiresAuth && !isAuthenticated) return false;
			if (item.hideWhenAuth && isAuthenticated) return false;
			return true;
		});
	}, [isAuthenticated]);

	const handleMenuClick = async (item: MenuItemType) => {
		if (item.action === 'logout') {
			await logout();
			navigate('/user/auth/signin');
		}
	};

	return (
		<Styled.Container>
			<Styled.CouponContainer>
				<Typography color="#fff">
					Get Up to <span style={{ fontWeight: 600 }}> 40% OFF </span>New-Season
					Styles
				</Typography>
				<div style={{ display: 'flex', gap: 10 }}>
					<div
						style={{
							backgroundColor: '#0075AF',
							fontSize: 10,
							padding: 10,
							color: '#fff',
							fontWeight: 'bold',
							cursor: 'pointer',
						}}
					>
						MEN
					</div>
					<div
						style={{
							backgroundColor: '#0075AF',
							fontSize: 10,
							padding: 10,
							color: '#fff',
							fontWeight: 'bold',
							cursor: 'pointer',
						}}
					>
						WOMEN
					</div>
				</div>
				<span style={{ color: '#8BC2E5', fontSize: 13 }}>
					* Limited time only.
				</span>
			</Styled.CouponContainer>
			<Styled.SubHeaderContainer>
				<Styled.SubHeaderTitle>
					FREE RETURNS. STANDARD SHIPPING ORDERS $99+
				</Styled.SubHeaderTitle>
				<div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
					<div style={{ display: 'flex', listStyle: 'none', gap: 20 }}>
						{filteredMenuItems.map((el) => (
							<li key={el.id}>
								{el.path ? (
									<Styled.MenuItemLink to={el.path}>
										{el.title}
									</Styled.MenuItemLink>
								) : (
									<Styled.MenuItemButton onClick={() => handleMenuClick(el)}>
										{el.title}
									</Styled.MenuItemButton>
								)}
							</li>
						))}
					</div>
					<div>
						<span style={{ fontSize: 12, fontWeight: 'bold', color: '#868e96' }}>
							INR
						</span>
						<KeyboardArrowDownIcon
							sx={{ color: '#868e96', fontSize: 14, fontWeight: 'bold' }}
						/>
					</div>
					<FacebookIcon sx={{ color: '#868e96', fontSize: 16 }} />
					<XIcon sx={{ color: '#868e96', fontSize: 16 }} />
					<InstagramIcon sx={{ color: '#868e96', fontSize: 16 }} />
				</div>
			</Styled.SubHeaderContainer>
			<Divider />
			{children}
		</Styled.Container>
	);
};

export default Header;
