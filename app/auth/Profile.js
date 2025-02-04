import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

const Profile = () => {
    const navigation = useNavigation();

    const handleLogout = async () => {
        try {
        await signOut(auth);
        navigation.replace("Login"); // Перенаправление на экран входа после выхода
        } catch (error) {
        console.error("Ошибка при выходе:", error.message);
        }
    };

    return (
        <View style={styles.container}>
        <View style={styles.profileCard}>
            <Text style={styles.title}>Профиль</Text>
            <Text style={styles.email}>Email: {auth.currentUser?.email}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Выйти</Text>
            </TouchableOpacity>
        </View>
        </View>
    );
    };

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3efe7",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    profileCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        width: "100%",
        alignItems: "center",
        elevation: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6d4c41",
        marginBottom: 10,
    },
    email: {
        fontSize: 16,
        color: "#8d6e63",
        marginBottom: 20,
    },
    logoutButton: {
        backgroundColor: "#ff7043",
        padding: 12,
        borderRadius: 8,
        width: "100%",
        alignItems: "center",
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    });

    export default Profile;
