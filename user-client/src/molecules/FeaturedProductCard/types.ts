export interface FeatureProductCardProps {
    id?: string;
    title: string;
    image: string;
    price: number;
    tags?: string | string[];
    rating?: number;
    onClick: () => void;
    handleAddToCart: (e: React.MouseEvent<HTMLDivElement>) => void;
}
