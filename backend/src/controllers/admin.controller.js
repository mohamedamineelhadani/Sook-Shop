import { Cart } from '../models/Cart.js';
import { User } from '../models/User.js';

export async function getCartInsights(req, res) {
  const [cartCount, carts, users] = await Promise.all([
    Cart.countDocuments({}),
    Cart.find({})
      .populate({ path: 'user', select: 'name email' })
      .populate({ path: 'items.product', select: 'name slug price images stock' })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
    User.find({})
      .select('name email role wishlist createdAt')
      .populate({ path: 'wishlist', select: 'name slug price images stock' })
      .lean(),
  ]);

  const customers = users.filter((user) => user.role === 'customer');
  const cartItems = carts.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
  const wishlistEntries = users.reduce((sum, user) => sum + (user.wishlist?.length || 0), 0);
  const savedProducts = new Set();
  users.forEach((user) =>
    (user.wishlist || []).forEach((product) => product && savedProducts.add(product._id.toString())),
  );

  const popularity = new Map();
  const track = (product, field) => {
    if (!product) return;
    const id = product._id.toString();
    if (!popularity.has(id)) {
      popularity.set(id, {
        id,
        name: product.name,
        image: product.images?.[0] || '',
        price: product.price,
        inCarts: 0,
        inWishlists: 0,
      });
    }
    popularity.get(id)[field] += 1;
  };

  const cartList = carts.map((cart) => ({
    id: cart._id,
    user: cart.user
      ? { id: cart.user._id, name: cart.user.name, email: cart.user.email }
      : null,
    items: (cart.items || [])
      .filter((item) => item.product)
      .map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0] || '',
        price: item.product.price,
        quantity: item.quantity,
      })),
    updatedAt: cart.updatedAt,
  }));

  cartList.forEach((cart) =>
    carts
      .find((entry) => entry._id.toString() === cart.id.toString())
      ?.items?.forEach((item) => track(item.product, 'inCarts')),
  );

  const wishlistList = customers
    .filter((user) => user.wishlist?.length)
    .map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      products: user.wishlist.filter(Boolean).map((product) => {
        track(product, 'inWishlists');
        return {
          id: product._id,
          name: product.name,
          image: product.images?.[0] || '',
          price: product.price,
        };
      }),
    }));

  const popular = [...popularity.values()]
    .sort((a, b) => b.inCarts + b.inWishlists - (a.inCarts + a.inWishlists))
    .slice(0, 8);

  res.json({
    success: true,
    data: {
      stats: {
        carts: cartCount,
        cartItems,
        customers: customers.length,
        wishlistEntries,
        savedProducts: savedProducts.size,
      },
      carts: cartList,
      wishlists: wishlistList,
      popular,
    },
  });
}
