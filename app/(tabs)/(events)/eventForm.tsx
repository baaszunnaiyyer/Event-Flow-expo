import React, { useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

type StateType = "Todo" | "InProgress" | null;

interface EventForm {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category: string;
  state: StateType;
  location: string;
  is_recurring: boolean;
  frequency: string;
  interval: number;
  by_day: string[];
  until: string;
}

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Yearly"];
const STATES = ["Todo", "InProgress"] as const;

export default function EventFormScreen() {
  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    category: "",
    state: "Todo",
    location: "",
    is_recurring: false,
    frequency: "",
    interval: 1,
    by_day: [] as string[],
    until: "",
  });

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | "until" | null>(null);
  const [showMode, setShowMode] = useState<"date" | "time" | "datetime" | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  

  const animHeight = useRef(new Animated.Value(0)).current;

  const toggleRecurring = () => {
    setForm((prev) => ({ ...prev, is_recurring: !prev.is_recurring, state: null }));

    Animated.timing(animHeight, {
      toValue: form.is_recurring ? 0 : 350, // expand to 200px
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const showPicker = (field: "start" | "end") => {
    setTempDate(new Date());
    setShowDatePicker(field);

    if (Platform.OS === "android") {
        setShowMode("date"); // Start with date, then show time
    } else {
        setShowMode("datetime"); // iOS can show both
    }
    };


  const onDateChange = (event: any, selectedDate?: Date) => {
    const isAndroid = Platform.OS === "android";
    if (event.type === "dismissed") {
        if (isAndroid && showMode === "time") {
        setShowDatePicker(null);
        }
        setShowMode(null);
        return;
    }
    
    
    if (selectedDate) {
        if (isAndroid && showMode === "date") {
        // On Android: move to time picker after selecting date
        setTempDate(selectedDate);
        setShowMode("time");
        return;
        }

        const finalDate = selectedDate ?? tempDate;
        const isoString = finalDate.toISOString();

        if (showDatePicker === "start") {
        handleChange("start_time", isoString);
        } else if (showDatePicker === "end") {
        handleChange("end_time", isoString);
        }

        setShowDatePicker(null);
        setShowMode(null);
    }
  };




  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.start_time || !form.end_time || !form.category) {
      return Toast.show({
        type:"error",
        text1 : "Error",
        text2 : "please Fill all the required Fields"});
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("userToken");

      const res = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create event");
      }

      Toast.show({
        type: "success",
        text1 : "Success",
        text2 : "Event Created Sucessfully"
      });
      setForm({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        category: "",
        state: "Todo",
        location: "",
        is_recurring: false,
        frequency: "",
        interval: 1,
        by_day: [] as string[],
        until: "",
      });
      router.replace("./events")
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headingcontainer}>
            <TouchableOpacity onPress={()=> router.replace("./events")} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#090040" />
            </TouchableOpacity>
            <Text style={styles.heading}>Create Event</Text>
        </View>
        <TextInput
          placeholderTextColor="#999"
          placeholder="Event Title"
          value={form.title}
          onChangeText={(val) => handleChange("title", val)}
          style={styles.input}
        />

        <TextInput
          placeholderTextColor="#999"
          placeholder="Description"
          value={form.description}
          onChangeText={(val) => handleChange("description", val)}
          style={styles.input}
        />

        {/* Start Time */}
        <Pressable onPress={() => showPicker("start")} style={styles.input}>
          <Text style={{ color: form.start_time ? "#000" : "#999" }}>
            {form.start_time ? new Date(form.start_time).toLocaleString() : "Pick Start Time"}
          </Text>
        </Pressable>

        {/* End Time */}
        <Pressable onPress={() => showPicker("end")} style={styles.input}>
          <Text style={{ color: form.end_time ? "#000" : "#999" }}>
            {form.end_time ? new Date(form.end_time).toLocaleString() : "Pick End Time"}
          </Text>
        </Pressable>

        {showDatePicker && showMode && (
          <DateTimePicker
            value={tempDate}
            mode={showMode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        <TextInput
          placeholderTextColor="#999"
          placeholder="Category (e.g. Work)"
          value={form.category}
          onChangeText={(val) => handleChange("category", val)}
          style={styles.input}
        />

        {/* State Selector */}
        {
          !form.is_recurring &&
        (  <View style={styles.stateContainer}>
            {STATES.map((s) => (
              <Pressable
                key={s}
                onPress={() => handleChange("state", s)}
                style={[
                  styles.stateButton,
                  form.state === s && styles.stateButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.stateText,
                    form.state === s && styles.stateTextActive,
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>  )
        }

        <TextInput
          placeholderTextColor="#999"
          placeholder="Location"
          value={form.location}
          onChangeText={(val) => handleChange("location", val)}
          style={styles.input}
        />

        <View>
          {/* Toggle Recurring */}
          <Pressable onPress={toggleRecurring} style={styles.recurringToggle}>
            <Ionicons
              name={form.is_recurring ? "repeat" : "repeat-outline"}
              size={22}
              color="#090040"
            />
            <Text style={styles.recurringText}>
              {form.is_recurring ? "Recurring Event" : "One-time Event"}
            </Text>
          </Pressable>

          {/* Animated Recurrence Section */}
          <Animated.View style={{ overflow: "hidden", height: animHeight }}>
            <View style={styles.recurringContainer}>
              {/* Frequency */}
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.row}>
                {FREQUENCIES.map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => handleChange("frequency", f)}
                    style={[
                      styles.option,
                      form.frequency === f && styles.optionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        form.frequency === f && styles.optionTextActive,
                      ]}
                    >
                      {f}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Interval */}
              <TextInput
                style={styles.input}
                placeholder="Interval (e.g., every 2 days)"
                keyboardType="numeric"
                value={form.interval.toString()}
                onChangeText={(val) => handleChange("interval", parseInt(val) || 1)}
              />

              {/* Days (Only if Weekly) */}
              {form.frequency === "Weekly" && (
                <View>
                  <Text style={styles.label}>Repeat on</Text>
                  <View style={styles.row}>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                      <Pressable
                        key={d}
                        onPress={() => {
                          let updated = form.by_day.includes(d)
                            ? form.by_day.filter((day) => day !== d)
                            : [...form.by_day, d];
                          handleChange("by_day", updated);
                        }}
                        style={[
                          styles.option,
                          form.by_day.includes(d) && styles.optionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            form.by_day.includes(d) && styles.optionTextActive,
                          ]}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Until Date */}
              <Pressable
                style={styles.input}
                onPress={() => setShowDatePicker("until")}
              >
                <Text style={{ color: form.until ? "#000" : "#999" }}>
                  {form.until
                    ? new Date(form.until).toLocaleString()
                    : "Ends on (optional)"}
                </Text>
              </Pressable>

              {showDatePicker === "until" && (
                <DateTimePicker
                  value={form.until ? new Date(form.until) : new Date()}
                  mode="date"
                  onChange={(e, d) => {
                    setShowDatePicker(null);
                    if (d) handleChange("until", d.toISOString());
                  }}
                />
              )}
            </View>
          </Animated.View>
        </View>

       

        {loading ? (
          <ActivityIndicator color="#090040" size="large" style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
          
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 25,
    marginHorizontal : 10,
    color: "#090040",
  },
  submitButton: {
    backgroundColor: "#090040",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  stateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  stateButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  stateButtonActive: {
    backgroundColor: "#090040",
  },
  stateText: {
    color: "#333",
  },
  stateTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  headingcontainer :{
    flexDirection : "row"
  },
  backButton :{
    margin : 0,
    padding : 0
  },
  recurringToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  recurringText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#090040",
    fontWeight: "500",
  },
  recurringContainer: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  optionActive: {
    backgroundColor: "#090040",
    borderColor: "#090040",
  },
  optionText: {
    color: "#333",
  },
  optionTextActive: {
    color: "#fff",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  }
});
