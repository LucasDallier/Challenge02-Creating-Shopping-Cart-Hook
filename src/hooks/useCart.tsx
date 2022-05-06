import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
      const removeProduct = cart.filter((product) => product?.id !== productId);
      setCart(removeProduct);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProduct));
    } catch (err) {
      if (err) {
        toast.error('Erro na remoção do produto');
      }
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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
