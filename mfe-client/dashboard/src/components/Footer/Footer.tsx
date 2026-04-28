import { useNavigate } from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import InstagramIcon from '@mui/icons-material/Instagram';
import GitHubIcon from '@mui/icons-material/GitHub';
import LocationOnIcon from '@mui/icons-material/LocationOnRounded';
import EmailIcon from '@mui/icons-material/EmailRounded';
import PhoneIcon from '@mui/icons-material/PhoneRounded';
import LocalShippingIcon from '@mui/icons-material/LocalShippingRounded';

import * as Styled from './Footer.styles';

const SHOP_LINKS = [
    { label: 'All Products', to: '/products' },
    { label: 'Phones', to: '/products?category=phone' },
    { label: 'Earphones', to: '/products?category=earphone' },
    { label: 'Books', to: '/products?category=book' },
    { label: 'Fashion', to: '/products?category=fashions' },
];

const SUPPORT_LINKS = [
    { label: 'FAQ', to: '/faq' },
    { label: 'Shipping & Returns', to: '/shipping' },
    { label: 'Order Tracking', to: '/track' },
    { label: 'Size Guide', to: '/size-guide' },
    { label: 'Contact Us', to: '/contact' },
];

const Footer = () => {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    return (
        <Styled.FooterWrapper>
            {/* Free shipping top bar */}
            <Styled.TopBar>
                <Styled.TopBarText>
                    <LocalShippingIcon sx={{ fontSize: 18, color: '#74c0fc' }} />
                    Free standard shipping on orders over $99
                </Styled.TopBarText>
                <Styled.TopBarCta onClick={() => navigate('/products')}>
                    Shop Now
                </Styled.TopBarCta>
            </Styled.TopBar>

            {/* Main grid */}
            <Styled.MainGrid>
                {/* Brand column */}
                <Styled.BrandCol>
                    <Styled.BrandName>
                        E<span>com</span>
                    </Styled.BrandName>
                    <Styled.BrandTagline>
                        Your one-stop shop for phones, fashion, books, and more.
                        Quality products, fast delivery, hassle-free returns.
                    </Styled.BrandTagline>
                    <Styled.SocialRow>
                        <Styled.SocialBtn href="#" aria-label="Facebook">
                            <FacebookIcon sx={{ fontSize: 16 }} />
                        </Styled.SocialBtn>
                        <Styled.SocialBtn href="#" aria-label="Instagram">
                            <InstagramIcon sx={{ fontSize: 16 }} />
                        </Styled.SocialBtn>
                        <Styled.SocialBtn href="#" aria-label="X / Twitter">
                            <XIcon sx={{ fontSize: 16 }} />
                        </Styled.SocialBtn>
                        <Styled.SocialBtn href="#" aria-label="GitHub">
                            <GitHubIcon sx={{ fontSize: 16 }} />
                        </Styled.SocialBtn>
                    </Styled.SocialRow>
                </Styled.BrandCol>

                {/* Shop column */}
                <div>
                    <Styled.ColTitle>Shop</Styled.ColTitle>
                    <Styled.ColList>
                        {SHOP_LINKS.map((link) => (
                            <Styled.ColLink key={link.label} to={link.to}>
                                {link.label}
                            </Styled.ColLink>
                        ))}
                    </Styled.ColList>
                </div>

                {/* Support column */}
                <div>
                    <Styled.ColTitle>Support</Styled.ColTitle>
                    <Styled.ColList>
                        {SUPPORT_LINKS.map((link) => (
                            <Styled.ColLink key={link.label} to={link.to}>
                                {link.label}
                            </Styled.ColLink>
                        ))}
                    </Styled.ColList>
                </div>

                {/* Contact column */}
                <div>
                    <Styled.ColTitle>Contact</Styled.ColTitle>
                    <Styled.ColList>
                        <Styled.ColText>
                            <LocationOnIcon sx={{ fontSize: 15, mt: '2px', flexShrink: 0, color: '#495057' }} />
                            123 Commerce Street, Bengaluru, India 560001
                        </Styled.ColText>
                        <Styled.ColText>
                            <EmailIcon sx={{ fontSize: 15, mt: '2px', flexShrink: 0, color: '#495057' }} />
                            support@ecom.dev
                        </Styled.ColText>
                        <Styled.ColText>
                            <PhoneIcon sx={{ fontSize: 15, mt: '2px', flexShrink: 0, color: '#495057' }} />
                            +91 98765 43210
                        </Styled.ColText>
                    </Styled.ColList>
                </div>
            </Styled.MainGrid>

            <Styled.Divider />

            {/* Bottom bar */}
            <Styled.BottomBar>
                <Styled.Copyright>
                    © {year} Ecom. All rights reserved.
                </Styled.Copyright>
                <Styled.PaymentIcons>
                    {['VISA', 'MC', 'AMEX', 'UPI', 'COD'].map((p) => (
                        <Styled.PaymentBadge key={p}>{p}</Styled.PaymentBadge>
                    ))}
                </Styled.PaymentIcons>
            </Styled.BottomBar>
        </Styled.FooterWrapper>
    );
};

export default Footer;
