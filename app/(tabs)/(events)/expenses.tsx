import { PRIMARY_COLOR } from "@/constants/constants";
import { EventExpense } from "@/types/model";
import { API_BASE_URL } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ExpensesScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();

  const [expenses, setExpenses] = useState<EventExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<EventExpense | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchExpenses();
  }, [eventId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
  
      // 1️⃣ Load from local DB FIRST
      // const localExpenses = await getEventExpenses(String(eventId));
      // setExpenses(localExpenses);
  
      // 2️⃣ Fetch from API
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;
  
      const res = await fetch(
        `${API_BASE_URL}/events/${eventId}/expenses`,
        { headers: { Authorization: token } }
      );
  
      if (!res.ok) return;
  
      const serverData = await res.json();
  
      // 🔒 HARD GUARD
      if (!Array.isArray(serverData.expenses)) {
        console.error("Expenses API did not return array:", serverData);
        return;
      }
  
      // 3️⃣ Sync directly using syncTable
      // await syncTable(
      //   "event_expenses",
      //   ["expense_id"],
      //   serverData,
      //   ["expense_id", "event_id", "amount", "description", "uploaded_by", "uploaded_at"]
      // );

      setExpenses(serverData.expenses);
  
    } catch (error) {
      console.error("Error fetching expenses:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load expenses",
      });
    } finally {
      setLoading(false);
    }
  };
  

  const handleAddExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter a valid amount",
      });
      return;
    }

    try {
      setButtonLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      const userId = await SecureStore.getItemAsync("userId");

      const res = await fetch(`${API_BASE_URL}/events/${eventId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to add expense");
      }

      const newExpense = await res.json();
      // await syncExpenses([newExpense]);
      
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Expense added successfully",
      });
      setExpenses((prev) => [...prev, newExpense]);
      setAmount("");
      setDescription("");
      setShowAddModal(false);
      await fetchExpenses();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to add expense",
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const handleEditExpense = async () => {
    if (!selectedExpense || !amount || parseFloat(amount) <= 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter a valid amount",
      });
      return;
    }

    try {
      setButtonLoading(true);
      const token = await SecureStore.getItemAsync("userToken");

      const res = await fetch(
        `${API_BASE_URL}/events/${eventId}/expenses/${selectedExpense.expense_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            description: description || null,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update expense");
      }

      const updatedExpense = await res.json();
      
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Expense updated successfully",
      });
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.expense_id === updatedExpense.expense_id ? updatedExpense : exp
        )
      );

      setShowEditModal(false);
      setSelectedExpense(null);
      setAmount("");
      setDescription("");
      await fetchExpenses();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update expense",
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const handleDeleteExpense = (expense: EventExpense) => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete this expense of $${expense.amount?.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setButtonLoading(true);
              const token = await SecureStore.getItemAsync("userToken");

              const res = await fetch(
                `${API_BASE_URL}/events/${eventId}/expenses/${expense.expense_id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: token || "" },
                }
              );

              if (!res.ok) {
                throw new Error("Failed to delete expense");
              }
              
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Expense deleted successfully",
              });

              setExpenses((prev) =>
                prev.filter((exp) => exp.expense_id !== expense.expense_id)
              );

              await fetchExpenses();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete expense",
              });
            } finally {
              setButtonLoading(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (expense: EventExpense) => {
    setSelectedExpense(expense);
    setAmount(expense.amount.toString());
    setDescription(expense.description || "");
    setShowEditModal(true);
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons size={24} name="arrow-back-outline" color={PRIMARY_COLOR} />
        </Pressable>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Total Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>${totalAmount?.toFixed(2)}</Text>
        </View>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
          </View>
        ) : (
          expenses.map((expense) => (
            <View key={expense.expense_id} style={styles.expenseCard}>
              <View style={styles.expenseLeft}>
                <View style={styles.expenseIcon}>
                  <Ionicons name="receipt" size={20} color="#fff" />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>
                    {expense.description || "No description"}
                  </Text>
                  <Text style={styles.expenseMeta}>
                    {expense.uploaded_by_user?.name || "Unknown"} •{" "}
                    {new Date(expense.uploaded_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>${expense.amount?.toFixed(2)}</Text>
                <View style={styles.expenseActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(expense)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create-outline" size={18} color={PRIMARY_COLOR} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(expense)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this expense for?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddExpense}
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this expense for?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEditExpense}
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  expenseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  expenseMeta: {
    fontSize: 12,
    color: "#666",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  expenseActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

