import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Флаг для редактирования
  const [editedProduct, setEditedProduct] = useState(null); // Продукт для редактирования
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    volume: '',
    purchaseDate: '',
    dailyUsage: '',
  });
  const [errors, setErrors] = useState({});
  const [showInfoText, setShowInfoText] = useState(true);

  const validateFields = () => {
    const newErrors = {};
    if (!newProduct.name) newErrors.name = 'Введите название продукта.';
    if (!newProduct.category) newErrors.category = 'Укажите категорию.';
    if (!/^\d+$/.test(newProduct.volume)) newErrors.volume = 'Объем должен быть числом.';
    if (!/^\d+$/.test(newProduct.dailyUsage)) newErrors.dailyUsage = 'Расход в день должен быть числом.';
    if (
      !/^\d{2}\.\d{2}\.\d{4}$/.test(newProduct.purchaseDate) ||
      isNaN(Date.parse(newProduct.purchaseDate.split('.').reverse().join('-')))
    )
      newErrors.purchaseDate = 'Введите дату в формате ДД.ММ.ГГГГ.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOrUpdateProduct = () => {
    if (!validateFields()) return;
  
    if (isEditing) {
      // Если мы редактируем продукт, обновляем продукт в списке
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === editedProduct.id
            ? { ...product, ...newProduct } // Обновляем старый продукт новыми данными
            : product
        )
      );
      setIsEditing(false); // Закрываем режим редактирования
    } else {
      // Если добавляем новый продукт
      setProducts((prevProducts) => [
        ...prevProducts,
        {
          ...newProduct,
          volume: parseInt(newProduct.volume),
          dailyUsage: parseInt(newProduct.dailyUsage),
          remaining: parseInt(newProduct.volume),
          id: Date.now(),
        },
      ]);
      setShowInfoText(false); // Скрываем информационное сообщение после добавления продукта
    }
  
    // Очистка полей и ошибок после сохранения
    setNewProduct({
      name: '',
      category: '',
      volume: '',
      purchaseDate: '',
      dailyUsage: '',
    });
    setErrors({});
    setModalVisible(false); // Закрытие модального окна
  };
  
  const handleEditProduct = (product) => {
    setEditedProduct(product); // Устанавливаем продукт для редактирования
    setNewProduct({
      name: product.name,
      category: product.category,
      volume: product.volume.toString(),
      purchaseDate: product.purchaseDate,
      dailyUsage: product.dailyUsage.toString(),
    });
    setIsEditing(true); // Включаем режим редактирования
    setModalVisible(true); // Открываем модальное окно
  };
  
  const handleDecreaseStock = (productId, amount) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              remaining: Math.max(0, product.remaining - amount), // уменьшаем остаток
            }
          : product
      )
    );
  };

  const calculateDaysLeft = (product) => {
    return Math.max(0, Math.floor(product.remaining / product.dailyUsage));
  };

  const handleNotifications = () => {
    products.forEach((product) => {
      const daysLeft = calculateDaysLeft(product);
      if (daysLeft <= 5 && daysLeft > 0) {
        Alert.alert(
          `Запас продукта "${product.name}" заканчивается`,
          `Осталось всего ${daysLeft} дней. Пора пополнить запасы!`
        );
      }
    });
  };

  useEffect(() => {
    handleNotifications();
  }, [products]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.productList}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image
              source={require('../../assets/images/latte.png')}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.productSubtitle}>Категория: {product.category}</Text>
              <Text style={styles.productSubtitle}>Остаток: {product.remaining} г</Text>
              <Text style={styles.productSubtitle}>Дата покупки: {product.purchaseDate}</Text>
              <Text style={styles.productSubtitle}>Осталось дней: {calculateDaysLeft(product)}</Text>
              <TouchableOpacity
                style={styles.decreaseButton}
                onPress={() => handleDecreaseStock(product.id, 25)}
              >
                <Text style={styles.decreaseButtonText}>Вычесть 25 г</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditProduct(product)} // Редактируем продукт
              >
                <Text style={styles.editButtonText}>Редактировать</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {showInfoText && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Нажмите на кнопку "+" для добавления нового продукта.</Text>
          <Text style={styles.infoText}>Вы сможете ввести название, категорию, объем и другие данные продукта.</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Редактировать продукт' : 'Добавить продукт'}</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Название"
              value={newProduct.name}
              onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            <TextInput
              style={[styles.input, errors.category && styles.inputError]}
              placeholder="Категория"
              value={newProduct.category}
              onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
            />
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            <TextInput
              style={[styles.input, errors.volume && styles.inputError]}
              placeholder="Объем (гр)"
              keyboardType="numeric"
              value={newProduct.volume}
              onChangeText={(text) => setNewProduct({ ...newProduct, volume: text })}
            />
            {errors.volume && <Text style={styles.errorText}>{errors.volume}</Text>}
            <TextInput
              style={[styles.input, errors.purchaseDate && styles.inputError]}
              placeholder="Дата покупки"
              value={newProduct.purchaseDate}
              onChangeText={(text) => setNewProduct({ ...newProduct, purchaseDate: text })}
            />
            {errors.purchaseDate && <Text style={styles.errorText}>{errors.purchaseDate}</Text>}
            <TextInput
              style={[styles.input, errors.dailyUsage && styles.inputError]}
              placeholder="Расход в день (г)"
              keyboardType="numeric"
              value={newProduct.dailyUsage}
              onChangeText={(text) => setNewProduct({ ...newProduct, dailyUsage: text })}
            />
            {errors.dailyUsage && <Text style={styles.errorText}>{errors.dailyUsage}</Text>}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddOrUpdateProduct}
            >
              <Text style={styles.saveButtonText}>{isEditing ? 'Сохранить изменения' : 'Сохранить'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3efe7', padding: 20 },
  productList: { paddingBottom: 80 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    elevation: 2,
  },
  productImage: { width: 80, height: 80, borderRadius: 10 },
  productInfo: { flex: 1, marginLeft: 10 },
  productTitle: { fontSize: 18, fontWeight: 'bold', color: '#6d4c41' },
  productSubtitle: { fontSize: 14, color: '#8d6e63' },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6d4c41',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  decreaseButton: {
    backgroundColor: '#ff7043',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  decreaseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10 },
  saveButton: {
    backgroundColor: '#6d4c41',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { marginTop: 10, padding: 10, alignItems: 'center', width: '100%' },
  cancelButtonText: { color: '#6d4c41', fontSize: 16, fontWeight: 'bold' },
  infoBox: {
    position: 'absolute',
    top: 300, // Расположить блок немного ниже верхнего края экрана
    left: 0,
    right: 0,
    backgroundColor: '#f7f4e9',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6d4c41',
    textAlign: 'center',
    marginBottom: 5,
  },
});
