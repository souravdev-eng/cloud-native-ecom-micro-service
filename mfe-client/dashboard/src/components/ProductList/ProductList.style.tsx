import { styled } from '@mui/material';

export const Container = styled('div')(({ isTint }: { isTint?: boolean }) => ({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	width: '100%',
	backgroundColor: isTint ? '#FBFBFB' : '#ffff',
	margin: '50px 0px',
	padding: '20px 0px',
}));

export const ProductContainerWrapper = styled('div')({
	display: 'flex',
	gap: 20,
	flexWrap: 'wrap',
	justifyContent: 'center',
	alignItems: 'center',
	marginTop: 8,
});
