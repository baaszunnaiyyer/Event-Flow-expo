import { Text, TextInput } from "@/components/AppTypography";
import { SelectDropdownField } from "@/components/auth/SelectDropdownField";
import NextButtton from "@/components/NextButton";
import Paginator from "@/components/Paginator";
import {
  GENDER_OPTIONS,
  HEARD_ABOUT_OPTIONS,
  PLANNED_USE_OPTIONS,
} from "@/constants/countryDialCodes";
import { API_BASE_URL } from "@/utils/constants";
import {
  AUTH_FORM_CONTENT_PADDING_TOP,
  AUTH_PAGINATOR_FOOTER_PADDING_BOTTOM,
} from "@/constants/constants";
import {
  ALL_COUNTRIES,
  flagEmoji,
  UNIQUE_DIAL_CODES,
} from "@/utils/countryData";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { upsertTable } from "@/utils/db/SyncDB";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from "react-native";
import Toast from "react-native-toast-message";
import type { ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEP_COUNT = 5;
const STEPS = Array.from({ length: STEP_COUNT }, (_, i) => ({ id: String(i + 1) }));

function parseE164ToDialAndLocal(phone: string): { dial: string; local: string } | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const sorted = [...UNIQUE_DIAL_CODES].sort((a, b) => b.length - a.length);
  for (const dial of sorted) {
    if (digits.startsWith(dial)) {
      return { dial, local: digits.slice(dial.length) };
    }
  }
  return null;
}

type Props = {
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSignOut: () => void | Promise<void>;
  onComplete: () => void;
};

