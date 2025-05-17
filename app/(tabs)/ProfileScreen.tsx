import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getUserProducts,
  deleteProduct,
  addSavedProduct,
} from "../../firebase/productService";

// Интерфейс для истории продуктов
interface ProductHistory {
  id: string;
  name: string;
  purchaseDate: string;
  endDate: string;
  image: any;
  category: string;
}

const ProfileScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", email: "", avatar: "" });
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Добавляем состояние для отслеживания обновления

  // История продуктов пользователя
  const [productHistory, setProductHistory] = useState<ProductHistory[]>([]);

  // Функция для получения изображения в зависимости от категории
  const getCategoryImage = (category) => {
    switch (category) {
      case "Чай":
        return require("../../assets/images/peach-tea.jpg");
      case "Кофе":
        return require("../../assets/images/latte.png");
      case "Сахар":
        return require("../../assets/images/sugar-white.jpg");
      case "Крупы":
        return require("../../assets/images/buckwheat.jpg");
      case "Мука":
        return require("../../assets/images/wheat-flour.jpg");
      case "Специи":
        // Если нет изображения для специй, используем заглушку
        return require("../../assets/images/latte.png");
      default:
        return require("../../assets/images/latte.png");
    }
  };

  // Функция для обновления данных при скролле вниз
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (user) {
        // Обновляем профиль
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }

        console.log("Fetching updated product list...");
        // Обновляем историю продуктов
        const products = await getUserProducts();
        console.log("Products after refresh:", products);

        const historyItems = products.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          purchaseDate: product.purchaseDate,
          endDate: product.endDate || "Не указано",
          image: getCategoryImage(product.category),
        }));

        console.log("Setting history items:", historyItems.length, "items");
        setProductHistory(historyItems);
      }
    } catch (error) {
      console.error("Ошибка при обновлении данных:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Если профиля нет, создаем его с email из аутентификации
          setProfile({ name: "", email: user.email, avatar: "" });
        }
      };
      fetchProfile();

      // Загрузка истории продуктов
      const fetchProductHistory = async () => {
        try {
          if (!user) return;

          const products = await getUserProducts();

          // Преобразуем данные в формат для отображения в истории
          const historyItems = products.map((product) => ({
            id: product.id,
            name: product.name,
            category: product.category,
            purchaseDate: product.purchaseDate,
            endDate: product.endDate || "Не указано",
            // Выбираем изображение в зависимости от категории
            image: getCategoryImage(product.category),
          }));

          setProductHistory(historyItems);
        } catch (error) {
          console.error("Ошибка при загрузке истории продуктов:", error);
        }
      };

      fetchProfile();
      fetchProductHistory();
    }
  }, [user]);

  // Функция для добавления продукта из истории
  const addToHistory = async (productId) => {
    try {
      // Проверяем, что productId существует
      if (!productId) {
        console.error("ID продукта не определен");
        return;
      }

      // Находим продукт в истории
      const product = productHistory.find(
        (item) => item && item.id === productId
      );
      if (!product) {
        console.error("Продукт не найден");
        return;
      }

      // Создаем новый продукт на основе исторического
      const newProduct = {
        name: product.name,
        category: product.category,
        volume: 500, // Значение по умолчанию, можно изменить
        purchaseDate: new Date()
          .toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "."),
        dailyUsage: 20, // Значение по умолчанию, можно изменить
        autoTracking: true,
        remaining: 500, // Значение по умолчанию, можно изменить
      };

      // Добавляем продукт в Firebase
      await addSavedProduct(newProduct);

      Alert.alert("Успешно", "Продукт добавлен из истории");
    } catch (error) {
      console.error("Ошибка при добавлении продукта из истории:", error);
      Alert.alert("Ошибка", "Не удалось добавить продукт");
    }
  };

  // Функция для удаления продукта из истории
  const removeFromHistory = async (productId) => {
    try {
      if (!productId) {
        console.error("ID продукта не определен");
        Alert.alert("Ошибка", "ID продукта не определен");
        return;
      }

      console.log("Attempting to remove product with ID:", productId);

      // Удаляем из Firebase
      await deleteProduct(productId);

      // Instead of updating local state, force a complete refresh from Firebase
      Alert.alert("Успешно", "Продукт удален из истории", [
        {
          text: "OK",
          onPress: () => {
            // Force refresh data from Firebase
            onRefresh();
          },
        },
      ]);
    } catch (error) {
      console.error(
        "Детальная ошибка при удалении продукта из истории:",
        error
      );
      Alert.alert("Ошибка", `Не удалось удалить продукт: ${error.message}`);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Необходимо разрешение на доступ к галерее");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setProfile({ ...profile, avatar: result.assets[0].base64 });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Сохраняем email из аутентификации, не позволяя его изменить
      const updatedProfile = {
        ...profile,
        email: user.email,
      };

      const docRef = doc(db, "users", user.uid);
      // Проверяем, существует ли документ
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, updatedProfile);
      } else {
        await setDoc(docRef, updatedProfile);
      }

      setProfile(updatedProfile);
      setModalVisible(false);
    } catch (e) {
      console.error("Ошибка при сохранении профиля:", e);
      alert("Ошибка при сохранении профиля");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Ошибка при выходе:", error.message);
    }
  };

  const renderHistoryItem = ({ item }: { item: ProductHistory }) => {
    if (!item || !item.id) {
      console.log("Attempted to render invalid history item:", item);
      return null;
    }

    return (
      <View style={styles.historyCard}>
        <View style={styles.historyContent}>
          <Image source={item.image} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <View style={styles.dateContainer}>
              <MaterialIcons name="date-range" size={16} color="#8d6e63" />
              <Text style={styles.productDate}>{item.purchaseDate}</Text>
            </View>
            <View style={styles.dateContainer}>
              <MaterialIcons name="event-busy" size={16} color="#8d6e63" />
              <Text style={styles.productDate}>{item.endDate}</Text>
            </View>
          </View>
        </View>
        <View style={styles.historyButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToHistory(item.id)}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.buttonActionText}>Добавить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => removeFromHistory(String(item.id))}
          >
            <MaterialIcons name="delete" size={20} color="#fff" />
            <Text style={styles.buttonActionText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6d4c41" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Добро пожаловать!</Text>
          <Text style={styles.welcomeSubtitle}>
            Войдите или зарегистрируйтесь, чтобы начать
          </Text>

          <TouchableOpacity
            style={styles.welcomeButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.welcomeButtonText}>Вход</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.welcomeButton, styles.welcomeButtonOutline]}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={[styles.welcomeButtonText, { color: "#6d4c41" }]}>
              Регистрация
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Профиль пользователя */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {profile.avatar ? (
            <Image
              source={{ uri: `data:image/png;base64,${profile.avatar}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={60} color="#bdbdbd" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.editAvatarButton} 
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            {profile.name || "Имя пользователя"}
          </Text>
          <Text style={styles.email}>{profile.email || user.email}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.editProfileButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.editProfileButtonText}>Редактировать профиль</Text>
      </TouchableOpacity>

      {/* История продуктов */}
      <View style={styles.historyContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>История продуктов</Text>
          <MaterialIcons name="history" size={24} color="#6d4c41" />
        </View>

        <FlatList
          data={productHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6d4c41"]}
              tintColor="#6d4c41"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyHistory}>
              <MaterialIcons name="history" size={50} color="#bdbdbd" />
              <Text style={styles.emptyText}>История пуста</Text>
              <Text style={styles.emptySubtext}>Добавленные продукты появятся здесь</Text>
            </View>
          }
          contentContainerStyle={productHistory.length === 0 && { flex: 1 }}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="exit-to-app" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Выйти</Text>
      </TouchableOpacity>

      {/* Модальное окно редактирования */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Редактировать профиль</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6d4c41" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Имя"
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
              />

              <View style={styles.disabledInputContainer}>
                <Text style={styles.disabledInputLabel}>Email:</Text>
                <Text style={styles.disabledInputText}>{user.email}</Text>
              </View>

              <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
                <MaterialIcons name="photo-camera" size={20} color="#fff" />
                <Text style={styles.buttonText}>Выбрать аватар</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              {saving ? (
                <ActivityIndicator size="large" color="#6d4c41" />
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Сохранить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Отмена</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6d4c41',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileInfo: {
    flex: 1
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 4
  },
  email: {
    fontSize: 16,
    color: '#8d6e63'
  },
  editProfileButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6d4c41',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  editProfileButtonText: {
    color: '#6d4c41',
    fontSize: 16,
    fontWeight: '500'
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3e2723'
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  historyContent: {
    flexDirection: 'row',
    marginBottom: 12
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3e2723',
    marginBottom: 6
  },
  categoryBadge: {
    backgroundColor: '#f9f5f0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  categoryText: {
    fontSize: 14,
    color: '#6d4c41',
    fontWeight: '500'
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  productDate: {
    fontSize: 14,
    color: '#8d6e63',
    marginLeft: 6
  },
  historyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonActionText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    color: '#8d6e63',
    marginTop: 16,
    fontWeight: '500'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdbdbd',
    marginTop: 8,
    textAlign: 'center'
  },
  logoutButton: {
    backgroundColor: '#ff7043',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3e2723'
  },
  modalBody: {
    padding: 20
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  disabledInputContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16
  },
  disabledInputLabel: {
    fontSize: 14,
    color: '#8d6e63',
    marginBottom: 4
  },
  disabledInputText: {
    fontSize: 16,
    color: '#3e2723'
  },
  avatarButton: {
    backgroundColor: '#8d6e63',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  saveButton: {
    backgroundColor: '#6d4c41',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#5d4037',
    fontSize: 16,
    fontWeight: '500'
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  welcomeLogo: {
    width: 120,
    height: 120,
    marginBottom: 24
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 12,
    textAlign: 'center'
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8d6e63',
    marginBottom: 24,
    textAlign: 'center'
  },
  welcomeButton: {
    backgroundColor: '#6d4c41',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12
  },
  welcomeButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6d4c41'
  },
  welcomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  }
});

export default ProfileScreen;