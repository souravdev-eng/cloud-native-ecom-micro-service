import ProductList from '../../components/ProductList/ProductList';

const HomePage = () => {
	return (
		<>
			<ProductList title="FEATURED PRODUCTS" />
			<ProductList title="NEW ARRIVALS" isTint={false} />
		</>
	);
};

export default HomePage;
