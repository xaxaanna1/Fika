import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Импорт Firestore

const addProductToFirestore = async (product) => {
    try {
        await addDoc(collection(db, "products"), product);
        console.log("Продукт добавлен:", product.name);
    } catch (error) {
        console.error("Ошибка при добавлении продукта:", error);
    }
};
