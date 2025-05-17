import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

// Добавление продукта в базу данных и историю
export const addProduct = async (product) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Пользователь не авторизован");

    // Используем существующий ID или генерируем новый
    const productId = product.id || Date.now();

    // Проверяем, существует ли уже продукт с таким ID
    const q = query(
      collection(db, "products"),
      where("userId", "==", user.uid),
      where("id", "==", productId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.error("Продукт с таким ID уже существует:", productId);
      return;
      // throw new Error("Продукт с таким ID уже существует");
    }

    // Добавляем информацию о пользователе и дате создания
    const productWithMetadata = {
      ...product,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      id: productId,
      // Вычисляем дату окончания на основе объема и ежедневного использования
      endDate: calculateEndDate(
        product.purchaseDate,
        product.volume,
        product.dailyUsage
      ),
    };

    // Добавляем в коллекцию продуктов
    const docRef = await addDoc(
      collection(db, "products"),
      productWithMetadata
    );

    console.log("Продукт добавлен с ID:", docRef.id);
    return { id: productWithMetadata.id, ...productWithMetadata }; // Using your custom ID, not Firebase's
  } catch (error) {
    console.error("Ошибка при добавлении продукта:", error);
    // throw error;
  }
};

// Получение истории продуктов пользователя
export const getUserProducts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Пользователь не авторизован");

    const q = query(
      collection(db, "products"),
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(q);

    const products = [];
    console.log("Firebase documents found:", querySnapshot.size);

    querySnapshot.forEach((doc) => {
      console.log("Document data:", doc.id, doc.data());
      products.push({ id: doc.id, ...doc.data() });
    });

    return products;
  } catch (error) {
    console.error("Ошибка при получении продуктов:", error);
    // throw error;
  }
};
// Удаление продукта
export const deleteProduct = async (productId) => {
  try {
    console.log("Attempting to delete document:", productId);

    if (!productId) {
      console.error("ID продукта не определен");
      // throw new Error("ID продукта не определен");
    }

    // First, find the document with this ID in the products collection
    const user = auth.currentUser;
    if (!user) throw new Error("Пользователь не авторизован");

    const q = query(
      collection(db, "products"),
      where("userId", "==", user.uid),
      // If ID is stored as a number field in your documents
      where("id", "==", Number(productId))
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("Продукт не найден:", productId);
      throw new Error("Продукт не найден");
    }

    // Delete all matched documents (should be just one)
    const deletePromises = [];
    querySnapshot.forEach((document) => {
      console.log("Found document to delete:", document.id);
      deletePromises.push(deleteDoc(doc(db, "products", document.id)));
    });

    await Promise.all(deletePromises);
    console.log("Продукт удален:", productId);

    return true;
  } catch (error) {
    console.error("Ошибка при удалении продукта:", error);
    // throw error;
  }
};
// Вспомогательная функция для расчета даты окончания продукта
const calculateEndDate = (purchaseDate, volume, dailyUsage) => {
  // Преобразуем строку даты в объект Date
  const [day, month, year] = purchaseDate.split(".");
  const startDate = new Date(`${year}-${month}-${day}`);

  // Рассчитываем количество дней, на которое хватит продукта
  const daysLeft = Math.floor(volume / dailyUsage);

  // Добавляем дни к дате покупки
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + daysLeft);

  // Форматируем дату в строку DD.MM.YYYY
  return `${endDate.getDate().toString().padStart(2, "0")}.${(
    endDate.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}.${endDate.getFullYear()}`;
};

export const addSavedProduct = async (product) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Пользователь не авторизован");

    // Добавляем информацию о пользователе и дате создания
    const productWithMetadata = {
      ...product,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      // Используем существующий ID или генерируем новый
      id: product.id || Date.now(),
      // Вычисляем дату окончания на основе объема и ежедневного использования
      endDate: calculateEndDate(
        product.purchaseDate,
        product.volume,
        product.dailyUsage
      ),
    };

    // Добавляем в коллекцию продуктов
    const docRef = await addDoc(
      collection(db, "savedProducts"),
      productWithMetadata
    );

    console.log("Продукт добавлен с ID:", docRef.id);
    return { id: productWithMetadata.id, ...productWithMetadata }; // Using your custom ID, not Firebase's
  } catch (error) {
    console.error("Ошибка при добавлении продукта:", error);
    // throw error;
  }
};

export const getSavedProducts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Пользователь не авторизован");

    const q = query(
      collection(db, "savedProducts"),
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(q);

    const products = [];
    console.log("Firebase documents found:", querySnapshot.size);

    querySnapshot.forEach((doc) => {
      console.log("Document data:", doc.id, doc.data());
      products.push({ id: doc.id, ...doc.data() });
    });

    return products;
  } catch (error) {
    console.error("Ошибка при получении продуктов:", error);
    // throw error;
  }
};

export const deleteSavedProduct = async (productId) => {
  try {
    console.log(
      "Attempting to delete saved product with ID:",
      productId,
      typeof productId
    );

    if (!productId) {
      console.error("ID продукта не определен");
      // throw new Error("ID продукта не определен");
    }

    // First, find the document with this ID in the products collection
    const user = auth.currentUser;
    if (!user) throw new Error("Пользователь не авторизован");

    // Преобразуем ID в число, если он передан как строка
    const numericId =
      typeof productId === "string" ? Number(productId) : productId;

    // Создаем два запроса - один для числового ID, другой для строкового
    const qNumeric = query(
      collection(db, "savedProducts"),
      where("userId", "==", user.uid),
      where("id", "==", numericId)
    );

    const qString = query(
      collection(db, "savedProducts"),
      where("userId", "==", user.uid),
      where("id", "==", String(productId))
    );

    // Выполняем оба запроса
    const [querySnapshotNumeric, querySnapshotString] = await Promise.all([
      getDocs(qNumeric),
      getDocs(qString),
    ]);

    // Объединяем результаты
    const deletePromises = [];

    if (!querySnapshotNumeric.empty) {
      querySnapshotNumeric.forEach((document) => {
        console.log("Found document to delete (numeric ID):", document.id);
        deletePromises.push(deleteDoc(doc(db, "savedProducts", document.id)));
      });
    }

    if (!querySnapshotString.empty) {
      querySnapshotString.forEach((document) => {
        console.log("Found document to delete (string ID):", document.id);
        deletePromises.push(deleteDoc(doc(db, "savedProducts", document.id)));
      });
    }

    if (deletePromises.length === 0) {
      console.error("Продукт не найден:", productId);
      // throw new Error("Продукт не найден");
    }

    await Promise.all(deletePromises);
    console.log("Продукт удален:", productId);

    return true;
  } catch (error) {
    console.error("Ошибка при удалении продукта:", error);
    // throw error;
  }
};
