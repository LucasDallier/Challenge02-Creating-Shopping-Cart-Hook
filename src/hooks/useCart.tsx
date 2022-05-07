import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}
interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockProperty = await api.get(`/stock/${productId}`);

      const productExistInCart = cart.find((product) => product?.id === productId);

      const existAmountStock = cart.find((product) => product?.id === productId);

      if (productExistInCart && existAmountStock) {
        if (!!productExistInCart && existAmountStock.amount < stockProperty.data.amount) {
          const updateProductQuantity = cart.map((product) => {
            if (product.id === productId) {
              return {
                ...product,
                amount: product.amount + 1
              };
            } else {
              return product
            }
          });
          setCart(updateProductQuantity);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProductQuantity));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const productProperty = await api.get(`/products/${productId}`);

        const newProduct = {
          ...productProperty.data,
          amount: 1
        };
        const updatedCart = [
          ...cart,
          newProduct,
        ];

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }
    } catch (err) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error();
      }
    } catch (err) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];

      const productExists = updatedCart.find((product) => product.id === productId);

      if (productExists) {
        productExists.amount = amount
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
