import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alice_400Regular } from '@expo-google-fonts/alice';
import { ProgressBar, Chip, IconButton } from 'react-native-paper';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

interface Product {
  id: number;
  name: string;
  category: string;
  volume: number;
  remaining: number;
  image: any;
}

const initialProducts: Product[] = [
  { id: 1, name: 'Персик', category: 'Чай', volume: 500, remaining: 0, image: require('../../assets/images/peach-tea.jpg') },
  { id: 2, name: 'Латте', category: 'Кофе', volume: 250, remaining: 0, image: require('../../assets/images/latte.png') },
  { id: 3, name: 'Малина', category: 'Чай', volume: 1000, remaining: 0, image: require('../../assets/images/raspberry-tea.jpg') },
  { id: 4, name: 'Лайм', category: 'Чай', volume: 200, remaining: 0, image: require('../../assets/images/lime-tea.jpg') },
  { id: 5, name: '3в1', category: 'Кофе', volume: 1000, remaining: 0, image: require('../../assets/images/coffee-mix.jpg') },
  { id: 6, name: 'Сахар белый', category: 'Сахар', volume: 1000, remaining: 0, image: require('../../assets/images/sugar-white.jpg') },
  { id: 7, name: 'Сахар тростниковый', category: 'Сахар', volume: 500, remaining: 0, image: require('../../assets/images/sugar-brown.jpg') },
  { id: 8, name: 'Гречка', category: 'Крупы', volume: 900, remaining: 0, image: require('../../assets/images/buckwheat.jpg') },
  { id: 9, name: 'Рис', category: 'Крупы', volume: 1000, remaining: 0, image: require('../../assets/images/rice.jpg') },
  { id: 10, name: 'Мука пшеничная', category: 'Мука', volume: 2000, remaining: 0, image: require('../../assets/images/wheat-flour.jpg') },
  { id: 11, name: 'Мука ржаная', category: 'Мука', volume: 1000, remaining: 0, image: require('../../assets/images/rye-flour.jpg') },
];

const categories = ['Все', 'Кофе', 'Чай', 'Крупы', 'Сахар', 'Мука'];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [refreshing, setRefreshing] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [showTip, setShowTip] = useState(true);

  let [fontsLoaded] = useFonts({
    Alice_400Regular,
  });

  // Загрузка сохраненных продуктов
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const savedProducts = await AsyncStorage.getItem('userProducts');
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          // Объединяем с initialProducts чтобы сохранить все поля
          const mergedProducts = initialProducts.map(product => {
            const savedProduct = parsedProducts.find((p: Product) => p.id === product.id);
            return savedProduct ? { ...product, remaining: savedProduct.remaining } : product;
          });
          setProducts(mergedProducts);
        }
      } catch (error) {
        console.error('Ошибка загрузки продуктов:', error);
      }
    };
    
    loadProducts();
  }, []);

  // Сохранение продуктов при изменении
  useEffect(() => {
    const saveProducts = async () => {
      try {
        await AsyncStorage.setItem('userProducts', JSON.stringify(products));
      } catch (error) {
        console.error('Ошибка сохранения продуктов:', error);
      }
    };
    
    saveProducts();
  }, [products]);

  if (!fontsLoaded) {
    return null; // можно отобразить <Text>Загрузка шрифта...</Text>
  }

  const startShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Обновлено', 'Данные успешно обновлены');
    }, 1500);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

