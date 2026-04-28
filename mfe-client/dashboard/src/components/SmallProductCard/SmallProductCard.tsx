import * as Styled from './SmallProductCard.style.tsx';

interface SmallProductCard {
    id?: string;
    title: string;
    price: number;
    image: string;
    onClick?: () => void;
}

const SmallProductCard = ({ title, price, image, onClick }: SmallProductCard) => {
    return (
        <Styled.Container onClick={onClick}>
            <Styled.ImageBox>
                <Styled.Image
                    src={image}
                    alt={title}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/64x64?text=?';
                    }}
                />
            </Styled.ImageBox>
            <Styled.Info>
                <Styled.Title>{title}</Styled.Title>
                <Styled.Price>${price.toLocaleString()}</Styled.Price>
            </Styled.Info>
        </Styled.Container>
    );
};

export default SmallProductCard;
