import React from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search events..."
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
      <Pressable style={styles.filterBtn}>
        <Ionicons name="filter" size={24} color="#fff" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterBtn: {
    marginLeft: 10,
    backgroundColor: "#090040",
    padding: 10,
    borderRadius: 12,
  },
});

export default SearchBar;