const handleConsume = async (productId: number, amount: number) => {
    setProducts(prevProducts => 
      prevProducts.map(product => {
        if (product.id === productId) {
          const newRemaining = Math.max(0, product.remaining - amount);
          if (newRemaining === 0) {
            startShake();
            Alert.alert(
              'Внимание!',
              `Запас продукта "${product.name}" закончился!`,
              [{ text: 'OK', onPress: () => setShowTip(false) }]
            );
          } else if (newRemaining / product.volume < 0.2) {
            startShake();
          }
          return { ...product, remaining: newRemaining };
        }
        return product;
      })
    );
  };

  const handleAdd = async (productId: number, amount: number) => {
    setProducts(prevProducts =>
      prevProducts.map(product => {
        if (product.id === productId) {
          return {
            ...product, 
            remaining: Math.min(product.volume, product.remaining + amount) 
          };
        }
        return product;
      })
    );
  };


  const handleDelete = (productId: number) => {
    Alert.alert(
      'Удалить продукт',
      'Вы уверены, что хотите удалить этот продукт?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          onPress: () => {
            setProducts(prevProducts => 
              prevProducts.filter(product => product.id !== productId)
            );
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, productId: number) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    
    return (
      <Animated.View style={[styles.deleteContainer, { transform: [{ scale }] }]}>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDelete(productId)}
        >
          <MaterialIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const progress = item.remaining / item.volume;
    const isCritical = progress < 0.2;
    const progressColor = isCritical ? '#ff5252' : progress > 0.5 ? '#4caf50' : '#ff9800';

    return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }], marginBottom: 8 }}>
        <Swipeable
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
          overshootRight={false}
        >
          <View style={[
            styles.productCard,
            isCritical && styles.criticalProduct
          ]}>
            <Image source={item.image} style={styles.productImage} />
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.name}</Text>
                {isCritical && (
                  <MaterialIcons name="warning" size={20} color="#ff5252" />
                )}
              </View>
              <Chip 
                mode="outlined" 
                style={styles.categoryChip}
                textStyle={styles.categoryChipText}
              >
                {item.category}
              </Chip>

              <View style={styles.progressContainer}>
                <Text style={styles.remainingText}>
                  {item.remaining}г / {item.volume}г
                </Text>
                <ProgressBar 
                  progress={progress} 
                  color={progressColor} 
                  style={styles.progressBar} 
                />
                <Text style={styles.percentageText}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.consumeButton]}
                  onPress={() => handleConsume(item.id, 50)}
                >
                  <MaterialIcons name="remove" size={18} color="white" />
                  <Text style={styles.actionButtonText}>50г</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.addButton]}
                  onPress={() => handleAdd(item.id, 50)}
                >
                  <MaterialIcons name="add" size={18} color="white" />
                  <Text style={styles.actionButtonText}>50г</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>МОИ ПРОДУКТЫ</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск продуктов..."
            placeholderTextColor="#8d6e63"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <MaterialIcons name="search" size={24} color="#6d4c41" style={styles.searchIcon} />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {showTip && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💡 Нажмите на карточку, чтобы уменьшить количество. Свайп влево для удаления.
            </Text>
            <IconButton 
              icon="close" 
              size={16} 
              onPress={() => setShowTip(false)} 
            />
          </View>
        )}
        
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={50} color="#bdbdbd" />
              <Text style={styles.emptyText}>Ничего не найдено</Text>
              <Text style={styles.emptySubtext}>Попробуйте изменить параметры поиска</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6d4c41']}
              tintColor="#6d4c41"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
title: {
  fontSize: 36,
  fontFamily: 'Alice_400Regular',
  color: '#3e2723',
  marginBottom: 16,
  textAlign: 'center',
},
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
    color: '#3e2723',
    borderWidth: 1,
    borderColor: '#d7ccc8',
    elevation: 2,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 12,
  },
  categoriesContainer: {
    paddingBottom: 8,
    marginBottom: 12,
  },
  categoryButton: {
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: '#efebe9',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#d7ccc8',
  },
  selectedCategoryButton: {
    backgroundColor: '#6d4c41',
    borderColor: '#6d4c41',
  },
  categoryButtonText: {
    color: '#3e2723',
    fontFamily: 'Alice_400Regular',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryButtonText: {
    color: '#ffffff',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Alice_400Regular',
    color: '#6d4c41',
    fontSize: 14,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8, // Уменьшили с 16 до 8
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    width: '100%',
  },
  criticalProduct: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff5252',
  },
productImage: {
  flex: 1,
  height: 120,
  resizeMode: 'cover',
},
  productInfo: {
    flex: 2,
    padding: 10,
  },
productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // Уменьшили с 8 до 6
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3e2723',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderColor: '#d7ccc8',
  },
  categoryChipText: {
    color: '#6d4c41',
    fontFamily: 'Alice_400Regular',
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 14,
    color: '#8d6e63',
    marginBottom: 2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#efebe9',
  },
  percentageText: {
    fontSize: 12,
    color: '#8d6e63',
    textAlign: 'right',
    marginTop: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    width: '48%',
  },
  consumeButton: {
    backgroundColor: '#F77543',
  },
  addButton: {
    backgroundColor: '#00B70F',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 80,
    paddingRight: 16,
  },
  deleteButton: {
    backgroundColor: '#ff5252',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#8d6e63',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdbdbd',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 12,
  },
});