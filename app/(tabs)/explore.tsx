import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';

const initialProducts = [
  { id: 1, name: 'Персик', category: 'Чай', volume: 500, remaining: 300 },
  { id: 2, name: 'Латте', category: 'Кофе', volume: 250, remaining: 50 },
  { id: 3, name: 'Малина', category: 'Чай', volume: 1000, remaining: 800 },
  { id: 4, name: 'Лайм', category: 'Чай', volume: 200, remaining: 200 },
  { id: 5, name: '3в1', category: 'Кофе', volume: 1000, remaining: 700 },
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(initialProducts);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleConsume = (productId, amount) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          const newRemaining = Math.max(0, product.remaining - amount);
          if (newRemaining === 0) {
            Alert.alert('Внимание!', `Запас продукта "${product.name}" закончился!`);
          }
          return { ...product, remaining: newRemaining };
        }
        return product;
      })
    );
  };

  const handleAdd = (productId, amount) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          const newRemaining = Math.min(product.volume, product.remaining + amount); // Не даем превышать объем
          return { ...product, remaining: newRemaining };
        }
        return product;
      })
    );
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }) => {
    const progress = item.remaining / item.volume;
    return (
      <TouchableOpacity style={styles.productCard} onPress={() => handleConsume(item.id, 50)}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>Категория: {item.category}</Text>
        <Text style={styles.productVolume}>Объем: {item.volume} г</Text>
        <Text style={styles.productRemaining}>Остаток: {item.remaining} г</Text>
        <ProgressBar progress={progress} color={progress > 0.3 ? '#4caf50' : '#ff7043'} style={styles.progressBar} />
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.consumeButton} onPress={() => handleConsume(item.id, 50)}>
            <Text style={styles.consumeButtonText}>- 50 г</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(item.id, 50)}>
            <Text style={styles.addButtonText}>+ 50 г</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Обзор продуктов</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Поиск продуктов..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет продуктов для отображения.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3efe7',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    height: 40,
    borderColor: '#6d4c41',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6d4c41',
  },
  productCategory: {
    fontSize: 14,
    color: '#8d6e63',
  },
  productVolume: {
    fontSize: 14,
    color: '#8d6e63',
  },
  productRemaining: {
    fontSize: 14,
    color: '#8d6e63',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consumeButton: {
    backgroundColor: '#ff7043',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  consumeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8d6e63',
    marginTop: 20,
  },
});