export function GoogleProfileWizard({ loading, setLoading, onSignOut, onComplete }: Props) {
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedCountryIso2, setSelectedCountryIso2] = useState(
    ALL_COUNTRIES[0]?.iso2 ?? "US"
  );
  const [dialCode, setDialCode] = useState(ALL_COUNTRIES[0]?.dialCode ?? "1");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [gender, setGender] = useState("");
  const [date_of_birth, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [heardAbout, setHeardAbout] = useState("");
  const [plannedUse, setPlannedUse] = useState<string[]>([]);
  const [prefillDone, setPrefillDone] = useState(false);

  const countryRow =
    ALL_COUNTRIES.find((c) => c.iso2 === selectedCountryIso2) ?? ALL_COUNTRIES[0];
  const country = countryRow.countryName;

  useEffect(() => {
    setDialCode(countryRow.dialCode);
  }, [selectedCountryIso2, countryRow.dialCode]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        const fullName = String(data.name ?? "").trim();
        if (fullName) {
          const parts = fullName.split(/\s+/);
          setFirstName(parts[0] ?? "");
          setLastName(parts.slice(1).join(" ") ?? "");
        }

        const cname = String(data.country ?? "").trim();
        if (cname) {
          const row = ALL_COUNTRIES.find((c) => c.countryName === cname);
          if (row) {
            setSelectedCountryIso2(row.iso2);
            setDialCode(row.dialCode);
          }
        }

        const phoneStr = String(data.phone ?? "").trim();
        if (phoneStr) {
          const parsed = parseE164ToDialAndLocal(phoneStr);
          if (parsed) {
            setDialCode(parsed.dial);
            setPhoneLocal(parsed.local);
          } else {
            setPhoneLocal(phoneStr.replace(/^\+/, ""));
          }
        }

        if (data.gender) setGender(String(data.gender));
        if (data.date_of_birth) {
          const raw = String(data.date_of_birth);
          setDob(raw.includes("T") ? raw.split("T")[0] : raw.slice(0, 10));
        }
      } catch (e) {
        console.warn("Google profile prefill:", e);
      } finally {
        setPrefillDone(true);
      }
    };
    load();
  }, []);

  const countryMenuItems = useMemo(
    () =>
      ALL_COUNTRIES.map((c) => ({
        value: c.iso2,
        label: `${flagEmoji(c.iso2)}  ${c.countryName}`,
        searchHint: `${c.dialCode} ${c.iso2}`,
      })),
    []
  );

  const dialMenuItems = useMemo(
    () =>
      UNIQUE_DIAL_CODES.map((code) => ({
        value: code,
        label: `+${code}`,
        searchHint: code,
      })),
    []
  );

  const genderMenuItems = useMemo(
    () => GENDER_OPTIONS.map((g) => ({ value: g, label: g })),
    []
  );

  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) setCurrentIndex(idx);
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const toastErr = (t1: string, t2: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    Toast.show({ type: "error", text1: t1, text2: t2 });
  };

  const validateStep = (index: number): boolean => {
    switch (index) {
      case 0:
        if (!firstName.trim() || !lastName.trim()) {
          toastErr("Missing name", "Please enter your first and last name.");
          return false;
        }
        return true;
      case 1: {
        const digits = phoneLocal.replace(/\D/g, "");
        if (digits.length < 6) {
          toastErr("Phone", "Please enter a valid phone number.");
          return false;
        }
        return true;
      }
      case 2:
        if (!gender) {
          toastErr("Gender", "Please select your gender.");
          return false;
        }
        if (!date_of_birth) {
          toastErr("Date of birth", "Please select your date of birth.");
          return false;
        }
        return true;
      case 3:
        if (!heardAbout) {
          toastErr("Almost there", "Tell us how you heard about us.");
          return false;
        }
        return true;
      case 4:
        if (plannedUse.length === 0) {
          toastErr("Almost there", "Select at least one way you plan to use the app.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    if (loading) return;
    if (!validateStep(4)) return;

    const username = `${firstName.trim()} ${lastName.trim()}`.trim();
    const phone = `+${dialCode}${phoneLocal.replace(/\D/g, "")}`;
    const dobIso = date_of_birth
      ? date_of_birth.includes("T")
        ? date_of_birth
        : new Date(date_of_birth + "T00:00:00.000Z").toISOString()
      : "";

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const userId = await SecureStore.getItemAsync("userId");
      if (!token || !userId) {
        toastErr("Session", "Please sign in again.");
        return;
      }

      const getRes = await fetch(`${API_BASE_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!getRes.ok) {
        toastErr("Error", "Could not load your profile.");
        return;
      }
      const baseSettings = await getRes.json();

      const payload = {
        ...baseSettings,
        name: username,
        phone,
        country,
        gender,
        date_of_birth: dobIso,
      };

      const putRes = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const putData = await putRes.json().catch(() => ({}));

      if (!putRes.ok) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: String(putData.message ?? "Could not update profile."),
        });
        return;
      }

      await queueDB(() =>
        upsertTable(
          "users",
          ["user_id"],
          [payload],
          [
            "user_id",
            "name",
            "email",
            "phone",
            "date_of_birth",
            "gender",
            "country",
            "is_private",
            "availability_day_of_week",
            "availability_start_time",
            "availability_end_time",
            "created_at",
            "status",
            "timezone",
            "updated_at",
          ]
        )
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Your profile is ready.",
      });
      onComplete();
    } catch (e) {
      console.error("Google profile complete:", e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentIndex >= STEP_COUNT - 1) {
      handleComplete();
      return;
    }
    if (!validateStep(currentIndex)) return;
    flatListRef.current?.scrollToIndex({
      index: currentIndex + 1,
      animated: true,
    });
  };

  const getItemLayout = (_: unknown, index: number) => ({
    length: windowWidth,
    offset: windowWidth * index,
    index,
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const renderStep = ({ index }: ListRenderItemInfo<{ id: string }>) => {
    const pagePad = {
      paddingHorizontal: 24,
      width: windowWidth,
      paddingTop: AUTH_FORM_CONTENT_PADDING_TOP,
    };

    if (index === 0) {
      return (
        <View style={[styles.page, { width: windowWidth }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, pagePad]}
          >
            <Text style={styles.stepLabel}>Step 1 of 5</Text>
            <Text style={styles.stepTitle}>About you</Text>
            <Text style={styles.stepSubtitle}>We will use this for your profile.</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#889"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor="#889"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </ScrollView>
        </View>
      );
    }

    if (index === 1) {
      const countryDisplay = `${flagEmoji(countryRow.iso2)}  ${countryRow.countryName}`;
      return (
        <View style={[styles.page, { width: windowWidth }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, pagePad]}
          >
            <Text style={styles.stepLabel}>Step 2 of 5</Text>
            <Text style={styles.stepTitle}>Country & phone</Text>
            <Text style={styles.stepSubtitle}>
              Choose your country, then your dial code and mobile number.
            </Text>
            <SelectDropdownField
              label="Country"
              placeholder="Select country"
              value={selectedCountryIso2}
              displayText={countryDisplay}
              items={countryMenuItems}
              onSelect={setSelectedCountryIso2}
              modalTitle="Select country"
              searchable
            />
            <View style={styles.phoneRow}>
              <View style={styles.dialCol}>
                <SelectDropdownField
                  label="Code"
                  placeholder="Code"
                  value={dialCode}
                  displayText={`+${dialCode}`}
                  items={dialMenuItems}
                  onSelect={setDialCode}
                  modalTitle="Country code"
                  style={styles.dialFieldInRow}
                />
              </View>
              <View style={styles.phoneCol}>
                <Text style={styles.fieldLabel}>Mobile number</Text>
                <TextInput
                  style={styles.inputPhoneRow}
                  placeholder="Phone number"
                  placeholderTextColor="#889"
                  keyboardType="phone-pad"
                  value={phoneLocal}
                  onChangeText={setPhoneLocal}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    if (index === 2) {
      return (
        <View style={[styles.page, { width: windowWidth }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, pagePad]}
          >
            <Text style={styles.stepLabel}>Step 3 of 5</Text>
            <Text style={styles.stepTitle}>Profile details</Text>
            <Text style={styles.stepSubtitle}>Gender and birthday.</Text>
            <SelectDropdownField
              label="Gender"
              placeholder="Select gender"
              value={gender}
              displayText={gender}
              items={genderMenuItems}
              onSelect={setGender}
              modalTitle="Gender"
              searchable={false}
            />
            <Text style={styles.fieldLabel}>Date of birth</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <TextInput
                style={styles.input}
                placeholder="Tap to choose date"
                placeholderTextColor="#889"
                value={date_of_birth}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date_of_birth ? new Date(date_of_birth) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_e, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDob(selectedDate.toISOString().split("T")[0]);
                  }
                }}
              />
            )}
          </ScrollView>
        </View>
      );
    }

    if (index === 3) {
      return (
        <View style={[styles.page, { width: windowWidth }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, pagePad]}
          >
            <Text style={styles.stepLabel}>Step 4 of 5</Text>
            <Text style={styles.stepTitle}>How did you hear about us?</Text>
            <View style={styles.chipGrid}>
              {HEARD_ABOUT_OPTIONS.map((opt) => {
                const selected = heardAbout === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setHeardAbout(opt);
                    }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={[styles.page, { width: windowWidth }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.pageScroll, pagePad, { paddingBottom: 48 }]}
        >
          <Text style={styles.stepLabel}>Step 5 of 5</Text>
          <Text style={styles.stepTitle}>What will you use Event Flow for?</Text>
          <Text style={styles.stepSubtitle}>Select all that apply.</Text>
          <View style={styles.chipGrid}>
            {PLANNED_USE_OPTIONS.map((opt) => {
              const selected = plannedUse.includes(opt);
              return (
                <Pressable
                  key={opt}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setPlannedUse((prev) =>
                      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                    );
                  }}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || !prefillDone) && styles.primaryBtnDisabled]}
            onPress={handleComplete}
            disabled={loading || !prefillDone}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Complete profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const percentage = ((currentIndex + 1) / STEP_COUNT) * 100;

  if (!prefillDone) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator size="large" color="#090040" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.flex}>
        <TouchableOpacity
          style={[styles.backRow, { paddingTop: Math.max(insets.top, 12) }]}
          onPress={() => void onSignOut()}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#090040" />
          <Text style={styles.backText}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.listWrap}>
          <FlatList
            ref={flatListRef}
            data={STEPS}
            renderItem={renderStep}
            keyExtractor={(s) => s.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={onScroll}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
            getItemLayout={getItemLayout}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={5}
            windowSize={3}
            onScrollToIndexFailed={(info) => {
              setTimeout(
                () =>
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  }),
                100
              );
            }}
          />
        </View>

        <View
          style={[
            styles.wizardFooter,
            {
              paddingBottom: insets.bottom + AUTH_PAGINATOR_FOOTER_PADDING_BOTTOM,
            },
          ]}
        >
          <View style={styles.paginatorOuter}>
            <Paginator data={STEPS} scrollx={scrollX} />
          </View>
          <NextButtton scrollTo={goNext} percentage={percentage} compact />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "rgba(247, 247, 247, 1)" },
  centered: { justifyContent: "center", alignItems: "center" },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  wizardFooter: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
  },
  paginatorOuter: {
    width: "100%",
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    color: "#090040",
  },
  listWrap: {
    flex: 3,
  },
  page: {
    flex: 1,
  },
  pageScroll: {
    paddingBottom: 32,
  },
  stepLabel: {
    fontSize: 13,
    color: "#6b6b80",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  stepTitle: {
    fontSize: 24,
    color: "#090040",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#5c5c6f",
    marginBottom: 22,
    lineHeight: 21,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#090040",
    marginBottom: 8,
    marginTop: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  dialCol: {
    width: 118,
  },
  phoneCol: {
    flex: 1,
    minWidth: 0,
  },
  dialFieldInRow: {
    marginBottom: 0,
  },
  inputPhoneRow: {
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "rgba(9, 0, 64, 0.08)",
    fontSize: 16,
    color: "#111",
  },
  input: {
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(9, 0, 64, 0.08)",
    fontSize: 16,
    color: "#111",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(9, 0, 64, 0.12)",
  },
  chipSelected: {
    backgroundColor: "#090040",
    borderColor: "#090040",
  },
  chipText: {
    fontSize: 14,
    color: "#090040",
  },
  chipTextSelected: {
    color: "#fff",
  },
  primaryBtn: {
    backgroundColor: "#090040",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    shadowColor: "#090040",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
  },
});
