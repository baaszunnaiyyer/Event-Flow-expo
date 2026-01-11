import { Creator } from "@/types/model";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { upsertTable } from "@/utils/db/SyncDB";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getAuth, GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "../../utils/constants";

WebBrowser.maybeCompleteAuthSession();

const screenWidth = Dimensions.get("window").width;
const inputWidth = screenWidth * 0.8;

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date_of_birth, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  GoogleSignin.configure({
      webClientId: '556429365376-7s2h4hid83pfn2gv14ga627pjh9un5ai.apps.googleusercontent.com',
    });
  
    const signIn = async () => {    
      setLoading(true)
      try {
        // Ensure Play Services are available
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
        // ✅ Force sign out first so popup always appears
        await GoogleSignin.signOut();
        
        // Get the users ID token
        const signInResult = await GoogleSignin.signIn();
  
        const response  = await fetch(`${API_BASE_URL}/auth/google`, {
          method : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body : JSON.stringify({idToken : signInResult.data?.idToken})
        });
  
        const data = await response.json(); // 👈 parse actual JSON
  
        if (response.status === 201) {
          
        } else if (response.status === 200) {
          await SecureStore.setItemAsync("userToken", data.token);
          await SecureStore.setItemAsync("userId", data.user.user_id)

          const res = await fetch(`${API_BASE_URL}/settings`, { headers: { Authorization: data.token } })
          const settingsRes : Creator = await res.json();

          queueDB(()=>
            upsertTable("users", ["user_id"], [settingsRes], 
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
                "timezone", 
                "created_at", 
                "updated_at", 
                "status"
              ])
          )
          

          router.replace("./loading");
        } else {
          Toast.show({
            type : 'error',
            text1 : "Error",
            text2 : `Unexpected status: ${response.status}`
          });
          setLoading(false);
          return;
        }
  
        // Try the new style of google-sign in result, from v13+ of that module
        const idToken = signInResult.data?.idToken;      
        
        if (!idToken) {
          throw new Error('No ID token found');
        }
  
        // Create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);
        
  
        setLoading(false)
        // Sign-in the user with Firebase
        return signInWithCredential(getAuth(), googleCredential);
  
      } catch (error : any) {
        // Enhanced error logging for debugging
        console.error("Google Sign-In Error Details:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
          toString: error.toString()
        });
        
        if (isErrorWithCode(error)) {
          switch (error.code) {
            case statusCodes.IN_PROGRESS:
              Toast.show({
                type: "info",
                text1: "Sign-In",
                text2: "Sign-in already in progress",
              });
              break;
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              Toast.show({
                type: "error",
                text1: "Google Sign-In",
                text2: "Play Services not available or outdated",
              });
              break;
            default:
              Toast.show({
                type: "error",
                text1: "Google Sign-In Error",
                text2: error.message || "Something went wrong",
              });
          }
        } else {
          Toast.show({
            type: "error",
            text1: "Unknown Error",
            text2: error.message || "An unexpected error occurred",
          });
        }
      }
      finally {
        setLoading(false)
      }
    };

  useEffect(() => {
    if (email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(emailRegex.test(email) ? "" : "Invalid email format");
    } else {
      setEmailError("");
    }
  }, [email]);

  useEffect(() => {
    if (confirmPassword.length > 0 && password.length > 0) {
      setPasswordError(password === confirmPassword ? "" : "Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      if (token) {
        router.replace("/(tabs)");
      }
    };
    checkToken();
  }, []);

  const handleSignUp = async () => {
    if (
      !username ||
      !email ||
      !phone ||
      !date_of_birth ||
      !gender ||
      !country ||
      !password ||
      !confirmPassword
    ) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in all fields.",
      });
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address.",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Password Mismatch",
        text2: "Passwords do not match.",
      });
      return;
    }

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const startTime = now.toISOString();
    const endTime = oneHourLater.toISOString();

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          phone,
          date_of_birth,
          gender,
          country,
          password,
          startTime,
          endTime,
          location: country,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        Toast.show({type :"success", text1 : "Sucess", text2 : "Please Check your Email For further Verification"})
        router.back();
      } else {
        Toast.show({type : 'error', text1 : 'Error', text2 : (`Registration Failed ${data.message}`) || "Something went wrong."});
      }
    } catch (error) {
      console.error("SignUp Error:", error);
      Toast.show({type : 'error', text1 : 'Error', text2 : "Error, Could not register. Please try again."});
    } finally {
      setLoading(false);
    }
  };

  const handleLoginLink = () => {
    router.replace("../(auth)");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "rgba(247, 247, 247, 1)" }}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image
                source={require("../../assets/images/undraw_stars_5pgw.png")}
                style={styles.logo}
                resizeMode="contain"
              />
        
        <View style={{ width: inputWidth, alignSelf: "center" }}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to get started</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              style={styles.input}
              placeholder="Date of Birth"
              placeholderTextColor="#888"
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
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDob(selectedDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
                }
              }}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Gender"
            placeholderTextColor="#888"
            value={gender}
            onChangeText={setGender}
          />

          <TextInput
            style={styles.input}
            placeholder="Country"
            placeholderTextColor="#888"
            value={country}
            onChangeText={setCountry}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <TouchableOpacity onPress={handleSignUp} style={styles.signUpBtn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signUpText}>Sign Up</Text>}
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Google Sign Up Button */}
          <TouchableOpacity onPress={signIn} style={styles.googleBtn} disabled={loading}>
            <Ionicons name="logo-google" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.googleBtnText}>Sign up with Google</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Already have an account?
            <TouchableOpacity onPress={handleLoginLink}>
              <Text style={styles.linkText}> Login </Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "rgba(247, 247, 247, 1)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 40,
    
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#090040",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#090040",
    marginBottom: 30,
  },
  logo: {
    width: "35%",
    height: "15%",
    marginVertical: 25,
  },
  input: {
    height: 50,
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 2,
    color: "#000",
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 13,
  },
  signUpBtn: {
    backgroundColor: "#090040",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signUpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom: 20,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  footerText: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    marginBottom : 150
  },
  linkText: {
    color: "#090040",
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -15,
    marginBottom: 15,
    paddingLeft: 5,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#777",
    fontWeight: "500",
  }
});
