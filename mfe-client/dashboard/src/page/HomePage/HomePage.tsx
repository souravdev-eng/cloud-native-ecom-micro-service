import { Box, Typography } from '@mui/material';

import BannerCard from '../../components/BannerCard/BannerCard';
import ProductList from '../../components/ProductList/ProductList';
import BrandList from '../../components/BrandList/BrandList';
import SmallProductCard from '../../components/SmallProductCard/SmallProductCard';
import SmallProductCardList from '../../components/SmallProductCardList/SmallProductCardList';


const products = [
	{
		id: '11',
		title: 'Brown Women Casual HandBag',
		price: 1100,
		image: 'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag_600x_crop_center.jpg?v=1606122820'
	},

	{
		id: '12',
		title: 'Brown Women Casual HandBag',
		price: 1200,
		image: 'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag_600x_crop_center.jpg?v=1606122820'
	},

	{
		id: '13',
		title: 'Brown Women Casual HandBag',
		price: 1300,
		image: 'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag_600x_crop_center.jpg?v=1606122820'
	},

	{
		id: '14',
		title: 'Brown Women Casual HandBag',
		price: 1400,
		image: 'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag_600x_crop_center.jpg?v=1606122820'
	}
]

const SmallProductCardListData = [{
	title: "FEATURED PRODUCTS",
	data: products,
},
{
	title: "NEW ARRIVALS",
	data: products,
},
{
	title: "BEST SELLER",
	data: products,
},
{
	title: "TOP RATED PRODUCTS",
	data: products,
},
]
const HomePage = () => {
	return (
		<>
			{/* Hero banner with custom aspect ratio */}
			<BannerCard aspectRatio="16/9" />

			{/* Medium banner with custom height */}
			{/* <BannerCard cardSize="medium" height={350} borderRadius={8} /> */}

			{/* Small banner in constrained container with custom dimensions */}
			<Box sx={{ width: '80%', display: 'flex', gap: 2, margin: '20px auto' }}>
				{Array.from({ length: 3 }).map((_, index) => (
					<BannerCard
						key={index}
						cardSize="small"
						width="100%"
						height={200}
						aspectRatio="3/2"
						objectFit="contain"
					/>
				))}
			</Box>

			{/* Custom sized banner with min/max height constraints */}

			<ProductList title="FEATURED PRODUCTS" />
			<ProductList title="NEW ARRIVALS" isTint={false} />
			<BrandList />
			<BannerCard
				width="80%"
				minHeight={250}
				maxHeight={450}
				aspectRatio="21/9"
				borderRadius={20}
				style={{ margin: '20px auto' }}
			/>
			<Box sx={{ display: 'flex', gap: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>

				{
					SmallProductCardListData.map((data) => (
						<SmallProductCardList
							key={data.title}
							title={data.title}
							products={
								data.data.map((product) => (
									{
										id: product.id,
										title: product.title,
										price: product.price,
										image: product.image,
									}
								))
							}
						/>
					))
				}

			</Box>
		</>
	);
};

export default HomePage;
