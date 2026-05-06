import { useNavigate } from 'react-router-dom';

import * as Styled from './ProductList.style';
import ProductCard from '../ProductCard/ProductCard';
import { IProductCard } from '../ProductCard/ProductCard';

interface IProps {
    title: string;
    eyebrow?: string;
    isTint?: boolean;
    products: IProductCard[];
    onViewAll?: () => void;
}

const ProductList = ({ title, eyebrow, products, isTint = true, onViewAll }: IProps) => {
    const navigate = useNavigate();

    const handleViewAll = onViewAll ?? (() => navigate('/products'));

    return (
        <Styled.Section isTint={isTint}>
            <Styled.Inner>
                <Styled.SectionHeader>
                    <Styled.TitleGroup>
                        {eyebrow && <Styled.SectionEyebrow>{eyebrow}</Styled.SectionEyebrow>}
                        <Styled.SectionTitle>{title}</Styled.SectionTitle>
                    </Styled.TitleGroup>
                    <Styled.ViewAllLink onClick={handleViewAll}>View All →</Styled.ViewAllLink>
                </Styled.SectionHeader>

                <Styled.ProductGrid>
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            price={product.price}
                            image={product.image}
                            tags={product.tags}
                            rating={product.rating}
                            onClick={() => navigate(`/product/${product.id}`)}
                        />
                    ))}
                </Styled.ProductGrid>
            </Styled.Inner>
        </Styled.Section>
    );
};

export default ProductList;
