import Carousel from 'react-material-ui-carousel';

const items = [
    {
        image: "https://img.freepik.com/free-vector/sales-banner-origami-style_23-2148399967.jpg?w=2000&t=st=1712726789~exp=1712727389~hmac=e7ada51e6099b286535eaab074765a864b2974e735fd6f7a13367711a1c5d0e7",
    },
    {
        image: "https://img.freepik.com/free-vector/black-friday-sale-modern-banner-with-text-soace_1017-34852.jpg?w=2000&t=st=1712727137~exp=1712727737~hmac=33e5ddbf9c44589258d7f512b756070fac8f293811431cc2d2c34ca08f355160",
    }
];

function HeroImageSlider() {
    return (
        <Carousel
            autoPlay
            stopAutoPlayOnHover
            swipe={false}
            duration={750}
            sx={{ marginTop: 4, cursor: 'pointer' }}
        >
            {items.map((item, i) => (
                <img
                    key={i}
                    src={item.image}
                    style={{ height: 'auto', maxHeight: 550, width: '100%', objectFit: 'cover' }}
                    alt={`Slide ${i}`}
                />
            ))}
        </Carousel>
    );
}

export default HeroImageSlider;
