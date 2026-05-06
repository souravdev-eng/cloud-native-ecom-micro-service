import request from 'supertest';
import app from '../../app';

let userToken: any;
let userPayload: any;
let productData: any;

beforeEach(() => {
  const { token, payload } = global.sellerSignIn();
  userToken = token;
  userPayload = payload;

  productData = {
    title: 'How to Win Friends & Influence People',
    description:
      'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
    price: 150,
    image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
    category: 'book',
    sellerId: userPayload.id,
  };
});

describe('New Product', () => {
  it('should return 201 if seller create a product with required properties', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send(productData)
      .expect(201);
  });

  it('should published an product created event after creating new product', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send(productData)
      .expect(201);
  });

  it('should return 400 if product price below 100 or grater than 1_000_000', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send({
        title: 'How to Win Friends & Influence People',
        description:
          'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
        price: 99,
        image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
        category: 'book',
        sellerId: userPayload.id,
      })
      .expect(400);

    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send({
        title: 'How to Win Friends & Influence People',
        description:
          'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
        price: 1000001,
        image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
        category: 'book',
        sellerId: userPayload.id,
      })
      .expect(400);
  });

  it('should return 400 if seller not provide product title', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send({
        description:
          'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
        price: 150,
        image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
        category: 'book',
        sellerId: userPayload.id,
      })
      .expect(400);
  });

  it('should return 400 if seller not provide product description', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send({
        title: 'How to Win Friends & Influence People',
        price: 150,
        image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
        category: 'book',
        sellerId: userPayload.id,
      })
      .expect(400);
  });

  it('should return 400 if seller not provide product image', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send({
        title: 'How to Win Friends & Influence People',
        description:
          'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
        price: 150,
        category: 'book',
        sellerId: userPayload.id,
      })
      .expect(400);
  });

  it('should return 400 if seller not provide product category', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', userToken)
      .send({
        title: 'How to Win Friends & Influence People',
        description:
          'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
        price: 150,
        image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
        sellerId: userPayload.id,
      })
      .expect(400);
  });

  it('should return 403 if seller not logged in before create new product', async () => {
    await request(app)
      .post('/api/product/new')
      .send({
        title: 'How to Win Friends & Influence People',
        description:
          'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
        price: 150,
        image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
        category: 'book',
      })
      .expect(403);
  });

  it('should return 403 if normal user try to add new product', async () => {
    await request(app)
      .post('/api/product/new')
      .set('Cookie', global.signIn())
      .send({
        title: 'How to Win Friends & Influence People',
        description:
          'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
        price: 150,
        image: 'https://images-na.ssl-images-amazon.com/images/I/51PWIy1rHUL._AA300_.jpg',
        category: 'book',
        sellerId: '639b2164b5e8f3a21129d417',
      })
      .expect(403);
  });
});
