import Carousel from 'react-material-ui-carousel';
import SellImage1 from '../../assets/Sell1.png';
import SellImage2 from '../../assets/Sell2.png';

const items = [
  {
    image: SellImage1,
  },
  {
    image: SellImage2,
  },
];

const HeroImageSlider = () => {
  return (
    <Carousel
      autoPlay
      stopAutoPlayOnHover
      swipe={false}
      duration={750}
      sx={{ marginTop: 4, cursor: 'pointer' }}>
      {items.map((item, index) => (
        <img
          key={index}
          src={item.image}
          style={{ height: 'auto', maxHeight: 550, width: '100%', objectFit: 'cover' }}
          alt={`Slide ${index}`}
        />
      ))}
    </Carousel>
  );
};

export default HeroImageSlider;
