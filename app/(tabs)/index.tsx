import { Switch } from "react-native";
import React, { useState, useEffect } from "react";
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
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { scheduleNotification, setupNotifications } from "./notifications";
import {
  addProduct,
  addSavedProduct,
  getSavedProducts,
  deleteSavedProduct,
} from "../../firebase/productService";

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

interface Product {
  id: number;
  name: string;
  category: string;
  volume: number;
  purchaseDate: string;
  dailyUsage: number;
  remaining: number;
  autoTracking: boolean;
}

interface NewProduct {
  name: string;
  category: string;
  volume: string;
  purchaseDate: string;
  dailyUsage: string;
  autoTracking: boolean;
}

export default function HomeScreen() {
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    category: "",
    volume: "",
    purchaseDate: "",
    dailyUsage: "",
    autoTracking: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showInfoText, setShowInfoText] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
  const [showAppInfo, setShowAppInfo] = useState(true);

  const categories = ["Сахар", "Кофе", "Чай", "Крупы", "Мука", "Специи"];
  const volumeOptions = ["100", "250", "500", "750", "900", "1000", "Другое"];
  const dailyUsageOptions = ["5", "10", "15", "20", "25", "30", "Другое"];

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    if (!newProduct.name) newErrors.name = "Введите название продукта.";
    if (!newProduct.category) newErrors.category = "Укажите категорию.";
    if (!/^\d+$/.test(newProduct.volume))
      newErrors.volume = "Объем должен быть числом.";
    if (!/^\d+$/.test(newProduct.dailyUsage))
      newErrors.dailyUsage = "Расход в день должен быть числом.";
    if (!newProduct.purchaseDate)
      newErrors.purchaseDate = "Укажите дату покупки.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOrUpdateProduct = async () => {
    if (!validateFields()) return;

    try {
      setIsSaving(true);

      if (isEditing && editedProduct) {
        try {
          // Удаляем старый продукт из Firebase
          await deleteSavedProduct(editedProduct.id);
        } catch (error) {
          console.log("Ошибка при удалении старого продукта:", error);
          // Продолжаем выполнение даже если удаление не удалось
        }

        // Создаём новый продукт с обновлёнными данными, сохраняя исходный ID
        const updatedProductData = {
          ...newProduct,
          volume: parseInt(newProduct.volume),
          dailyUsage: parseInt(newProduct.dailyUsage),
          remaining: parseInt(newProduct.volume),
          id: editedProduct.id, // Сохраняем исходный ID вместо создания нового
        };

        // Добавляем в локальное состояние
        setSavedProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === editedProduct.id
              ? (updatedProductData as Product)
              : product
          )
        );

        // Сохраняем в Firebase
        await addProduct(updatedProductData);
        await addSavedProduct(updatedProductData);

        setIsEditing(false);
      } else {
        // Создаем объект нового продукта
        const newProductData = {
          ...newProduct,
          volume: parseInt(newProduct.volume),
          dailyUsage: parseInt(newProduct.dailyUsage),
          remaining: parseInt(newProduct.volume),
          id: Date.now(),
        };

        // Добавляем в локальное состояние
        setSavedProducts((prevProducts) => [
          ...prevProducts,
          newProductData as Product,
        ]);

        // Сохраняем в Firebase
        await addProduct(newProductData);
        await addSavedProduct(newProductData);

        setShowInfoText(false);
      }

      setNewProduct({
        name: "",
        category: "",
        volume: "",
        purchaseDate: "",
        dailyUsage: "",
        autoTracking: true,
      });
      setErrors({});
      setModalVisible(false);
    } catch (error) {
      console.error("Ошибка при сохранении продукта:", error);
      // Alert.alert(
      //   "Ошибка",
      //   "Не удалось сохранить продукт. Попробуйте еще раз."
      // );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditedProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      volume: product.volume.toString(),
      purchaseDate: product.purchaseDate,
      dailyUsage: product.dailyUsage.toString(),
      autoTracking: product.autoTracking,
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDeleteProduct = (productId: number) => {
    Alert.alert(
      "Удалить продукт",
      "Вы уверены, что хотите удалить этот продукт?",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Удалить",
          onPress: async () => {
            try {
              setDeletingProductId(productId);
              await deleteSavedProduct(productId);
              setSavedProducts((prevProducts) =>
                prevProducts.filter((product) => product.id !== productId)
              );
            } catch (error) {
              console.error("Ошибка при удалении продукта:", error);
              // Alert.alert(
              //   "Ошибка",
              //   "Не удалось удалить продукт. Попробуйте еще раз."
              // );
            } finally {
              setDeletingProductId(null);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Получение продуктов из Firebase при монтировании компонента
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getSavedProducts();
        setSavedProducts(products || []);
      } catch (error) {
        console.error("Ошибка при загрузке продуктов:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleDecreaseStock = async (productId: number, amount: number) => {
    try {
      setUpdatingProductId(productId);

      // Оптимистическое обновление UI
      const updatedProducts = savedProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              remaining: Math.max(0, product.remaining - amount),
            }
          : product
      );

      // Обновляем локальное состояние немедленно
      setSavedProducts(updatedProducts);

      // Находим обновленный продукт
      const updatedProduct = updatedProducts.find((p) => p.id === productId);

      if (updatedProduct) {
        // Удаляем старый продукт из Firebase
        await deleteSavedProduct(productId);

        // Сохраняем обновленный продукт в Firebase
        await addSavedProduct(updatedProduct);
      }
    } catch (error) {
      console.error("Ошибка при обновлении остатка продукта:", error);

      // В случае ошибки возвращаем предыдущее состояние
      setSavedProducts((prevProducts) => prevProducts);

      // Alert.alert(
      //   "Ошибка",
      //   "Не удалось обновить остаток продукта. Попробуйте еще раз."
      // );
    } finally {
      setUpdatingProductId(null);
    }
  };

  const calculateDaysLeft = (product: Product) => {
    return Math.max(0, Math.floor(product.remaining / product.dailyUsage));
  };

  const handleNotifications = () => {
    savedProducts.forEach((product) => {
      const daysLeft = calculateDaysLeft(product);
      if (daysLeft <= 5 && daysLeft > 0) {
        Alert.alert(
          `Запас продукта "${product.name}" заканчивается`,
          `Осталось всего ${daysLeft} дней. Пора пополнить запасы!`
        );
      }
    });
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = `${selectedDate
        .getDate()
        .toString()
        .padStart(2, "0")}.${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${selectedDate.getFullYear()}`;
      setNewProduct({ ...newProduct, purchaseDate: formattedDate });
    }
  };
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  useEffect(() => {
    setupNotifications();

    const checkProducts = () => {
      savedProducts.forEach((product) => {
        if (product.autoTracking) {
          scheduleNotification(product);
        }
      });
    };

    const interval = setInterval(checkProducts, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [savedProducts]);

  useEffect(() => {
    handleNotifications();
  }, [savedProducts]);

return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Новый информационный блок о приложении */}
        {showAppInfo && (
          <View style={styles.appInfoContainer}>
            <View style={styles.appInfoHeader}>
              <Image 
                source={require("../../assets/images/icon.png")} 
                style={styles.appIcon}
              />
              <Text style={styles.appTitle}>Кухонный склад</Text>
              <TouchableOpacity 
                style={styles.closeInfoButton}
                onPress={() => setShowAppInfo(false)}
              >
                <MaterialIcons name="close" size={24} color="#6d4c41" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.appDescription}>
              Приложение помогает отслеживать запасы сыпучих продуктов на кухне, 
              предупреждает о заканчивающихся продуктах и автоматически рассчитывает 
              оставшееся количество дней.
            </Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <MaterialIcons name="notifications" size={20} color="#6d4c41" />
                <Text style={styles.featureText}>Уведомления о низких запасах</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="auto-awesome" size={20} color="#6d4c41" />
                <Text style={styles.featureText}>Автоматический расчет</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="cloud" size={20} color="#6d4c41" />
                <Text style={styles.featureText}>Облачное хранение данных</Text>
              </View>
            </View>
          </View>
        )}

        {/* Список продуктов */}
        {savedProducts.length > 0 ? (
          savedProducts.map((product) => (
            <View key={product.id} style={[
              styles.productCard,
              calculateDaysLeft(product) <= 3 && styles.lowStockCard
            ]}>
              <View style={styles.productImageContainer}>
                <Image
                  source={getCategoryImage(product.category)}
                  style={styles.productImage}
                />
                {calculateDaysLeft(product) <= 3 && (
                  <View style={styles.urgentBadge}>
                    <MaterialIcons name="warning" size={16} color="#fff" />
                    <Text style={styles.urgentText}>Срочно</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.productTitle}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
                
                <View style={styles.productDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="scale" size={16} color="#8d6e63" />
                    <Text style={styles.detailText}>
                      Остаток: <Text style={styles.detailValue}>{product.remaining}г</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="today" size={16} color="#8d6e63" />
                    <Text style={styles.detailText}>Куплено: {product.purchaseDate}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="timelapse" size={16} color="#8d6e63" />
                    <Text style={styles.detailText}>
                      Осталось дней: <Text style={[
                        styles.daysLeft,
                        calculateDaysLeft(product) <= 3 && styles.daysLeftUrgent
                      ]}>
                        {calculateDaysLeft(product)}
                      </Text>
                    </Text>
                  </View>
                </View>

                {product.remaining > 0 ? (
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.decreaseButton,
                        updatingProductId === product.id && styles.disabledButton,
                      ]}
                      onPress={() => handleDecreaseStock(product.id, 25)}
                      disabled={updatingProductId === product.id}
                    >
                      <MaterialIcons name="remove" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>
                        {updatingProductId === product.id ? "Обновление..." : "25г"}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditProduct(product)}
                    >
                      <MaterialIcons name="edit" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Изменить</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.deleteButton,
                        deletingProductId === product.id && styles.disabledButton,
                      ]}
                      onPress={() => handleDeleteProduct(product.id)}
                      disabled={deletingProductId === product.id}
                    >
                      <MaterialIcons name="delete" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>
                        {deletingProductId === product.id ? "Удаление..." : "Удалить"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Image
              source={require("../../assets/images/empty.png")}
              style={styles.emptyStateImage}
            />
            <Text style={styles.emptyStateTitle}>Нет добавленных продуктов</Text>
            <Text style={styles.emptyStateSubtitle}>
              Нажмите кнопку "+" внизу экрана, чтобы добавить первый продукт
            </Text>
          </View>
        )}

        {/* Информация для новых пользователей */}
        {showInfoText && savedProducts.length === 0 && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Как это работает?</Text>
            
            <View style={styles.infoSteps}>
              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <MaterialIcons name="add-circle" size={24} color="#6d4c41" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Добавьте продукты</Text>
                  <Text style={styles.stepDescription}>
                    Укажите название, категорию, объем и дату покупки
                  </Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <MaterialIcons name="track-changes" size={24} color="#6d4c41" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Отслеживайте расход</Text>
                  <Text style={styles.stepDescription}>
                    Нажимайте кнопку "-25г" при использовании продукта
                  </Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <MaterialIcons name="notifications" size={24} color="#6d4c41" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Получайте уведомления</Text>
                  <Text style={styles.stepDescription}>
                    Приложение предупредит, когда запасы будут заканчиваться
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Кнопка добавления */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setNewProduct({
            name: "",
            category: "",
            volume: "",
            purchaseDate: "",
            dailyUsage: "",
            autoTracking: true,
          });
          setModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Модальное окно добавления/редактирования */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Редактировать продукт" : "Новый продукт"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#5D4037" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Название продукта</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Например: Сахар коричневый"
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, name: text })
                  }
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Категория</Text>
                <View
                  style={[
                    styles.pickerContainer,
                    errors.category && styles.inputError,
                  ]}
                >
                  <Picker
                    selectedValue={newProduct.category}
                    onValueChange={(itemValue) =>
                      setNewProduct({ ...newProduct, category: itemValue })
                    }
                    style={styles.picker}
                    dropdownIconColor="#6d4c41"
                  >
                    <Picker.Item label="Выберите категорию" value="" />
                    {categories.map((category) => (
                      <Picker.Item
                        key={category}
                        label={category}
                        value={category}
                      />
                    ))}
                  </Picker>
                </View>
                {errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Объем упаковки (грамм)</Text>
                <View
                  style={[
                    styles.pickerContainer,
                    errors.volume && styles.inputError,
                  ]}
                >
                  <Picker
                    selectedValue={newProduct.volume}
                    onValueChange={(itemValue) => {
                      if (itemValue === "Другое") {
                        setNewProduct({ ...newProduct, volume: "" });
                      } else {
                        setNewProduct({ ...newProduct, volume: itemValue });
                      }
                    }}
                    style={styles.picker}
                    dropdownIconColor="#6d4c41"
                  >
                    <Picker.Item label="Выберите объем" value="" />
                    {volumeOptions.map((volume) => (
                      <Picker.Item key={volume} label={volume} value={volume} />
                    ))}
                  </Picker>
                </View>
                {newProduct.volume === "" && (
                  <TextInput
                    style={[styles.input, errors.volume && styles.inputError]}
                    placeholder="Введите объем в граммах"
                    keyboardType="numeric"
                    value={newProduct.volume}
                    onChangeText={(text) =>
                      setNewProduct({ ...newProduct, volume: text })
                    }
                  />
                )}
                {errors.volume && (
                  <Text style={styles.errorText}>{errors.volume}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Дата покупки</Text>
                <TouchableWithoutFeedback onPress={showDatepicker}>
                  <View
                    style={[
                      styles.input,
                      styles.dateInput,
                      errors.purchaseDate && styles.inputError,
                    ]}
                  >
                    <MaterialIcons name="event" size={20} color="#6d4c41" />
                    <Text
                      style={
                        newProduct.purchaseDate
                          ? styles.dateText
                          : styles.placeholderText
                      }
                    >
                      {newProduct.purchaseDate || "Выберите дату"}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                  />
                )}
                {errors.purchaseDate && (
                  <Text style={styles.errorText}>{errors.purchaseDate}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <View style={styles.switchLabelContainer}>
                    <MaterialIcons name="auto-awesome" size={20} color="#6d4c41" />
                    <Text style={styles.switchLabel}>Автоматическое отслеживание</Text>
                  </View>
                  <Switch
                    value={newProduct.autoTracking}
                    onValueChange={(value) =>
                      setNewProduct({ ...newProduct, autoTracking: value })
                    }
                    thumbColor="#fff"
                    trackColor={{ false: "#d7ccc8", true: "#6d4c41" }}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Средний расход в день (грамм)</Text>
                <View
                  style={[
                    styles.pickerContainer,
                    errors.dailyUsage && styles.inputError,
                  ]}
                >
                  <Picker
                    selectedValue={newProduct.dailyUsage}
                    onValueChange={(itemValue) => {
                      if (itemValue === "Другое") {
                        setNewProduct({ ...newProduct, dailyUsage: "" });
                      } else {
                        setNewProduct({ ...newProduct, dailyUsage: itemValue });
                      }
                    }}
                    style={styles.picker}
                    dropdownIconColor="#6d4c41"
                  >
                    <Picker.Item label="Выберите расход" value="" />
                    {dailyUsageOptions.map((usage) => (
                      <Picker.Item key={usage} label={usage} value={usage} />
                    ))}
                  </Picker>
                </View>

                {newProduct.dailyUsage === "" && (
                  <TextInput
                    style={[styles.input, errors.dailyUsage && styles.inputError]}
                    placeholder="Введите примерный расход в граммах"
                    keyboardType="numeric"
                    value={newProduct.dailyUsage}
                    onChangeText={(text) =>
                      setNewProduct({ ...newProduct, dailyUsage: text })
                    }
                  />
                )}
                {errors.dailyUsage && (
                  <Text style={styles.errorText}>{errors.dailyUsage}</Text>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={handleAddOrUpdateProduct}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Вспомогательная функция для получения изображения по категории
const getCategoryImage = (category: string) => {
  switch(category) {
    case "Сахар":
      return require("../../assets/images/sugar.png");
    case "Кофе":
      return require("../../assets/images/latte.png");
    case "Чай":
      return require("../../assets/images/tea.png");
    case "Крупы":
      return require("../../assets/images/cereals.png");
    case "Мука":
      return require("../../assets/images/flour.png");
    case "Специи":
      return require("../../assets/images/default.png");
    default:
      return require("../../assets/images/default.png");
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  
  // Стили для информационного блока о приложении
  appInfoContainer: {
    backgroundColor: "#fff9f0",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 20,
    shadowColor: "#6d4c41",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  appInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  appIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D4037",
    flex: 1,
  },
  closeInfoButton: {
    padding: 4,
  },
  appDescription: {
    fontSize: 14,
    color: "#6d4c41",
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: "#6d4c41",
    marginLeft: 8,
  },
  
  // Стили для карточки продукта
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#5D4037",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  lowStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#ff7043",
  },
  productImageContainer: {
    position: "relative",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  urgentBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ff7043",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  urgentText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 2,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5D4037",
    flex: 1,
  },
  productCategory: {
    fontSize: 12,
    color: "#8d6e63",
    backgroundColor: "#efebe9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  productDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#8d6e63",
    marginLeft: 6,
  },
  detailValue: {
    fontWeight: "600",
  },
  daysLeft: {
    fontWeight: "bold",
    color: "#5D4037",
  },
  daysLeftUrgent: {
    color: "#ff7043",
  },
  
  // Стили для кнопок
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  decreaseButton: {
    backgroundColor: "#ff7043",
  },
  editButton: {
    backgroundColor: "#5D4037",
  },
  deleteButton: {
    backgroundColor: "#d32f2f",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  
  // Стили для пустого состояния
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D4037",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#8d6e63",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Стили для модального окна
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: isSmallDevice ? "90%" : "85%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5D4037",
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: isSmallDevice ? height * 0.5 : height * 0.6,
  },
  
  // Стили для формы
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#5D4037",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d7ccc8",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  inputError: {
    borderColor: "#d32f2f",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d7ccc8",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    color: "#5D4037",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#5D4037",
    marginLeft: 8,
  },
  placeholderText: {
    color: "#9e9e9e",
    marginLeft: 8,
  },
  
  // Стили для переключателя
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    color: "#5D4037",
    fontWeight: "500",
    marginLeft: 8,
  },
  
  // Стили для кнопок в модальном окне
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: "#5D4037",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#efebe9",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d7ccc8",
  },
  cancelButtonText: {
    color: "#5D4037",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.6,
  },
  
  // Стили для информационного блока
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
    shadowColor: "#5D4037",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D4037",
    marginBottom: 16,
    textAlign: "center",
  },
  infoSteps: {
    marginBottom: 8,
  },
  step: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#efebe9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5D4037",
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: "#8d6e63",
    lineHeight: 18,
  },
  
  // Стиль для кнопки добавления
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#5D4037",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#5D4037",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});