interface FeatureProductCardProps {
  title: string;
  image: string;
  price: number;
  tags?: string;
  rating?: number;
  onClick: () => void;
  handleAddToCart: (e: React.MouseEvent<HTMLDivElement>) => void;
}
